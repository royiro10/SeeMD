export class PoolExecutor {
    private concurrency: number;
    private queue: (() => Promise<void>)[] = [];
    private activeCount = 0;
    private resolveWaitAll: (() => void) | null = null;

    constructor(concurrency: number) {
        this.concurrency = concurrency;
    }

    async submit<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const runTask = async () => {
                this.activeCount++;
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeCount--;
                    this.processQueue();
                    this.checkCompletion();
                }
            };

            this.queue.push(runTask);
            this.processQueue();
        });
    }

    private processQueue() {
        while (this.activeCount < this.concurrency && this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                task();
            }
        }
    }

    async waitAll(): Promise<void> {
        if (this.activeCount === 0 && this.queue.length === 0) {
            return; // No tasks to wait for
        }

        return new Promise<void>((resolve) => {
            this.resolveWaitAll = resolve;
            this.checkCompletion();
        });
    }

    private checkCompletion() {
        if (this.activeCount === 0 && this.queue.length === 0 && this.resolveWaitAll) {
            this.resolveWaitAll();
            this.resolveWaitAll = null;
        }
    }
}
