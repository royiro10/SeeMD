import { IKeyValueStore } from "./kvStore";
import { PoolExecutor } from "./poolExecutor";

const MAX_CHUNK_SIZE = 64; // For testing
const CHUNK_PARALLEL_COUNT = 8;

/**
 * keyGen produces unique keys as strings.
 */
let counter = 0;
function keyGen(): string {
    // We'll use a simple counter closure.
    counter++;
    return `key${counter}`;
}

/**
 * Returns a safe split index that does not cut into a reference token.
 * It uses a natural split on space, but if that boundary would split
 * a reference token (i.e. a token starting with "[%" and ending with "]"),
 * it adjusts the split index to before the token.
 */
function safeSplitIndex(text: string, maxSize: number): number {
    // Try a natural split boundary (last space).
    let splitIndex = text.lastIndexOf(" ", maxSize);
    if (splitIndex === -1 || splitIndex === 0) {
        splitIndex = maxSize;
    }
    // Check if the candidate might cut a reference token.
    const tokenStart = text.lastIndexOf("[%", maxSize);
    if (tokenStart !== -1) {
        const tokenEnd = text.indexOf("]", tokenStart);
        // If there's no closing bracket or it lies beyond maxSize, we're cutting a token.
        if (tokenEnd === -1 || tokenEnd >= maxSize) {
            // Choose the earlier boundary: before the token begins.
            if (tokenStart > 0) {
                splitIndex = Math.min(splitIndex, tokenStart);
            }
        }
    }
    return splitIndex > 0 ? splitIndex : maxSize;
}

/**
 * Splits text into segments of at most maxSize characters,
 * ensuring that reference tokens are not cut.
 */
function splitTextSegments(text: string, maxSize: number): string[] {
    const segments: string[] = [];
    while (text.length > maxSize) {
        const splitIndex = safeSplitIndex(text, maxSize);
        const idx = splitIndex > 0 ? splitIndex : maxSize;
        segments.push(text.slice(0, idx));
        text = text.slice(idx);
    }
    if (text.length > 0) {
        segments.push(text);
    }
    return segments;
}

/**
 * Recursively stores the text in the store.
 *
 * 1. If the text length is ≤ MAX_CHUNK_SIZE, store it directly as a leaf.
 * 2. Otherwise, split it into segments and store each recursively.
 *    Then, concatenate the returned references.
 *    If that concatenation is longer than MAX_CHUNK_SIZE,
 *    re-chunk it recursively.
 *
 * Returns a reference string of the form "[%<key>]".
 */
export async function chunkTextAsync(text: string, store: IKeyValueStore): Promise<string> {
    const setTaskExecutor = new PoolExecutor(CHUNK_PARALLEL_COUNT);

    async function storeText(txt: string): Promise<string> {
        if (txt.length <= MAX_CHUNK_SIZE) {
            const key = keyGen();
            setTaskExecutor.submit(() => store.set(key, txt));
            return `[%${key}]`;
        } else {
            const segments = splitTextSegments(txt, MAX_CHUNK_SIZE);
            const refs: string[] = [];
            for (const seg of segments) {
                const ref = await storeText(seg);
                refs.push(ref);
            }
            const concatenated = refs.join("");
            if (concatenated.length <= MAX_CHUNK_SIZE) {
                const key = keyGen();
                setTaskExecutor.submit(() => store.set(key, concatenated));
                return `[%${key}]`;
            } else {
                // The concatenated reference string is too long, so re-chunk it.
                return await storeText(concatenated);
            }
        }
    }

    const rootRef = await storeText(text);
    await setTaskExecutor.waitAll();
    return rootRef;

}

/**
 * Recursively reconstructs the full text from the given root reference.
 *
 * It scans the text for tokens of the form "[%<key>]", fetches all referenced nodes in parallel,
 * recursively resolves any nested tokens, and replaces the tokens.
 */
export async function reconstructTextAsync(rootRef: string, store: IKeyValueStore, notiftyResolve: (key: string, content: string) => void = () => { }): Promise<string> {
    async function resolveReferences(text: string): Promise<string> {
        const regex = /\[%([^\]]+)\]/g;
        const matches = Array.from(text.matchAll(regex));
        if (matches.length === 0) return text;

        // Fetch all referenced chunks in parallel.
        const keys = matches.map(match => match[1]);
        const chunks = await Promise.all(keys.map(key => store.get(key)
            .then(data => {
                notiftyResolve(key, data ?? "ERROR NO CONTENT");
                return data;
            })
        ));

        // Resolve each chunk recursively.
        const resolvedChunks = await Promise.all(
            chunks.map(chunk => chunk ? resolveReferences(chunk) : Promise.resolve(""))
        );

        // Replace each token with its resolved text.
        let newText = text;
        matches.forEach((match, index) => {
            newText = newText.replace(match[0], resolvedChunks[index]);
        });

        // Continue resolving if any new tokens appear.
        return resolveReferences(newText);
    }
    return resolveReferences(rootRef);
}