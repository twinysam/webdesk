// ==========================================================================
// MODULE: I18nManager
// Internationalization and Localization Logic
// ==========================================================================
(function(scope) {
    scope.I18nManager = {
      LANG_KEY: "userLang",
      CACHE_KEY_PREFIX: "i18n_cache_v2_", // Using v2 cache key
  
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
        await scope.I18nManager.loadLocale(storedLang);
      },
  
      getLang: () => localStorage.getItem("userLang") || "en",
  
      loadLocale: async (lang) => {
        const cacheKey = scope.I18nManager.CACHE_KEY_PREFIX + lang;
        const cached = localStorage.getItem(cacheKey);
  
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.version) {
              scope.I18nManager.data = parsed;
              console.log("I18n: Loaded from cache (" + lang + ")");
              return;
            }
          } catch (e) {
            console.warn("I18n: Cache invalid, fetching...");
          }
        }
  
        try {
          // Cache busting
          const response = await fetch(`locales/${lang}.json?v=${new Date().getTime()}`);
          if (!response.ok) throw new Error("Locale not found");
          const json = await response.json();
  
          scope.I18nManager.data = json;
          localStorage.setItem(cacheKey, JSON.stringify(json));
          console.log("I18n: Fetched and cached (" + lang + ")");
        } catch (err) {
          console.error("I18n Error:", err);
        }
      },
  
      // Get string (support nested keys not implemented here for speed, just flat access to data.strings)
      getString: (key) => {
        const strings = scope.I18nManager.data.strings || {};
        return strings[key] || key;
      },
      
      // Alias for settings compatibility
      t: (key) => {
          return scope.I18nManager.getString(key);
      },
  
      // Helper to apply to DOM (used by Settings)
      applyToPage: () => {
          document.querySelectorAll('[data-i18n]').forEach(el => {
              const key = el.getAttribute('data-i18n');
              if(key.startsWith('[placeholder]')) {
                 const realKey = key.replace('[placeholder]', '');
                 el.placeholder = scope.I18nManager.t(realKey);
              } else {
                 el.innerHTML = scope.I18nManager.t(key);
              }
          });
      }
    };
})(window);
