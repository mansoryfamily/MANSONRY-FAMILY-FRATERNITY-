// --- GLOBAL TRANSLATION DICTIONARY ---
const TRANSLATIONS = {
  sw: {
    // Navigation Links
    "Home": "Nyumbani",
    "Requirements": "Mahitaji",
    "Application": "Ombi",
    "Members": "Wanachama",
    "Helpline": "Nambari ya Msaada",
    "Laws": "Sheria",
    "Logout": "Ondoka",

    // Members Page Specific
    "Our Esteemed Members": "Wanachama Wetu Wanaoheshimika",
    "Celebrating the brotherhood, service, and unity of Freemasonry Heritage. Each photo captures a moment of our journey together.": 
      "Kusheherekea undugu, huduma, na umoja wa Urithi wa Freemasonry. Kila picha inanaswa wakati wa safari yetu pamoja.",
    "Total Members": "Jumla ya Wanachama",
    "Active Lodges": "Loji Zinazofanya Kazi",
    "Community Projects": "Miradi ya Jamii",
    "Lodge Harmony Meeting": "Mkutano wa Loji ya Harmony",
    "Community Service Initiative": "Mpango wa Huduma kwa Jamii",
    "Initiation Ceremony": "Sherehe ya Uingizaji",
    "Business Grant Award": "Tuzo ya Ruzuku ya Biashara",
    "Brotherhood Fellowship": "Ushirika wa Undugu",
    "Mentorship & Learning": "Ushauri na Masomo",
    "Lodge Building Project": "Mradi wa Ujenzi wa Loji",
    "Official Meeting": "Mkutano Rasmi",
    "Charity Work": "Kazi ya Hisani",
    "Initiation": "Uingizaji",
    "Empowerment": "Uwezeshaji",
    "Fellowship": "Ushirika",
    "Mentorship": "Ushauri",
    "Teamwork": "Kazi ya Pamoja"
  }
};

// --- AUTOMATIC TRANSLATION ENGINE ---
// Runs on EVERY page when it loads
document.addEventListener("DOMContentLoaded", () => {
  autoApplyTranslation();
});

function autoApplyTranslation() {
  const currentLang = localStorage.getItem("user_lang") || "en";
  if (currentLang === "en" || !TRANSLATIONS[currentLang]) return;

  const dict = TRANSLATIONS[currentLang];

  function traverseAndTranslate(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue.trim();
      if (text && dict[text]) {
        node.nodeValue = node.nodeValue.replace(text, dict[text]);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script tags, inputs, and style tags
      if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA"].includes(node.tagName)) return;
      for (let child of node.childNodes) {
        traverseAndTranslate(child);
      }
    }
  }

  traverseAndTranslate(document.body);
}

// --- DASHBOARD-ONLY MODAL & LANGUAGE CONTROLS ---
const COUNTRY_DATA = [
  { name: "Kenya", code: "KE", flag: "🇰🇪", languages: [{ name: "English", code: "en" }, { name: "Swahili (Kiswahili)", code: "sw" }] },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", languages: [{ name: "Swahili (Kiswahili)", code: "sw" }, { name: "English", code: "en" }] },
  { name: "Uganda", code: "UG", flag: "🇺🇬", languages: [{ name: "English", code: "en" }] },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", languages: [{ name: "English", code: "en" }] },
  { name: "United States", code: "US", flag: "🇺🇸", languages: [{ name: "English", code: "en" }] }
];

let selectedCountry = null;

// Functions invoked ONLY by the button on dashboard.html
window.openCountryModal = function() {
  const modal = document.getElementById("countryModal");
  const list = document.getElementById("countryList");
  if (!modal || !list) return;

  list.innerHTML = COUNTRY_DATA.map(c => `
    <li onclick="selectCountry('${c.code}')" style="display:flex; justify-content:space-between; align-items:center; padding:12px; cursor:pointer; border-bottom:1px solid rgba(212,175,55,0.1);">
      <span>${c.flag} ${c.name}</span>
      <span style="color:#d4af37;">→</span>
    </li>
  `).join("");

  modal.classList.add("active");
};

window.selectCountry = function(code) {
  selectedCountry = COUNTRY_DATA.find(c => c.code === code);
  document.getElementById("countryModal")?.classList.remove("active");

  const langModal = document.getElementById("languageModal");
  const langList = document.getElementById("languageList");

  if (!langModal || !langList) return;

  langList.innerHTML = selectedCountry.languages.map(l => `
    <li onclick="applyLanguage('${l.code}')" style="padding:12px; cursor:pointer; border-bottom:1px solid rgba(212,175,55,0.1);">
      ${l.name}
    </li>
  `).join("");

  langModal.classList.add("active");
};

window.applyLanguage = function(langCode) {
  // Save selection globally to localStorage
  localStorage.setItem("user_lang", langCode);
  
  // Close modals
  document.getElementById("languageModal")?.classList.remove("active");
  
  // Reload dashboard to apply changes immediately
  window.location.reload();
};

window.backToCountries = function() {
  document.getElementById("languageModal")?.classList.remove("active");
  openCountryModal();
};
