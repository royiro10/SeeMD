import { Marked } from "marked";
import DOMPurify from "dompurify";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

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

export function convertTextToMarkdown(text: string) {
    const html = marked.parse(text, { async: false });
    const sanitized = DOMPurify.sanitize(html);
    return sanitized;
}