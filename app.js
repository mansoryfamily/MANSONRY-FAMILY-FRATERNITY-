const countryLanguageData = {
  "Kenya": [
    { name: "English (Main)", code: "en" },
    { name: "Swahili (Kiswahili)", code: "sw" }
  ],
  "Uganda": [
    { name: "English (Main)", code: "en" },
    { name: "Swahili", code: "sw" },
    { name: "Luganda", code: "lg" }
  ],
  "Tanzania": [
    { name: "Swahili (Main)", code: "sw" },
    { name: "English", code: "en" }
  ],
  "Rwanda": [
    { name: "English (Main)", code: "en" },
    { name: "Kinyarwanda", code: "rw" },
    { name: "French", code: "fr" }
  ],
  "Guinea-Bissau": [
    { name: "English (Main)", code: "en" },
    { name: "Portuguese", code: "pt" }
  ],
  "DRC": [
    { name: "English (Main)", code: "en" },
    { name: "French", code: "fr" },
    { name: "Swahili", code: "sw" }
  ],
  "South Africa": [
    { name: "English (Main)", code: "en" },
    { name: "Zulu", code: "zu" },
    { name: "Xhosa", code: "xh" },
    { name: "Afrikaans", code: "af" }
  ],
  "Nigeria": [
    { name: "English (Main)", code: "en" },
    { name: "Hausa", code: "ha" },
    { name: "Yoruba", code: "yo" },
    { name: "Igbo", code: "ig" }
  ],
  "Ghana": [
    { name: "English (Main)", code: "en" }
  ],
  "Ethiopia": [
    { name: "English (Main)", code: "en" },
    { name: "Amharic", code: "am" }
  ],
  "Zimbabwe": [
    { name: "English (Main)", code: "en" },
    { name: "Shona", code: "sn" }
  ],
  "Zambia": [
    { name: "English (Main)", code: "en" }
  ],
  "Botswana": [
    { name: "English (Main)", code: "en" }
  ],
  "Namibia": [
    { name: "English (Main)", code: "en" },
    { name: "Afrikaans", code: "af" }
  ],
  "USA": [
    { name: "English (Main)", code: "en" },
    { name: "Spanish", code: "es" }
  ]
};

let selectedCountry = "";

// Initialize Google Translate Engine
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
}

// Render Country Options
function renderCountries() {
  const countryListEl = document.getElementById('countryList');
  if (!countryListEl) return;
  countryListEl.innerHTML = '';

  Object.keys(countryLanguageData).forEach(country => {
    const li = document.createElement('li');
    li.className = 'selection-item';
    li.innerHTML = `
      <span>${country}</span>
      <span class="radio-circle"></span>
    `;
    li.onclick = () => selectCountry(country);
    countryListEl.appendChild(li);
  });
}

function openCountryModal() {
  document.getElementById('countryModal').classList.add('active');
}

function selectCountry(country) {
  selectedCountry = country;
  document.getElementById('countryModal').classList.remove('active');
  renderLanguages(country);
  document.getElementById('languageModal').classList.add('active');
}

function renderLanguages(country) {
  const langListEl = document.getElementById('languageList');
  document.getElementById('langModalTitle').innerText = `${country} Languages`;
  langListEl.innerHTML = '';

  const languages = countryLanguageData[country] || [{ name: "English (Main)", code: "en" }];

  languages.forEach((lang, index) => {
    const li = document.createElement('li');
    li.className = `selection-item ${index === 0 ? 'selected' : ''}`;
    li.innerHTML = `
      <span>${lang.name}</span>
      <span class="radio-circle"></span>
    `;
    li.onclick = () => applyLanguage(lang.code);
    langListEl.appendChild(li);
  });
}

function backToCountries() {
  document.getElementById('languageModal').classList.remove('active');
  document.getElementById('countryModal').classList.add('active');
}

function applyLanguage(langCode) {
  const googleSelect = document.querySelector('.goog-te-combo');
  if (googleSelect) {
    googleSelect.value = langCode;
    googleSelect.dispatchEvent(new Event('change'));
  }
  
  document.getElementById('languageModal').classList.remove('active');
  localStorage.setItem('user_country', selectedCountry);
  localStorage.setItem('user_lang', langCode);
}

// Close modals when clicking background overlay
document.addEventListener('click', (e) => {
  const countryModal = document.getElementById('countryModal');
  const languageModal = document.getElementById('languageModal');
  
  if (e.target === countryModal) countryModal.classList.remove('active');
  if (e.target === languageModal) languageModal.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', () => {
  renderCountries();
  
  const savedLang = localStorage.getItem('user_lang');
  if (savedLang) {
    const interval = setInterval(() => {
      const googleSelect = document.querySelector('.goog-te-combo');
      if (googleSelect) {
        googleSelect.value = savedLang;
        googleSelect.dispatchEvent(new Event('change'));
        clearInterval(interval);
      }
    }, 300);
  }
});
