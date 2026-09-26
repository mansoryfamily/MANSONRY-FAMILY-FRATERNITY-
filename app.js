// Dictionary containing full page translations
const TRANSLATIONS = {
  sw: {
    // Navigation & Buttons
    "Home": "Nyumbani",
    "Requirements": "Mahitaji",
    "Application": "Ombi",
    "Members": "Wanachama",
    "Helpline": "Nambari ya Msaada",
    "Laws": "Sheria",
    "Logout": "Ondoka",
    "Language": "Lugha",
    
    // Dashboard & Profile
    "Welcome Back": "Karibu Tena",
    "Member Portal": "Tovuti ya Wanachama",
    "Secure Access": "Ufikiaji Salama",
    "Real-time Updates": "Taarifa za Hivi Punde",
    "Membership Status": "Hali ya Uanachama",
    "Lodge": "Loji",
    "Member Since": "Mwanachama Tangu",
    "Full Name": "Jina Kamili",
    "Email Address": "Anwani ya Barua Pepe",
    "Phone Number": "Nambari ya Simu",
    "Country": "Nchi",
    "Area of Interest": "Eneo la Nia",
    "ACTIVE": "ANAFANYA KAZI",
    "PENDING": "INASUBIRI",
    "Active": "Anafanya Kazi",
    "Pending": "Inasubiri",
    
    // Cards & Panels
    "Lodge Information": "Taarifa za Loji",
    "Access meeting schedules, lodge announcements, and member activities.": "Pata ratiba za mikutano, matangazo ya loji, na shughuli za wanachama.",
    "Latest Announcements": "Matangazo ya Hivi Punde",
    "Membership Support": "Msaada wa Uanachama",
    "Contact your Lodge Director for guidance and fraternity assistance.": "Wasiliana na Mkurugenzi wa Loji yako kwa mwongozo na msaada wa undugu.",
    "Admin Panel": "Paneli ya Utawala",
    "Manage members, applications, and lodge settings.": "Dhibiti wanachama, maombi, na mipangilio ya loji.",
    "Go to Dashboard →": "Nenda kwenye Dashibodi →",
    "Loading...": "Inapakia...",
    "No announcements yet": "Hakuna matangazo bado"
  }
};

// 1. Automatically run translation when any page loads
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("user_lang") || "en";
  if (savedLang !== "en") {
    translatePage(savedLang);
  }
});

// 2. Core Translation Engine: Translates all text nodes on the page
function translatePage(langCode) {
  if (!TRANSLATIONS[langCode]) return;

  const dictionary = TRANSLATIONS[langCode];

  function traverseAndTranslate(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue.trim();
      if (text && dictionary[text]) {
        node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Do not break inline scripts or styling tags
      if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;
      
      // Translate element attributes like placeholder or alt
      if (node.hasAttribute("placeholder")) {
        const ph = node.getAttribute("placeholder").trim();
        if (dictionary[ph]) node.setAttribute("placeholder", dictionary[ph]);
      }
      
      for (let child of node.childNodes) {
        traverseAndTranslate(child);
      }
    }
  }

  traverseAndTranslate(document.body);
}

// 3. Country & Language Selection Functions
const COUNTRY_DATA = [
  { name: "Kenya", code: "KE", flag: "🇰🇪", languages: [{ name: "English", code: "en" }, { name: "Swahili (Kiswahili)", code: "sw" }] },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", languages: [{ name: "Swahili (Kiswahili)", code: "sw" }, { name: "English", code: "en" }] },
  { name: "Uganda", code: "UG", flag: "🇺🇬", languages: [{ name: "English", code: "en" }, { name: "Swahili", code: "sw" }] },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", languages: [{ name: "English", code: "en" }] },
  { name: "United States", code: "US", flag: "🇺🇸", languages: [{ name: "English", code: "en" }] }
];

let selectedCountry = null;

function openCountryModal() {
  const modal = document.getElementById("countryModal");
  const list = document.getElementById("countryList");
  if (!modal || !list) return;

  list.innerHTML = COUNTRY_DATA.map(c => `
    <li class="country-item" onclick="selectCountry('${c.code}')" style="display:flex; justify-content:space-between; align-items:center; padding:12px; cursor:pointer; border-bottom:1px solid rgba(212,175,55,0.1);">
      <span>${c.flag} ${c.name}</span>
      <span style="color:var(--gold);">→</span>
    </li>
  `).join("");

  modal.classList.add("active");
}

function selectCountry(code) {
  selectedCountry = COUNTRY_DATA.find(c => c.code === code);
  document.getElementById("countryModal").classList.remove("active");

  const langModal = document.getElementById("languageModal");
  const langList = document.getElementById("languageList");
  
  langList.innerHTML = selectedCountry.languages.map(l => `
    <li class="lang-item" onclick="applyLanguage('${l.code}')" style="padding:12px; cursor:pointer; border-bottom:1px solid rgba(212,175,55,0.1);">
      ${l.name}
    </li>
  `).join("");

  langModal.classList.add("active");
}

function applyLanguage(langCode) {
  // Save permanently across browser reloads & page navigations
  localStorage.setItem("user_lang", langCode);
  
  // Close modals
  document.getElementById("languageModal").classList.remove("active");
  
  // Reload page to apply full translation state cleanly
  window.location.reload();
}

function backToCountries() {
  document.getElementById("languageModal").classList.remove("active");
  openCountryModal();
}
