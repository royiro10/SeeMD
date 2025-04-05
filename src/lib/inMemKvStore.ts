import { IKeyValueStore } from "./kvStore";

export class InMemoryStore implements IKeyValueStore {
    private storage = new Map<string, string>();

    async set(key: string, value: string): Promise<void> {
        this.storage.set(key, value);
    }

    async get(key: string): Promise<string | undefined> {
        return this.storage.get(key);
    }

    // For debugging/testing.
    dump(): Record<string, string> {
        const obj: Record<string, string> = {};
        this.storage.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }
}