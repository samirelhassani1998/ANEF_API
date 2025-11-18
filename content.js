const CONFIG = {
  URL_PATTERN: "administration-etrangers-en-france",
  TAB_NAME: "Demande d'accès à la Nationalité Française",
  API_ENDPOINT:
    "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper",
  WAIT_TIME: 150
};

// Exit early if not on the expected domain
if (!window.location.href.includes(CONFIG.URL_PATTERN)) {
  return;
}

// Formats a date string into dd/mm/yyyy hhHmm format
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}h${mi}`;
}

// Creates the floating text panel for status display
function createStatusPanel() {
  const existing = document.getElementById("anef-status-panel");
  if (existing) return existing;

  const panel = document.createElement("div");
  panel.id = "anef-status-panel";
  panel.textContent = "ANEF: chargement du statut...";
  panel.style.position = "fixed";
  panel.style.right = "16px";
  panel.style.bottom = "16px";
  panel.style.backgroundColor = "white";
  panel.style.border = "1px solid #ccc";
  panel.style.padding = "10px";
  panel.style.fontSize = "12px";
  panel.style.maxWidth = "260px";
  panel.style.zIndex = "999999";
  panel.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";

  document.body.appendChild(panel);
  return panel;
}

// Polls the page until the target tab is found and clicked
async function activateTargetTab() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const tabs = Array.from(document.querySelectorAll('a[role="tab"]'));
      const target = tabs.find(
        (tab) => tab.textContent && tab.textContent.trim() === CONFIG.TAB_NAME
      );

      if (target) {
        clearInterval(interval);
        target.click();
        setTimeout(resolve, 700); // allow content to load after click
      }
    }, CONFIG.WAIT_TIME);
  });
}

(async function () {
  const panel = createStatusPanel();

  try {
    // Ensure the correct tab is active to mimic user flow
    await activateTargetTab();

    // Call ANEF API to retrieve dossier information
    const response = await fetch(CONFIG.API_ENDPOINT, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const dossierData = await response.json();
    const rawStatus = dossierData?.dossier?.statut || "Inconnu";
    const createdAt = dossierData?.dossier?._created || "";
    const updatedAt = dossierData?.dossier?._updated || null;

    const formattedCreated = formatDate(createdAt);
    const formattedUpdated = formatDate(updatedAt) || "N/A";

    panel.textContent =
      `Statut ANEF (brut): ${rawStatus}\n` +
      `Création du dossier: ${formattedCreated}\n` +
      `Dernière mise à jour: ${formattedUpdated}`;
  } catch (error) {
    console.error("ANEF: unable to fetch status", error);
    panel.textContent = "ANEF: impossible de récupérer le statut (voir console)";
  }
})();
