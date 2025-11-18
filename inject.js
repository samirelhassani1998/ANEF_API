// Helper to inject a script tag into the page
function injectScript(filePath, tag) {
  const node = document.getElementsByTagName(tag)[0];
  if (!node) return;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = filePath;
  node.appendChild(script);
}

// Inject the main content script into the page context
injectScript(chrome.runtime.getURL("content.js"), "body");
