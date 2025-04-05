import "./header.css";

export function makeHeaderElements() {
    const headerContainer = document.createElement("header");
    headerContainer.className += "header-container";

    const title = document.createElement("h1");
    title.textContent = "SeeMD";

    const button = document.createElement("button");
    button.textContent = "Generate";
    button.id = "generate-button";

    const resultPlaceholder = document.createElement("div");
    resultPlaceholder.id = "result-placeholder";

    headerContainer.appendChild(title);
    headerContainer.appendChild(button);
    headerContainer.appendChild(resultPlaceholder);

    resultPlaceholder.addEventListener('click', function () {
        const textContent = resultPlaceholder.textContent;
        console.log('Text content:', textContent);
        if (!textContent) return;

        // Copy the text content to the clipboard
        navigator.clipboard.writeText(textContent)
            .then(() => {
                const originalText = button.textContent;
                button.textContent = "Copied!";
                setTimeout(() => {
                    button.textContent = originalText;
                }, 3 * 1000);
            })
            .catch(err => { console.error('Failed to copy text: ', err); });
    });

    return {
        root: headerContainer,
        resultPlaceholder,
        button,
    };
}