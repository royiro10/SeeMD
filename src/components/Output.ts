import "./markdown.css";

import { IKeyValueStore } from "../lib/kvStore";
import { reconstructTextAsync } from "../lib/textChunking";
import { convertElementToMarkdown } from "../lib/textToMarkdown";

export async function setupOutputPreview(element: Element, rootRef: string, store: IKeyValueStore) {
    element.className += " content markdown-body";

    // Regular expression to match tokens like [%someKey]
    const tokenRegex = /\[%([^\]]+)\]/g;
    const tokenMatches: Record<string, string> = {};

    element.innerHTML = rootRef;
    tokenifyReferences();

    const reconstructed = await reconstructTextAsync(rootRef, store, onChunkReady);
    convertElementToMarkdown(element, reconstructed);

    function onChunkReady(key: string, content: string) {
        const tokenId = tokenMatches[key];
        const span = document.getElementById(tokenId);
        if (span) {
            span.outerHTML = content;
            tokenifyReferences();
        }
    }

    function tokenifyReferences() {
        element.innerHTML = element.innerHTML.replace(tokenRegex, (_, key) => {
            // Create a unique id for the placeholder
            // TODO: better key generation
            const id = "token_" + Math.random().toString(36).substr(2, 9);
            tokenMatches[key] = id;
            return `<span id="${id}" class="loading"></span>`;
        });
    }
}


export function makeOutputElements() {
    const outputContainer = document.createElement("div");
    outputContainer.id = "output-container";
    outputContainer.className += "column";

    const output = document.createElement("div");
    output.id = "output";
    output.className += "column-content";

    outputContainer.appendChild(output);

    return {
        root: outputContainer,
        output
    };
}