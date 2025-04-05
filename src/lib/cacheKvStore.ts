import { IKeyValueStore } from "./kvStore";

export class LocalStorageCachedKVStore implements IKeyValueStore {
    private readonly store: IKeyValueStore;
    private readonly prefix: string;

    constructor(store: IKeyValueStore, prefix = "") {
        this.store = store;
        this.prefix = `kv-cache:${prefix}`;
    }

    private getCacheKey(key: string): string {
        return this.prefix + key;
    }

    async set(key: string, value: string): Promise<void> {
        await this.store.set(key, value);
        localStorage.setItem(this.getCacheKey(key), value);
    }

    async get(key: string): Promise<string | undefined> {
        const cacheKey = this.getCacheKey(key);
        const cachedValue = localStorage.getItem(cacheKey);
        if (cachedValue !== null) {
            return cachedValue;
        }

        const value = await this.store.get(key);
        if (value !== undefined) {
            localStorage.setItem(cacheKey, value);
        }

        return value;
    }
}
