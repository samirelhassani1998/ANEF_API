// Inject forge and the main content script into the page context
function injectScript(file_path, tag) {
  return new Promise((resolve, reject) => {
    const node = document.getElementsByTagName(tag)[0];
    if (!node) return resolve(); // Should not happen usually
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", file_path);
    script.onload = resolve;
    script.onerror = reject;
    node.appendChild(script);
  });
}

(async () => {
  try {
    await injectScript(chrome.runtime.getURL("forge.min.js"), "body");
    await injectScript(chrome.runtime.getURL("content.js"), "body");
  } catch (e) {
    console.error("[ANEF Extension] Error injecting scripts:", e);
  }
})();
