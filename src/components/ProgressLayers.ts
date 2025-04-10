import "./progressLayers.css";

interface IProgressBar {
    fill: HTMLDivElement;
    text: HTMLSpanElement;
    totalChunks: number;
    progress: number;
    container: HTMLDivElement; // Added container reference for cleanup
}

/**
 * Creates a progress bar with all necessary DOM elements
 */
function makeProgressBarElements(progressBarsContainer: HTMLElement, totalChunks: number): IProgressBar {
    const container = document.createElement("div");
    container.className = "progress-bar-container";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    progressBar.appendChild(fill);

    const text = document.createElement("span");
    text.className = "progress-bar-text";
    text.textContent = "0%";

    container.appendChild(progressBar);
    container.appendChild(text);

    // const progressBarsContainer = document.getElementById("progress-bars-container");
    if (!progressBarsContainer) {
        console.error("Progress bars container not found");
        throw new Error("Progress bars container not found");
    }
    progressBarsContainer.appendChild(container);

    return {
        fill,
        text,
        totalChunks,
        progress: 0,
        container // Store reference to container for cleanup
    };
}

/**
 * Updates the visual representation of a progress bar
 */
export function updateProgressBar(progressBar: IProgressBar): void {
    const percentage = Math.floor((progressBar.progress / progressBar.totalChunks) * 100);
    progressBar.fill.style.width = `${percentage}%`;
    progressBar.text.textContent = `${percentage}%`;
}

/**
 * Marks a progress bar as complete with visual indication
 */
export function markProgressBarComplete(progressBar: IProgressBar): void {
    progressBar.fill.classList.add("complete");
    progressBar.text.classList.add("complete");
    progressBar.text.textContent = "100%";
}

/**
 * Interface for the progress layer controller
 */
interface IProgressLayerController {
    onChunk: (key: number) => void;
    cleanup: () => Promise<void>;
    markAllComplete: () => void;
}

/**
 * Processes a large task by breaking it into chunks and tracking progress
 * across multiple progress bars
 */
export function createProgressLayer(
    progressBarsContainer: HTMLElement,
    layersCount: number,
    chunksCount: number,
): IProgressLayerController {
    // Fixed number of progress bars to distribute the work
    const NUM_BARS = layersCount;

    // Create a progress bar for each segment of work
    const progressBars: IProgressBar[] = [];
    for (let i = 0; i < NUM_BARS; i++) {
        const chunksForBar = Math.ceil(chunksCount / NUM_BARS);
        progressBars.push(makeProgressBarElements(progressBarsContainer, chunksForBar));
    }

    /**
     * Updates a progress bar based on the chunk key
     */
    const onChunk = (key: number): void => {
        const bar = progressBars[key % NUM_BARS];
        bar.progress++;
        updateProgressBar(bar);
    };

    /**
     * Removes all progress bars from the DOM and cleans up references
     */
    const cleanup = (): Promise<void> => {
        const progressBarsContainer = document.getElementById("progress-bars-container");
        if (!progressBarsContainer) return Promise.resolve();

        // Add a fade-out effect before removal
        progressBars.forEach(bar => {
            bar.container.classList.add("fade-out");
        });

        // Remove elements after the animation completes
        return new Promise<void>(res => {
            setTimeout(() => {
                progressBars.forEach(bar => {
                    if (bar.container.parentNode === progressBarsContainer) {
                        progressBarsContainer.removeChild(bar.container);
                    }
                });
                // Clear the array to help garbage collection
                progressBars.length = 0;
                res();
            }, 500); // Match this with the CSS transition duration
        });
    };

    /**
     * Marks all progress bars as complete
     */
    const markAllComplete = (): void => {
        progressBars.forEach(bar => {
            bar.progress = bar.totalChunks;
            markProgressBarComplete(bar);
        });
    };

    return {
        onChunk,
        cleanup,
        markAllComplete
    };
}