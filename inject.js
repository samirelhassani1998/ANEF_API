// Inject forge and the main content script into the page context
function injectScript(file_path, tag) {
  const node = document.getElementsByTagName(tag)[0];
  if (!node) return;
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
}

injectScript(chrome.runtime.getURL("forge.min.js"), "body");
injectScript(chrome.runtime.getURL("content.js"), "body");
