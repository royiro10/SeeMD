import "./index.css";

import { KVStoreFreeService } from './lib/kvStoreFreeService';
import { decodeUnicode, encodeUnicode } from "./lib/utils";
import { chunkTextAsync } from './lib/textChunking';

import { makeOutputElements, setupOutputPreview } from "./components/Output";
import { makeEditorElements, setupEditor } from "./components/Editor";
import { setupTheme } from "./components/Theme";
import { makeHeaderElements } from "./components/Header";

import { makeAppContainerElements } from "./App";
import { LocalStorageCachedKVStore } from "./lib/cacheKvStore";

document.addEventListener("DOMContentLoaded", main);

async function main() {
  setupTheme("theme-midnight");

  const [base, existingAppKey, rootRef] = window.location.pathname.split("/").slice(1);

  console.log(existingAppKey, rootRef);
  let { store, appKey } = await createStore(existingAppKey);
  const app = document.body;

  const headerElements = makeHeaderElements();
  const appContainer = makeAppContainerElements();
  const outputElements = makeOutputElements();
  const editorElements = makeEditorElements();

  console.log("Extracted Key:", rootRef);

  if (rootRef) {
    appContainer.root.style.height = "100vh";
    outputElements.output.style.height = "100%";
    setupOutputPreview(outputElements.output, decodeUnicode(rootRef), store);
  } else {
    appContainer.root.appendChild(editorElements.root);
    const getContent = setupEditor({
      editorElement: editorElements.editor,
      editorCommandBarElement: editorElements.editorCommandBar,
      outputElement: outputElements.output
    });

    headerElements.button.onclick = async () => {
      const originalText = headerElements.button.textContent;
      headerElements.button.textContent = "Generating...";

      try {
        const originUrl = window.location.origin;
        const data = await chunkTextAsync(getContent(), store);

        headerElements.resultPlaceholder.textContent = `${originUrl}/${base}/${appKey}/${encodeUnicode(data)}`;
        const updatedStoreAndKey = await createStore();
        store = updatedStoreAndKey.store;
        appKey = updatedStoreAndKey.appKey;
      } catch (err) {
        headerElements.resultPlaceholder.textContent = `Failed to Generate: ${err}`;
      } finally {
        headerElements.button.textContent = originalText;
      }
    };



    app.appendChild(headerElements.root);
  }

  appContainer.root.appendChild(outputElements.root);
  app.appendChild(appContainer.root);
}

async function createStore(appKey?: string) {
  if (!appKey) {
    appKey = await KVStoreFreeService.generateAppKey();
  }

  const apiStore = new KVStoreFreeService(appKey);
  const store = new LocalStorageCachedKVStore(apiStore, appKey);

  return { store, appKey };
}

