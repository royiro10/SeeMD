// highlight-copy-wrapper.ts

// Import the original class from CommonJS module
// @ts-ignore
import CopyButtonPlugin from "highlightjs-copy";
import "highlightjs-copy/dist/highlightjs-copy.min.css";

// Typings for hook and callback functions
export type CopyCallback = (text: string, el: HTMLElement) => void;
export type Hook = (text: string, el: HTMLElement) => string | undefined;

// Typings for the plugin options
export interface CopyButtonPluginOptions {
    callback?: CopyCallback;
    hook?: Hook;
    lang?: string;
    autohide?: boolean;
}

// Add a proper typed class wrapper
class TypedCopyButtonPlugin {
    private instance: any;

    constructor(options?: CopyButtonPluginOptions) {
        this.instance = new CopyButtonPlugin(options);
    }

    // Proxy to the internal method (you could expose more methods this way)
    public ['after:highlightElement'](args: { el: Element; text: string; }) {
        console.log(`hi`);
        return this.instance['after:highlightElement'](args);
    }
}

export default TypedCopyButtonPlugin;
