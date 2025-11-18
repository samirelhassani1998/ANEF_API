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

  // Map of raw API statuses -> human readable interpretation in French.
  // These descriptions are approximate but follow common explanations used by lawyers and forums.
  const STATUS_DESCRIPTIONS = {
    // Dossier au tout début
    DOSSIER_A_COMPLETER:
      "Dossier incomplet : des pièces justificatives sont encore attendues",
    CONTROLE_A_EFFECTUER:
      "Préfecture : contrôles administratifs à lancer sur votre dossier",
    INSTRUCTION_A_AFFECTER:
      "Préfecture : en attente d'affectation à un agent instructeur",
    INSTRUCTION_EN_COURS:
      "Préfecture : votre dossier est en cours d'instruction",
    INSTRUCTION_TERMINEE:
      "Préfecture : instruction terminée, en attente de décision",

    // Complétude / entretien
    INSTRUCTION_DATE_EA_A_FIXER:
      "Préfecture : dossier complet, date d'entretien d'assimilation à fixer",
    EA_EN_ATTENTE_EA:
      "Préfecture : en attente de votre entretien d'assimilation",
    EA_CREA_A_VALIDER:
      "Préfecture : compte-rendu de l'entretien à valider par l'agent",

    // Proposition de décision préfectorale
    PROP_DECISION_PREF_A_EFFECTUER:
      "Préfecture : l'agent doit proposer une décision sur votre naturalisation",
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE:
      "Préfecture : la proposition de décision est en validation hiérarchique",
    PROP_DECISION_PREF_PROP_A_EDITER:
      "Préfecture : une décision a été prise et doit être rédigée au propre",
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE:
      "Préfecture : décision en attente de signature par le préfet",

    // Transfert vers SDANF / SCEC
    CONTROLE_A_AFFECTER:
      "Décision favorable signée : dossier transmis vers SDANF / SCEC, en attente d'affectation",
    EN_ATTENTE_TRANSMISSION_SCEC:
      "En attente de transmission de votre dossier au SCEC (état civil)",
    EN_ATTENTE_TRANSMISSION_SDANF:
      "En attente de transmission de votre dossier à la SDANF",

    // Exemples de statuts de fin de parcours (à adapter si nécessaire)
    EN_ATTENTE_DECISION:
      "Décision en cours de finalisation par l'administration",
    DECISION_FAVORABLE:
      "Décision favorable : votre naturalisation est acceptée, en attente de décret",
    DECISION_DEFAVORABLE:
      "Décision défavorable ou ajournement (voir la notification officielle)"
  };

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

  // "il y a 14 jrs", "il y a 1 jour", etc.
  function formatElapsedSince(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "aujourd'hui";
    if (diffDays === 1) return "il y a 1 jour";
    if (diffDays < 30) return `il y a ${diffDays} jrs`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "il y a 1 mois";
    return `il y a ${diffMonths} mois`;
  }

  // Turn a raw status string + last update date into a human sentence.
  function interpretStatus(status, updatedRaw) {
    if (!status) return null;

    // Exact mapping first
    let base = STATUS_DESCRIPTIONS[status];

    // Fallbacks based on patterns in the code
    if (!base) {
      if (status.includes("A_AFFECTER")) {
        base = "Dossier en attente d'affectation à un agent";
      } else if (status.includes("EN_COURS")) {
        base = "Dossier en cours de traitement par l'administration";
      } else if (status.includes("EA_")) {
        base =
          "Étape liée à l'entretien d'assimilation (voir détails JSON ci-dessous)";
      } else if (status.includes("PROP_DECISION")) {
        base =
          "Préfecture : étape de préparation ou validation de la décision préfectorale";
      } else {
        base = "Statut technique ANEF non interprété (voir code brut ci-dessous)";
      }
    }

    const elapsed = formatElapsedSince(updatedRaw);
    if (elapsed) {
      return `${base} (${elapsed})`;
    }
    return base;
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
        maxWidth: "320px",
        zIndex: 999999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
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
        const {
          status,
          createdAt,
          updatedAt,
          updatedRaw,
          dossierId,
          raw
        } = data;

        const interpretation = interpretStatus(status, updatedRaw);

        panel.innerHTML = `
          <strong>Interprétation :</strong><br/>
          ${escapeHtml(interpretation || "Non disponible")}<br/><br/>
          <strong>Statut API :</strong> ${escapeHtml(status || "Inconnu")}<br/>
          <strong>ID dossier :</strong> ${escapeHtml(
            dossierId ? String(dossierId) : "N/A"
          )}<br/>
          <strong>Création :</strong> ${escapeHtml(
            createdAt || "N/A"
          )}<br/>
          <strong>Dernière mise à jour :</strong> ${escapeHtml(
            updatedAt || "N/A"
          )}<br/>
          <details style="margin-top:4px;">
            <summary style="cursor:pointer;">JSON brut (API dossier-stepper)</summary>
            <pre style="white-space:pre-wrap;max-height:240px;overflow:auto;margin-top:4px;">${escapeHtml(
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

    // Raw technical status code (e.g. INSTRUCTION_A_AFFECTER, CONTROLE_A_AFFECTER, etc.)
    const status = dossier.statut || dossier.status || dossier.dossier_state || null;

    const dossierId =
      dossier.id ||
      dossier.dossier_id ||
      dossier.numero_dossier ||
      null;

    const createdRaw =
      dossier._created ||
      dossier.date_creation ||
      dossier.dateCreation ||
      null;

    const updatedRaw =
      dossier._updated ||
      dossier.date_derniere_modification ||
      dossier.dateDerniereMAJ ||
      json.updatedAt ||
      null;

    return {
      status,
      dossierId,
      createdAt: createdRaw ? formatDate(createdRaw) : null,
      updatedAt: updatedRaw ? formatDate(updatedRaw) : null,
      updatedRaw,
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
