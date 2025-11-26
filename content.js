(async () => {
  const EXT_VERSION = "2.5";
  const DOMAIN_KEY = "administration-etrangers-en-france";
  const API_ENDPOINT =
    "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper";

  if (!window.location.href.includes(DOMAIN_KEY)) {
    return;
  }

  const log = (...args) => console.log(`[ANEF Status ${EXT_VERSION}]`, ...args);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Ensure forge is loaded
  if (typeof forge === "undefined" || !forge) {
    console.error(`[ANEF Status ${EXT_VERSION}] Critical Error: 'forge' library not found. Decryption impossible.`);
    return;
  }

  function formatTime(date) {
    return date
      .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      .replace(":", "h");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function daysAgo(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const dayDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      return `Aujourd'hui à ${formatTime(date)}`;
    }
    if (dayDiff === 1) {
      return `Hier à ${formatTime(date)}`;
    }
    if (dayDiff < 30) {
      return `il y a ${dayDiff} jrs`;
    }

    const months = Math.floor(dayDiff / 30);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0) {
      return `il y a ${years} ans${remainingMonths ? ` et ${remainingMonths} mois` : ""
        }`;
    }

    return `il y a ${months} mois`;
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function IamKamal_23071993_v2(encryptedData) {
    const rsaKey = {
      privateKeyPem: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/WvhR9YrO6DHY\n0UpAoIlIuDoF3PtLEJ3J0T5FOLAPSY2sa33AnECl6jWfM7uLuojuTDbfIz6J3vAo\nsNUzwYFNHKx3EG1o6cYzjWm2LzZDa4e25wYlXcL2r3T0mFGS9DT7adKlomNURj4L\nf2WUt11oNH8RYyH/uNk+kIL0HRJLtfTjyyjlWSyjUUDD1ATYZwjnQS2HvdcqJ+Go\n3TTvqTG7yOPzC/lwSKG3zE3eL+pi9E9Lgw9NlSanewOu7toB9NiKwzP3kfSBNpkz\nSv4UBNClfp1UG+psSPnTx3Csil9TbPjSe99ZZ0/ffPf0h2xoga/7rWgScQwHzN9E\ncrvEfDgxAgMBAAECggEAa08Ikm2wOffcfEph6XwdgLpPT5ptEdtvoQ3GbessUGZf\nHKHrE2iMmH6PM4g/VEx3Hat/2gJZv9dVtnv0E+IgMK4zyVFdCciPbbmP3qr7MzPK\nF7fWqn26J7ydSc1hcZehXpwplNlL+qaphKkcvhlWOGm4GHgPSOjQvNYAw7naRMLiu\nlHUGRqQYijv1IECciMP8kZi+PMU80J9FK1LR5XHVw9t9kvPkuZBbLIGuLQo7iF2m\nVfqo/wCJLfU2EWdzRD6byK+ESziHnXaYF4yIPXVtm35UZCrigCu3FmaJt6MMcsWn\nVtJcJUtOYidvZBlfnjzuojKVAvLpFceFp/Ab3dawxQKBgQDzyLZtDLtF/j1ItmIE\ngpgwZayAchV6aQ19jmo7dAxV+yq6vaDH84FpiKeyyqnTKciu5CEURRdaG9l0lMjZ\nyvOVEhY68T2BndG+hn63lKWPEc6mWD3ie5qslQaj6zMebn0fFJOddT1di3sVfjU2\nqXNXpq75A1roq8+8X4OkITgj1QKBgQDA9oF1QG+rsuWbjaqCqbIDmQZ1y3B2Ki1v\nF2rQDPdKwtoyoXuzB6G/j4aGXJtpmAO1B6pHvvlm7OFE04+OsqJyUuqS4qCq5T8g\n2BnpwI3gammaTEST+aYhhMQZjrX8Oeq+rP4MOGdmvD2FFZx0cVJtT5bGK7uVL1SM\nQHmn0K3aRQKBgQCLs4DLe0vfmb5J1cT+9K/3XpdrqHbk4liL3g3vBH79KXvI1Fgv\nkqP8EsRdwVcJ7vwbQ0W0H+oqQmXQN4LWL3e3N7FRBEJjmYwW6JJaW3q4sWC+q0hL\nh1nD/3WVSTQbywKRsj/1wg1hb7Fo2O1RgN+7+gtxyVw0C2H77RVYCvsnYQKBgH/S\nabQcO0r1XfS6ZcjvS317C2E9A1G6uui66qOLzMlz6ktZqJ7kGea1zKZpqxEPW+z1\nQnJpVb+8LLpCnO0M1kZTPNU5pj32g1r50sv5HxpQX8hkO1eXvZ/9B5lFZ7nnB/kK\nv/HWA/xuyNgyb5Ce8lThZtcxfuK8gY5c3kOl/rFBAoGBAIQ1fTtwMf2TxuhHWdcq\n9C0q9pTGGIn/7GvY0Zf7xVICKU+NFuy8Zdb9QTrgNt7TnGxkH6Q1chb7xG5F2nVX\nbY63ViH50VE7Jv4Fp2HVggXFIRJ7ChtnrHk6k34Vj3VGRa6p7YxFDutT+P9rVJ2E\n6uDMl9E6rVCXT8mxXLPnxAGx\n-----END PRIVATE KEY-----",
      passphrase: "iamkamal_23071993_v2",
    };

    const extractFormData = (data) => {
      const parts = data.split("#K#");
      return parts.length ? parts[0] : null;
    };

    try {
      const privateKey = forge.pki.decryptRsaPrivateKey(
        rsaKey.privateKeyPem.trim(),
        rsaKey.passphrase
      );
      if (!privateKey) {
        throw new Error("Échec de décryptage de la clé privée");
      }

      const decodedData = forge.util.decode64(encryptedData);
      const buffer = forge.util.createBuffer(decodedData, "raw");

      const decryptedData = privateKey.decrypt(buffer.getBytes(), "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: forge.md.sha256.create(),
        label: undefined,
      });

      return extractFormData(decryptedData);
    } catch (e) {
      console.error("Erreur de décryptage :", e);
      return null;
    }
  }

  async function getStatusDescription(status) {
    const statusMap = {
      draft: "Dossier en brouillon",
      dossier_depose: "Dossier déposé",
      verification_formelle_a_traiter: "Préfecture : Vérification à traiter",
      verification_formelle_en_cours: "Préfecture : Vérification formelle en cours",
      verification_formelle_mise_en_demeure:
        "Préfecture : Vérification formelle, mise en demeure",
      instruction_a_affecter: "Préfecture : En attente affectation à un agent",
      instruction_recepisse_completude_a_envoyer:
        "Préfecture : récépissé de complétude à envoyer",
      instruction_recepisse_completude_a_envoyer_retour_complement_a_traiter:
        "Préfecture : Compléments à vérifier par l'agent",
      instruction_date_ea_a_fixer: "Préfecture : Date entretien à fixer",
      ea_demande_report_ea: "Préfecture : Demande de report entretien",
      ea_en_attente_ea: "Préfecture : Attente convocation entretien",
      ea_crea_a_valider: "Préfecture : Entretien passé, compte-rendu à valider",
      prop_decision_pref_a_effectuer: "Préfecture : Décision à effectuer",
      prop_decision_pref_en_attente_retour_hierarchique:
        "Préfecture : En attente retour hiérarchique",
      prop_decision_pref_en_attente_retour_hierarchiqu:
        "Préfecture : En attente retour hiérarchique",
      prop_decision_pref_prop_a_editer:
        "Préfecture : Décision prise, rédaction en cours",
      prop_decision_pref_en_attente_retour_signataire:
        "Préfecture : En attente retour signataire",
      controle_a_affecter: "Contrôle : à affecter",
      controle_a_effectuer: "Contrôle : à effectuer",
      controle_en_attente_pec: "Contrôle : en attente de prise en charge",
      controle_pec_a_faire: "Contrôle : prise en charge à faire",
      controle_transmise_pour_decret: "Contrôle : transmise pour décret",
      controle_en_attente_retour_hierarchique: "Contrôle : en attente retour hiérarchique",
      controle_decision_a_editer: "Contrôle : décision à éditer",
      controle_en_attente_signature: "Contrôle : en attente de signature",
      controle_demande_notifiee: "Contrôle : demande notifiée",
      transmis_a_ac: "Transmis à AC",
      a_verifier_avant_insertion_decret: "À vérifier avant insertion au décret",
      prete_pour_insertion_decret: "Prête pour insertion au décret",
      inseree_dans_decret: "Insérée dans un décret",
      decret_envoye_prefecture: "Décret envoyé à la préfecture",
      notification_envoyee: "Notification envoyée",
      demande_traitee: "Demande traitée",
      decret_naturalisation_publie: "Décret de naturalisation publié",
      decret_en_preparation: "Décret en préparation",
      decret_a_qualifier: "Décret à qualifier",
      decret_en_validation: "Décret en validation",
      decision_negative_en_delais_recours: "Décision négative (délais de recours)",
      irrecevabilite_manifeste: "Irrecevabilité manifeste",
      irrecevabilite_manifeste_en_delais_recours:
        "Irrecevabilité manifeste (délais de recours)",
      decision_notifiee: "Décision notifiée",
      demande_en_cours_rapo: "Demande en cours de RAPO",
      decret_publie: "Décret publié",
      css_en_delais_recours: "CSS en délais de recours",
      css_notifie: "CSS notifié",
      css_mise_en_demeure_a_affecter: "CSS : mise en demeure à affecter",
      css_manuels_a_affecter: "CSS : manuels à affecter",
      css_manuels_a_rediger: "CSS : manuels à rédiger",
      css_mise_en_demeure_a_rediger: "CSS : mise en demeure à rédiger",
      css_automatiques_a_affecter: "CSS : automatiques à affecter",
      css_automatiques_a_rediger: "CSS : automatiques à rédiger",
      prenat_a_traiter: "Prénat : à traiter",
      prenat_en_cours: "Prénat : en cours",
      prenat_en_attente_complements: "Prénat : en attente de compléments",
      prenat_cloture: "Prénat : clôturé",
      scec_a_faire: "SCEC : à faire",
      scec_en_cours: "SCEC : en cours",
      scec_en_attente: "SCEC : en attente",
      scec_bloque: "SCEC : bloqué",
      scec_termine: "SCEC : terminé",
      non_applicable: "Non applicable",
      code_non_reconnu: "Préfecture : En attente affectation à un agent",
    };

    if (!status) {
      return statusMap["code_non_reconnu"];
    }

    const normalized = String(status).toLowerCase().trim();

    if (statusMap[normalized]) {
      return statusMap[normalized];
    }

    if (normalized.startsWith("instruction_a_affecter")) {
      return statusMap["instruction_a_affecter"];
    }
    if (normalized.startsWith("verification_formelle_")) {
      return statusMap["verification_formelle_en_cours"];
    }
    if (normalized.startsWith("instruction_recepisse_completude_")) {
      return statusMap["instruction_recepisse_completude_a_envoyer"];
    }
    if (normalized.startsWith("prop_decision_pref_")) {
      return statusMap["prop_decision_pref_a_effectuer"];
    }
    if (normalized.startsWith("controle_")) {
      return statusMap["controle_a_effectuer"];
    }
    if (normalized.startsWith("ea_")) {
      return "Étape liée à l'entretien d'assimilation";
    }

    return `${statusMap["code_non_reconnu"]} (code : ${normalized})`;
  }

  const style = document.createElement("style");
  style.textContent = `
    .anf-code-popup {
      position:absolute;
      bottom:100%;
      left:50%;
      transform:translate(-50%,4px);
      background:#111827;
      color:#f9fafb;
      padding:6px 8px;
      border-radius:4px;
      font-size:11px;
      line-height:1.3;
      opacity:0;
      visibility:hidden;
      transition:opacity .15s ease, transform .15s ease, visibility 0s linear .15s;
      z-index:1000;
      white-space:nowrap;
      width:max-content;
      max-width:360px;
      white-space:normal;
    }
    .itemFriseContent:hover .anf-code-popup {
      opacity:1;
      visibility:visible;
      transform:translate(-50%,0);
      transition:opacity .15s ease, transform .15s ease;
    }
  `;
  document.head.appendChild(style);

  const waitForElement = async (resolver, timeoutMs = 20000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = resolver();
      if (el) return el;
      await sleep(500);
    }
    return null;
  };

  const tabLabel = "Demande d'accès à la Nationalité Française";

  const tabElement = await waitForElement(() => {
    return Array.from(document.querySelectorAll("a[role='tab']")).find((el) =>
      el.textContent.trim().includes(tabLabel)
    );
  });

  if (!tabElement) {
    log("Onglet Nationalité introuvable");
    return;
  }

  tabElement.click();

  const activeStep = await waitForElement(() =>
    document.querySelector("li.itemFrise.active")
  );

  if (!activeStep) {
    log("Étape active non trouvée");
    return;
  }

  let data;
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      log("Erreur API", response.status, response.statusText);
      return;
    }
    data = await response.json();
  } catch (error) {
    log("Erreur lors de l'appel API", error);
    return;
  }

  const dossier = data?.dossier;
  if (!dossier) {
    log("Aucune donnée dossier trouvée");
    return;
  }

  let dossierStatusCode = IamKamal_23071993_v2(dossier.statut);
  if (!dossierStatusCode) {
    dossierStatusCode = "code_non_reconnu";
  }

  const dossierStatus = await getStatusDescription(dossierStatusCode);

  log("Version", EXT_VERSION);
  log("Statut chiffré", dossier.statut);
  log("Code déchiffré", dossierStatusCode);
  log("Description", dossierStatus);
  console.log("[ANEF_API] Statut brut déchiffré =", dossierStatusCode);
  console.log("[ANEF_API] Statut interprété   =", dossierStatus);

  const rawStatus = dossierStatus || "";
  const parts = rawStatus.split(":");
  const mainLabelText = (parts[0] || "").trim() || "Statut dossier";
  const subLabelText = (parts.slice(1).join(":") || "").trim() || rawStatus;
  const timeLabelText = `(${daysAgo(dossier.date_statut)})`;
  const dateStatut = formatDate(dossier.date_statut);

  const styleId = "anef-helper-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .anef-helper-step {
        text-align: center;
      }

      .anef-helper-step .anef-helper-version {
        position: absolute;
        top: 1px;
        right: 4px;
        font-size: 8px;
        color: #9ca3af;
        opacity: 0.85;
      }

      .anef-helper-step .anef-helper-icon {
        color: #bf2626 !important;
        font-size: 18px;
      }

      .anef-helper-step .anef-helper-text {
        margin: 4px 0 0 0;
        padding: 0 4px;
        font-size: 12px;
        line-height: 1.35;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        white-space: normal;
      }

      .anef-helper-step .anef-helper-title {
        font-weight: 600;
        color: #111827;
      }

      .anef-helper-step .anef-helper-sub {
        font-weight: 400;
        color: #1f2933;
      }

      .anef-helper-step .anef-helper-time {
        margin-top: 2px;
        color: #bf2626;
        font-size: 11px;
      }

      .anef-helper-step .anf-code-popup {
        width: max-content;
        max-width: 360px;
        white-space: normal;
      }
    `;
    document.head.appendChild(style);
  }

  const newElement = document.createElement("li");
  newElement.className = "itemFrise active ng-star-inserted";
  newElement.innerHTML = `
    <div class="itemFriseContent anef-helper-step" style="position: relative;">
      <span class="anef-helper-version">v${EXT_VERSION}</span>
      <span class="itemFriseIcon">
        <span class="fa fa-hourglass-start anef-helper-icon"></span>
      </span>
      <div class="anf-code-popup">
        ${escapeHtml(rawStatus)}<br/>
        <span style="font-size:10px;opacity:.75;">
          Code technique : ${escapeHtml(dossierStatusCode)}
        </span><br/>
        depuis le <i>${escapeHtml(dateStatut)}</i>
      </div>
      <p class="anef-helper-text">
        <span class="anef-helper-title">${escapeHtml(mainLabelText)}</span>
        <span class="anef-helper-sub">${escapeHtml(subLabelText)}</span>
        <span class="anef-helper-time">${escapeHtml(timeLabelText)}</span>
      </p>
    </div>
  `;

  activeStep.insertAdjacentElement("afterend", newElement);
})();
