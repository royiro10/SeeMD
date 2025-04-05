import "./editor.css";

import { Editor, CommandBar } from "tiny-markdown-editor";
import { convertTextToMarkdown } from "../lib/textToMarkdown";

export interface EditorProps {
    editorElement: HTMLElement;
    editorCommandBarElement: HTMLElement;
    outputElement: HTMLElement;
}

export function setupEditor(elements: EditorProps) {
    const tinyMDE = new Editor({
        element: elements.editorElement,
    });
    tinyMDE.addEventListener("change", (e) => updateMarkdownPreview(e.content));

    new CommandBar({
        element: elements.editorCommandBarElement,
        editor: tinyMDE,
    });

    const output = elements.outputElement;
    output.className += " content markdown-body";
    output.innerHTML = convertTextToMarkdown(tinyMDE.getContent());

    function updateMarkdownPreview(text: string) {
        output.innerHTML = convertTextToMarkdown(text);
    }

    return () => tinyMDE.getContent();
}

export function makeEditorElements() {
    const editorContainer = document.createElement("div");
    editorContainer.id = "editor-container";
    editorContainer.className += "column";

    const editor = document.createElement("div");
    editor.id = "editor";
    editor.style.height = "90%";

    const editorCommandBar = document.createElement("div");
    editorCommandBar.id = "editor_commandbar";
    editorCommandBar.style.height = "10%";

    editorContainer.appendChild(editorCommandBar);
    editorContainer.appendChild(editor);

    return {
        root: editorContainer,
        editor,
        editorCommandBar
    };
}