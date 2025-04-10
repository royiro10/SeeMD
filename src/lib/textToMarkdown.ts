import { Marked } from "marked";
import DOMPurify from "dompurify";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

import CopyButtonPlugin from "./highlight-copy-wrapper";

hljs.addPlugin(
    new CopyButtonPlugin({})
);

const marked = new Marked(
    markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, _info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlight = hljs.highlight(code, { language }).value;
            return highlight;
        }
    })
);

export function convertElementToMarkdown(element: Element, text: string) {
    const html = marked.parse(text, { async: false });
    const sanitized = DOMPurify.sanitize(html);

    element.innerHTML = sanitized;

    // hljs after highlights plugins (for copy button)
    element.querySelectorAll('pre code').forEach((block) => {
        const safeCode = DOMPurify.sanitize(block.innerHTML); // Ensure sanitized code content
        block.innerHTML = safeCode; // Re-assign sanitized content to the block
        hljs.highlightElement(block as HTMLElement);
    });
}