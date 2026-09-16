/*
 * Freemasonry Heritage Fraternity
 * GLOBAL LANGUAGE SWITCHER
 *
 * Save this file as: language.js
 *
 * HOW TO USE:
 * Add this one line to EVERY HTML page, just before </body>:
 *
 * <script type="module" src="language.js"></script>
 *
 * The file:
 * 1. Adds one shared language selector to every page.
 * 2. Reads the member's country and saved language from Firebase.
 * 3. Saves languageCode/languageName under users/{uid}.
 * 4. Syncs the selected language across all pages/tabs using Firebase.
 * 5. Uses localStorage as a fast local fallback.
 * 6. Translates any element that has a data-i18n attribute.
 *
 * Example:
 *   <h1 data-i18n="welcome">Welcome</h1>
 *   <button data-i18n="logout">Logout</button>
 *
 * For placeholders:
 *   <input data-i18n-placeholder="emailPlaceholder">
 *
 * For title attributes:
 *   <button data-i18n-title="changeLanguage">...</button>
 */

import {
  getApps,
  getApp,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyBSs3ekiQv8Q_1Ar5oZVBKGjuOQbwcgNEM",
  authDomain: "mansonry-family-fraternity.firebaseapp.com",
  databaseURL: "https://mansonry-family-fraternity-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mansonry-family-fraternity",
  storageBucket: "mansonry-family-fraternity.firebasestorage.app",
  messagingSenderId: "964415179161",
  appId: "1:964415179161:web:c8fd1a777542932d7c6b08",
  measurementId: "G-Q8LC74ZFXN"
};

/* =========================
   FIREBASE INITIALIZATION
========================= */

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* =========================
   COUNTRY → LANGUAGES
========================= */

const countryLanguages = {
  Kenya: ["en", "sw"],
  Uganda: ["en", "sw"],
  Tanzania: ["en", "sw"],
  Rwanda: ["en", "fr"],
  "Guinea-Bissau": ["en", "pt", "fr"],
  DRC: ["en", "fr"],
  "South Africa": ["en"],
  Nigeria: ["en"],
  Ghana: ["en"],
  Ethiopia: ["en", "am"],
  Zimbabwe: ["en"],
  Zambia: ["en"],
  Botswana: ["en"],
  Namibia: ["en"],
  USA: ["en", "fr"],
  Canada: ["en", "fr"],
  UK: ["en", "fr"],
  Australia: ["en"],
  India: ["en", "hi"]
};

const languageNames = {
  en: "English",
  sw: "Kiswahili",
  fr: "Français",
  pt: "Português",
  am: "አማርኛ",
  hi: "हिन्दी"
};

/* =========================
   TRANSLATIONS
========================= */

const translations = {
  en: {
    fraternityName: "Freemasonry Heritage",
    pageTitle: "Freemasonry Heritage Fraternity",
    logout: "Logout",

    navHome: "Home",
    navRequirements: "Requirements",
    navApplication: "Application",
    navMembers: "Members",
    navHelpline: "Helpline",
    navLaws: "Laws",

    language: "Language",
    changeLanguage: "Change language",
    savedLanguage: "Language saved",
    languageSaved: "Your language has been saved.",
    languageSync: "Language sync is active.",

    pendingTitle: "Application Pending",
    pendingText: "Your membership application is currently awaiting approval.",

    helplineTitle: "Helpline & Director Contact",
    whatsapp: "WhatsApp",
    director: "Lodge Director",
    contactDirector: "Contact Director",
    importantNotes: "Important Notes",

    welcome: "Welcome",
    home: "Home",
    requirements: "Requirements",
    application: "Application",
    members: "Members",
    helpline: "Helpline",
    laws: "Laws",

    emailPlaceholder: "Email address",
    phonePlaceholder: "Phone number",
    searchPlaceholder: "Search"
  },

  sw: {
    fraternityName: "Urithi wa Freemasonry",
    pageTitle: "Jumuiya ya Urithi wa Freemasonry",
    logout: "Ondoka",

    navHome: "Nyumbani",
    navRequirements: "Masharti",
    navApplication: "Maombi",
    navMembers: "Wanachama",
    navHelpline: "Msaada",
    navLaws: "Sheria",

    language: "Lugha",
    changeLanguage: "Badilisha lugha",
    savedLanguage: "Lugha imehifadhiwa",
    languageSaved: "Lugha yako imehifadhiwa.",
    languageSync: "Usawazishaji wa lugha umewezeshwa.",

    pendingTitle: "Maombi Yanasubiri",
    pendingText: "Maombi yako ya uanachama yanasubiri idhini.",

    helplineTitle: "Msaada na Mawasiliano ya Mkurugenzi",
    whatsapp: "WhatsApp",
    director: "Mkurugenzi wa Lodge",
    contactDirector: "Wasiliana na Mkurugenzi",
    importantNotes: "Maelezo Muhimu",

    welcome: "Karibu",
    home: "Nyumbani",
    requirements: "Masharti",
    application: "Maombi",
    members: "Wanachama",
    helpline: "Msaada",
    laws: "Sheria",

    emailPlaceholder: "Anwani ya barua pepe",
    phonePlaceholder: "Nambari ya simu",
    searchPlaceholder: "Tafuta"
  },

  fr: {
    fraternityName: "Héritage de la Franc-Maçonnerie",
    pageTitle: "Fraternité de l'Héritage de la Franc-Maçonnerie",
    logout: "Déconnexion",

    navHome: "Accueil",
    navRequirements: "Conditions",
    navApplication: "Candidature",
    navMembers: "Membres",
    navHelpline: "Assistance",
    navLaws: "Lois",

    language: "Langue",
    changeLanguage: "Changer de langue",
    savedLanguage: "Langue enregistrée",
    languageSaved: "Votre langue a été enregistrée.",
    languageSync: "La synchronisation de la langue est active.",

    pendingTitle: "Candidature en attente",
    pendingText: "Votre demande d'adhésion est actuellement en attente d'approbation.",

    helplineTitle: "Assistance et contact du directeur",
    whatsapp: "WhatsApp",
    director: "Directeur de la Loge",
    contactDirector: "Contacter le directeur",
    importantNotes: "Notes importantes",

    welcome: "Bienvenue",
    home: "Accueil",
    requirements: "Conditions",
    application: "Candidature",
    members: "Membres",
    helpline: "Assistance",
    laws: "Lois",

    emailPlaceholder: "Adresse e-mail",
    phonePlaceholder: "Numéro de téléphone",
    searchPlaceholder: "Rechercher"
  },

  pt: {
    fraternityName: "Herança da Maçonaria",
    pageTitle: "Fraternidade da Herança da Maçonaria",
    logout: "Sair",

    navHome: "Início",
    navRequirements: "Requisitos",
    navApplication: "Candidatura",
    navMembers: "Membros",
    navHelpline: "Ajuda",
    navLaws: "Leis",

    language: "Idioma",
    changeLanguage: "Alterar idioma",
    savedLanguage: "Idioma guardado",
    languageSaved: "O seu idioma foi guardado.",
    languageSync: "A sincronização do idioma está ativa.",

    pendingTitle: "Candidatura pendente",
    pendingText: "A sua candidatura de membro está a aguardar aprovação.",

    helplineTitle: "Ajuda e contacto do diretor",
    whatsapp: "WhatsApp",
    director: "Diretor da Loja",
    contactDirector: "Contactar o diretor",
    importantNotes: "Notas importantes",

    welcome: "Bem-vindo",
    home: "Início",
    requirements: "Requisitos",
    application: "Candidatura",
    members: "Membros",
    helpline: "Ajuda",
    laws: "Leis",

    emailPlaceholder: "Endereço de e-mail",
    phonePlaceholder: "Número de telefone",
    searchPlaceholder: "Pesquisar"
  },

  am: {
    fraternityName: "የፍሪሜሶነሪ ቅርስ",
    pageTitle: "የፍሪሜሶነሪ ቅርስ ወንድማማችነት",
    logout: "ውጣ",

    navHome: "መነሻ",
    navRequirements: "መስፈርቶች",
    navApplication: "ማመልከቻ",
    navMembers: "አባላት",
    navHelpline: "እርዳታ",
    navLaws: "ሕጎች",

    language: "ቋንቋ",
    changeLanguage: "ቋንቋ ቀይር",
    savedLanguage: "ቋንቋ ተቀምጧል",
    languageSaved: "ቋንቋዎ ተቀምጧል።",
    languageSync: "የቋንቋ ማመሳሰል እየሰራ ነው።",

    pendingTitle: "ማመልከቻ በመጠባበቅ ላይ",
    pendingText: "የአባልነት ማመልከቻዎ ፈቃድ እየጠበቀ ነው።",

    helplineTitle: "እርዳታ እና የዳይሬክተር አድራሻ",
    whatsapp: "WhatsApp",
    director: "የሎጅ ዳይሬክተር",
    contactDirector: "ዳይሬክተሩን ያነጋግሩ",
    importantNotes: "አስፈላጊ ማስታወሻዎች",

    welcome: "እንኳን ደህና መጡ",
    home: "መነሻ",
    requirements: "መስፈርቶች",
    application: "ማመልከቻ",
    members: "አባላት",
    helpline: "እርዳታ",
    laws: "ሕጎች",

    emailPlaceholder: "የኢሜይል አድራሻ",
    phonePlaceholder: "የስልክ ቁጥር",
    searchPlaceholder: "ፈልግ"
  },

  hi: {
    fraternityName: "फ्रीमेसनरी विरासत",
    pageTitle: "फ्रीमेसनरी विरासत फ्रेटरनिटी",
    logout: "लॉग आउट",

    navHome: "होम",
    navRequirements: "आवश्यकताएँ",
    navApplication: "आवेदन",
    navMembers: "सदस्य",
    navHelpline: "सहायता",
    navLaws: "कानून",

    language: "भाषा",
    changeLanguage: "भाषा बदलें",
    savedLanguage: "भाषा सहेजी गई",
    languageSaved: "आपकी भाषा सहेज दी गई है।",
    languageSync: "भाषा सिंक्रोनाइज़ेशन सक्रिय है।",

    pendingTitle: "आवेदन लंबित",
    pendingText: "आपका सदस्यता आवेदन अनुमोदन की प्रतीक्षा कर रहा है।",

    helplineTitle: "सहायता और निदेशक संपर्क",
    whatsapp: "WhatsApp",
    director: "लॉज निदेशक",
    contactDirector: "निदेशक से संपर्क करें",
    importantNotes: "महत्वपूर्ण नोट्स",

    welcome: "स्वागत है",
    home: "होम",
    requirements: "आवश्यकताएँ",
    application: "आवेदन",
    members: "सदस्य",
    helpline: "सहायता",
    laws: "कानून",

    emailPlaceholder: "ईमेल पता",
    phonePlaceholder: "फ़ोन नंबर",
    searchPlaceholder: "खोजें"
  }
};

/* =========================
   STATE
========================= */

let currentUser = null;
let currentCountry = "";
let currentLanguage = localStorage.getItem("fhLanguage") || "en";
let allowedLanguages = ["en"];
let userListenerStarted = false;

/* =========================
   HELPERS
========================= */

function getAllowedLanguages(country) {
  return countryLanguages[country] || ["en", "fr"];
}

function getSafeLanguage(country, requestedLanguage) {
  const allowed = getAllowedLanguages(country);

  if (allowed.includes(requestedLanguage)) {
    return requestedLanguage;
  }

  if (allowed.includes("en")) {
    return "en";
  }

  return allowed[0] || "en";
}

function getLanguageName(code) {
  return languageNames[code] || languageNames.en;
}

function t(key) {
  return (
    translations[currentLanguage]?.[key] ??
    translations.en?.[key] ??
    key
  );
}

/* =========================
   APPLY TRANSLATION
========================= */

function applyTranslations() {
  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;

    const translated = t(key);

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      if (element.type !== "button" && element.type !== "submit") {
        return;
      }
    }

    element.textContent = translated;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (key && "placeholder" in element) {
      element.placeholder = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    if (key) {
      element.title = t(key);
    }
  });

  // Useful for pages whose logo/header uses this common class.
  document.querySelectorAll(".fraternity-name, [data-fraternity-name]").forEach((element) => {
    if (!element.hasAttribute("data-i18n")) {
      element.textContent = t("fraternityName");
    }
  });

  // Update common navigation elements without changing their layout.
  const commonSelectors = [
    ["#logoutBtn", "logout"],
    [".logout-btn", "logout"],
    ["[data-nav-home]", "navHome"],
    ["[data-nav-requirements]", "navRequirements"],
    ["[data-nav-application]", "navApplication"],
    ["[data-nav-members]", "navMembers"],
    ["[data-nav-helpline]", "navHelpline"],
    ["[data-nav-laws]", "navLaws"]
  ];

  commonSelectors.forEach(([selector, key]) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.hasAttribute("data-i18n")) {
        element.textContent = t(key);
      }
    });
  });

  updateSwitcherText();
}

/* =========================
   GLOBAL LANGUAGE SWITCHER
========================= */

function injectStyles() {
  if (document.getElementById("fh-language-styles")) return;

  const style = document.createElement("style");
  style.id = "fh-language-styles";

  style.textContent = `
    #fh-global-language {
      position: fixed;
      top: 76px;
      right: 14px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 9px;
      border: 1px solid rgba(212,175,55,.55);
      border-radius: 12px;
      background: rgba(8,18,39,.96);
      box-shadow: 0 5px 22px rgba(0,0,0,.25);
      font-family: Poppins, Arial, sans-serif;
    }

    #fh-global-language label {
      color: #d4af37;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    #fh-global-language select {
      min-width: 118px;
      border: 1px solid rgba(212,175,55,.5);
      border-radius: 8px;
      padding: 6px 8px;
      background: #101f3c;
      color: #fff;
      outline: none;
      font: 600 12px Poppins, Arial, sans-serif;
      cursor: pointer;
    }

    #fh-global-language select:focus {
      border-color: #d4af37;
      box-shadow: 0 0 0 2px rgba(212,175,55,.18);
    }

    #fh-language-status {
      position: fixed;
      top: 126px;
      right: 14px;
      z-index: 99998;
      display: none;
      max-width: 230px;
      padding: 8px 11px;
      border-radius: 9px;
      background: #101f3c;
      color: #fff;
      border: 1px solid rgba(212,175,55,.45);
      box-shadow: 0 4px 18px rgba(0,0,0,.2);
      font: 500 11px Poppins, Arial, sans-serif;
    }

    @media (max-width: 600px) {
      #fh-global-language {
        top: 68px;
        right: 9px;
        padding: 6px 7px;
      }

      #fh-global-language label {
        display: none;
      }

      #fh-global-language select {
        min-width: 105px;
        font-size: 11px;
      }

      #fh-language-status {
        top: 113px;
        right: 9px;
      }
    }
  `;

  document.head.appendChild(style);
}

function createSwitcher() {
  if (document.getElementById("fh-global-language")) return;

  injectStyles();

  const wrapper = document.createElement("div");
  wrapper.id = "fh-global-language";
  wrapper.setAttribute("aria-label", "Language selector");

  const label = document.createElement("label");
  label.id = "fh-language-label";
  label.textContent = t("language");

  const select = document.createElement("select");
  select.id = "fh-language-select";
  select.setAttribute("aria-label", t("changeLanguage"));

  wrapper.appendChild(label);
  wrapper.appendChild(select);

  const status = document.createElement("div");
  status.id = "fh-language-status";
  document.body.appendChild(wrapper);
  document.body.appendChild(status);

  select.addEventListener("change", async () => {
    await setLanguage(select.value, true);
  });

  populateSwitcher();
}

function populateSwitcher() {
  const select = document.getElementById("fh-language-select");
  if (!select) return;

  select.innerHTML = "";

  allowedLanguages.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = languageNames[code] || code;
    select.appendChild(option);
  });

  const safe = getSafeLanguage(currentCountry, currentLanguage);
  select.value = safe;
}

function updateSwitcherText() {
  const label = document.getElementById("fh-language-label");
  const select = document.getElementById("fh-language-select");

  if (label) label.textContent = t("language");
  if (select) {
    select.setAttribute("aria-label", t("changeLanguage"));
    populateSwitcher();
  }
}

function showStatus(message) {
  const status = document.getElementById("fh-language-status");
  if (!status) return;

  status.textContent = message;
  status.style.display = "block";

  clearTimeout(window.__fhLanguageStatusTimer);
  window.__fhLanguageStatusTimer = setTimeout(() => {
    status.style.display = "none";
  }, 2200);
}

/* =========================
   SAVE LANGUAGE TO FIREBASE
========================= */

async function saveLanguageToFirebase(code) {
  if (!currentUser) return false;

  const userRef = ref(db, `users/${currentUser.uid}`);

  await update(userRef, {
    languageCode: code,
    languageName: getLanguageName(code)
  });

  return true;
}

async function setLanguage(code, saveToFirebase = true) {
  const safeCode = getSafeLanguage(currentCountry, code);

  currentLanguage = safeCode;

  localStorage.setItem("fhLanguage", safeCode);
  localStorage.setItem("fhLanguageName", getLanguageName(safeCode));

  applyTranslations();

  if (saveToFirebase && currentUser) {
    try {
      await saveLanguageToFirebase(safeCode);
      showStatus(t("languageSaved"));
    } catch (error) {
      console.error("Language save failed:", error);
      showStatus("Language saved locally. Firebase sync failed.");
    }
  }

  window.dispatchEvent(
    new CustomEvent("fh-language-changed", {
      detail: {
        languageCode: safeCode,
        languageName: getLanguageName(safeCode),
        country: currentCountry
      }
    })
  );

  return safeCode;
}

/* =========================
   FIREBASE REAL-TIME SYNC
========================= */

function startUserLanguageListener(user) {
  if (!user || userListenerStarted) return;

  userListenerStarted = true;

  const userRef = ref(db, `users/${user.uid}`);

  onValue(userRef, async (snapshot) => {
    const member = snapshot.val() || {};

    currentCountry = member.country || "";
    allowedLanguages = getAllowedLanguages(currentCountry);

    const savedLanguage = member.languageCode || localStorage.getItem("fhLanguage") || "en";
    const safeLanguage = getSafeLanguage(currentCountry, savedLanguage);

    const languageWasInvalid =
      member.languageCode &&
      member.languageCode !== safeLanguage;

    currentLanguage = safeLanguage;

    localStorage.setItem("fhLanguage", currentLanguage);
    localStorage.setItem("fhLanguageName", getLanguageName(currentLanguage));

    populateSwitcher();
    applyTranslations();

    /*
     * If the country changed and the old language is no longer valid,
     * normalize the saved language to the first valid language.
     */
    if (languageWasInvalid) {
      try {
        await update(userRef, {
          languageCode: safeLanguage,
          languageName: getLanguageName(safeLanguage)
        });
      } catch (error) {
        console.warn("Could not normalize saved language:", error);
      }
    }
  });
}

/* =========================
   PUBLIC API
========================= */

window.FHLanguage = {
  getLanguage: () => currentLanguage,
  getLanguageName: () => getLanguageName(currentLanguage),
  getCountry: () => currentCountry,
  getAllowedLanguages: () => [...allowedLanguages],
  translate: t,
  setLanguage,
  applyTranslations
};

/* =========================
   START
========================= */

function initializeLanguageSystem() {
  createSwitcher();
  applyTranslations();

  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
      startUserLanguageListener(user);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLanguageSystem, { once: true });
} else {
  initializeLanguageSystem();
    }
