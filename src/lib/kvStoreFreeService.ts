import { IKeyValueStore } from "./kvStore";
import { PoolExecutor } from "./poolExecutor";
import { decodeUnicode, encodeUnicode } from "./utils";

const API_BASE_URL = "https://keyvalue.immanuel.co/api/KeyVal";

export class KVStoreFreeService implements IKeyValueStore {
    public static MAX_VALUE_SIZE = 1024;
    private static readonly PARALLEL_COUNT = 16;
    private static readonly pool = new PoolExecutor(KVStoreFreeService.PARALLEL_COUNT);

    private readonly appKey: string;

    constructor(appKey: string) {
        this.appKey = appKey;
    }

    public static async generateAppKey(): Promise<string> {
        const appKey = await this.getAppKey();
        console.log(`generated new App Key: ${appKey}`);
        return appKey;
    }

    public async set(key: string, value: string): Promise<void> {
        const encodedValue = this.encode(value);
        await this.updateValue(this.appKey, key, encodedValue);
        console.log(`set: ${key} => ${value}. (${encodedValue})`);
    }

    public async get(key: string): Promise<string | undefined> {
        const encodedValue = await this.getValue(this.appKey, key);
        console.log(encodedValue);
        const value = this.decode(encodedValue);
        console.log(`get: ${key} => ${value}`);
        return value;

    }

    private encode(text: string): string {
        const base64 = encodeUnicode(text);
        if (base64.length >= KVStoreFreeService.MAX_VALUE_SIZE) {
            console.warn(`encoding will loose data. 
original size: ${text.length}
encoded size: ${base64.length}
original text: ${text}
`);
        }

        return base64;
    }

    private decode(base64: string): string {
        const decodedText = decodeUnicode(base64);
        return decodedText;
    }

    private async getValue(appKey: string, itemKey: string): Promise<string> {
        return KVStoreFreeService.pool.submit(async () => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", `${API_BASE_URL}/GetValue/${appKey}/${itemKey}`, true);

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText) /* trick way to parse this annoying API*/);
                    } else {
                        reject(new Error(`Request failed with status: ${xhr.status} ${xhr.statusText}`));
                    }
                };

                xhr.onerror = function () {
                    reject(new Error("Network error occurred"));
                };

                xhr.send();
            });
        });
    }

    private async updateValue(appKey: string, itemKey: string, itemValue: string): Promise<void> {
        return KVStoreFreeService.pool.submit(async () => {
            if (itemValue.length >= KVStoreFreeService.MAX_VALUE_SIZE) {
                console.warn("item will fail");
            }

            await fetch(`${API_BASE_URL}/UpdateValue/${appKey}/${itemKey}/${itemValue}`, {
                method: "POST",
                mode: "no-cors"
            });
        });
    }

    private static async getAppKey() {
        return KVStoreFreeService.pool.submit(async () => {
            return new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", `${API_BASE_URL}/GetAppKey/`, true);

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText) /* trick way to parse this annoying API*/);
                    } else {
                        reject(new Error(`Request failed with status: ${xhr.status} ${xhr.statusText}`));
                    }
                };

                xhr.onerror = function () {
                    reject(new Error("Network error occurred"));
                };

                xhr.send();
            });
        });
    }

}