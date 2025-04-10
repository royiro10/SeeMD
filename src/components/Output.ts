import "./markdown.css";
import "./output.css";

import { IKeyValueStore } from "../lib/kvStore";
import { reconstructTextAsync } from "../lib/textChunking";
import { convertElementToMarkdown } from "../lib/textToMarkdown";
import { createProgressLayer } from "./ProgressLayers";

export async function setupOutputPreview(element: Element, rootRef: string, store: IKeyValueStore) {
    element.className += " content markdown-body";

    const laterCount = calculateOptimalLayersCount(80);
    console.log(`Layers: ${laterCount}`);

    const loadingContainer = document.createElement("div");
    loadingContainer.id = "progress-bars-container";

    element.appendChild(loadingContainer);

    const expectedChunksCount = parseKey(rootRef)!;
    const progressLayer = createProgressLayer(loadingContainer, laterCount, expectedChunksCount);

    const reconstructed = await reconstructTextAsync(rootRef, store, onChunkReady);

    progressLayer.markAllComplete();
    await progressLayer.cleanup();
    element.removeChild(loadingContainer);

    convertElementToMarkdown(element, reconstructed);

    function onChunkReady(key: string, content: string) {
        progressLayer.onChunk(parseInt(key.slice(3)));
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

function calculateOptimalLayersCount(
    screenHeightPercentage: number = 55,
    estimatedBarHeight: number = 40
): number {
    // Get the viewport height
    const viewportHeight = window.innerHeight;

    // Calculate available height (50-60% of viewport)
    const availableHeight = (viewportHeight * screenHeightPercentage) / 100;

    // Calculate how many bars can fit
    const optimalCount = Math.floor(availableHeight / estimatedBarHeight);

    // Ensure at least 1 bar and cap at a reasonable maximum
    return Math.max(1, Math.min(optimalCount, 20));
}


const pattern = /\[%key(\d+)\]/;

function parseKey(input: string): number | null {
    const match = input.match(pattern);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}