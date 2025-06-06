import "./editor.css";

import { Editor, CommandBar, CommandBarCommand } from "tiny-markdown-editor";
import { convertElementToMarkdown } from "../lib/textToMarkdown";

export interface EditorProps {
    editorElement: HTMLElement;
    editorCommandBarElement: HTMLElement;
    outputElement: HTMLElement;
}

const EditorPlaceHolder = `
# ✨ Welcome to SeeMD  
> Start editing your Markdown here...

\`\`\`js
function haveFun() {
  assert(InternalAPI.isHavingFun());
}
\`\`\`
`;

const DefaultTinyCommandBar = ['bold', 'italic', 'strikethrough', '|', 'code', '|', 'h1', 'h2', '|', 'ul', 'ol', '|', 'blockquote', 'hr', '|', 'insertLink', 'insertImage'] as CommandBarCommand[];
const TrashSvg = `<svg width="18" height="18">
<path d="M0.982,5.073 L2.007,15.339 C2.007,15.705 2.314,16 2.691,16 L10.271,16 C10.648,16 10.955,15.705 10.955,15.339 L11.98,5.073 L0.982,5.073 L0.982,5.073 Z M7.033,14.068 L5.961,14.068 L5.961,6.989 L7.033,6.989 L7.033,14.068 L7.033,14.068 Z M9.033,14.068 L7.961,14.068 L8.961,6.989 L10.033,6.989 L9.033,14.068 L9.033,14.068 Z M5.033,14.068 L3.961,14.068 L2.961,6.989 L4.033,6.989 L5.033,14.068 L5.033,14.068 Z" class="si-glyph-fill"></path>
<path d="M12.075,2.105 L8.937,2.105 L8.937,0.709 C8.937,0.317 8.481,0 8.081,0 L4.986,0 C4.586,0 4.031,0.225 4.031,0.615 L4.031,2.011 L0.886,2.105 C0.485,2.105 0.159,2.421 0.159,2.813 L0.159,3.968 L12.8,3.968 L12.8,2.813 C12.801,2.422 12.477,2.105 12.075,2.105 L12.075,2.105 Z M4.947,1.44 C4.947,1.128 5.298,0.875 5.73,0.875 L7.294,0.875 C7.726,0.875 8.076,1.129 8.076,1.44 L8.076,2.105 L4.946,2.105 L4.946,1.44 L4.947,1.44 Z" class="si-glyph-fill"></path>
</svg>`;

export function setupEditor(elements: EditorProps) {
    const tinyMDE = new Editor({
        element: elements.editorElement,
        content: EditorPlaceHolder
    });
    tinyMDE.addEventListener("change", (e) => updateMarkdownPreview(e.content));

    const clearCommand = {
        name: "clear",
        innerHTML: TrashSvg,
        action: (editor: Editor) => {
            editor.setContent("");
        },
    };

    new CommandBar({
        element: elements.editorCommandBarElement,
        editor: tinyMDE,
        commands: [...DefaultTinyCommandBar, "|", clearCommand]
    });

    const output = elements.outputElement;
    output.className += " content markdown-body";
    updateMarkdownPreview(tinyMDE.getContent());

    function updateMarkdownPreview(text: string) {
        convertElementToMarkdown(output, text);
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