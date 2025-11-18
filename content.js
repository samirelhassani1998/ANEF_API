(() => {
  const CONFIG = {
    URL_PATTERN: "administration-etrangers-en-france",
    API_ENDPOINT:
      "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper"
  };

  // Only run on ANEF
  if (!window.location.href.includes(CONFIG.URL_PATTERN)) {
    return;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

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

  function createPanel() {
    let panel = document.getElementById("anef-status-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "anef-status-panel";

      Object.assign(panel.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "8px",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "260px",
        zIndex: 999999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        whiteSpace: "normal",
        lineHeight: "1.4"
      });

      panel.textContent = "ANEF : chargement du statut…";
      document.body.appendChild(panel);
    }

    return {
      setLoading() {
        panel.textContent = "ANEF : chargement du statut…";
      },
      setError(message) {
        panel.textContent =
          "ANEF : impossible de récupérer le statut.\n" +
          (message ? `(${message})` : "Voir la console.");
      },
      setData(data) {
        const { status, createdAt, updatedAt, raw } = data;

        panel.innerHTML = `
          <strong>ANEF – statut brut :</strong> ${escapeHtml(
            status ?? "Inconnu"
          )}<br/>
          <strong>Création :</strong> ${escapeHtml(
            createdAt || "N/A"
          )}<br/>
          <strong>Dernière mise à jour :</strong> ${escapeHtml(
            updatedAt || "N/A"
          )}<br/>
          <details style="margin-top:4px;">
            <summary style="cursor:pointer;">JSON brut</summary>
            <pre style="white-space:pre-wrap;max-height:200px;overflow:auto;margin-top:4px;">${escapeHtml(
              JSON.stringify(raw, null, 2)
            )}</pre>
          </details>
        `;
      }
    };
  }

  async function fetchStatus() {
    const response = await fetch(CONFIG.API_ENDPOINT, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const json = await response.json();
    const dossier = (json && json.dossier) || {};

    const status = dossier.statut || dossier.status || null;

    const createdRaw =
      dossier._created ||
      dossier.date_creation ||
      dossier.dateCreation ||
      null;

    const updatedRaw =
      dossier._updated ||
      dossier.date_derniere_modification ||
      dossier.dateDerniereMAJ ||
      null;

    return {
      status,
      createdAt: createdRaw ? formatDate(createdRaw) : null,
      updatedAt: updatedRaw ? formatDate(updatedRaw) : null,
      raw: json
    };
  }

  async function init() {
    const panel = createPanel();
    panel.setLoading();

    try {
      const data = await fetchStatus();
      console.log("ANEF Dossier Status – données reçues :", data.raw);
      panel.setData(data);
    } catch (err) {
      console.error("ANEF Dossier Status – erreur :", err);
      panel.setError(err.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
