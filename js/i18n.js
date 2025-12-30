// ==========================================================================
// MODULE: I18nManager
// Internationalization and Localization Logic
// ==========================================================================
window.I18nManager = {
    LANG_KEY: "userLang",

    // Default Data (fallback)
    data: {
      strings: {
        greeting_morning: "Good Morning",
        greeting_afternoon: "Good Afternoon",
        greeting_evening: "Good Evening",
        greeting_night: "Good Night",
        greeting_generic: "Hello",
        birthday: "Happy Birthday!",
        day: "Day",
        today: "Today",
        tomorrow: "Tomorrow",
        turns: "turns",
        isBirthday: "is birthday of",
        alsoToday: "Also today: ",
        alsoTomorrow: "Also tomorrow: ",
        calcTitle: "Life Calculator",
        calcDay: "Day",
        calcDate: "Date",
        tvTitle: "Live TV",
      },
      greetingRules: {
        morningStart: 5,
        morningEnd: 12,
        afternoonStart: 12,
        afternoonEnd: 18,
        eveningStart: 18,
        eveningEnd: 22,
      },
    },

    init: async () => {
      const storedLang = localStorage.getItem("userLang") || "en";
      await window.I18nManager.loadLocale(storedLang);
    },

    getLang: () => localStorage.getItem("userLang") || "en",

    loadLocale: async (lang) => {
      try {
        // Always fetch fresh data.
        // using timestamp to bypass browser cache during development
        const response = await fetch(`locales/${lang}.json?v=${new Date().getTime()}`);
        
        if (!response.ok) throw new Error(`Locale not found: ${response.statusText}`);
        const json = await response.json();

        window.I18nManager.data = json;
        console.log("I18n: Fetched (" + lang + ")");
      } catch (err) {
        console.error("I18n Error loading " + lang, err);
      }
    },

    // Get string (support nested keys not implemented here for speed, just flat access to data.strings)
    // Get string with optional parameter replacement (e.g. {name})
    getString: (key, params = {}) => {
      const strings = window.I18nManager.data.strings || {};
      let str = strings[key] || key;
      
      Object.keys(params).forEach((k) => {
        str = str.replace(`{${k}}`, params[k]);
      });
      
      return str;
    },
    
    // Alias for settings compatibility
    t: (key, params = {}) => {
        return window.I18nManager.getString(key, params);
    },

    // Helper to apply to DOM (used by Settings)
    applyToPage: () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(key.startsWith('[placeholder]')) {
               const realKey = key.replace('[placeholder]', '');
               el.placeholder = window.I18nManager.t(realKey);
            } else {
               el.innerHTML = window.I18nManager.t(key);
            }
        });
    }
  };
