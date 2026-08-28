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
        turns: "turn",
        isBirthday: "is the birthday of",
        alsoToday: "Also today:",
        alsoTomorrow: "Also tomorrow:",
        calcTitle: "Life Calculator",
        calcDay: "Day",
        calcDate: "Date",
        tvTitle: "Live TV",
        list_separator: ", ",
        list_last_separator: " and ",
        header_manage_events: "Manage Events",
        label_event_type: "Event Type",
        type_birthday: "Birthday",
        type_annual: "Annual Event",
        type_unique: "Unique Event",
        btn_add_event: "Add Event",
        btn_save_changes: "Save Changes",
        btn_cancel_edit: "Cancel",
        btn_edit: "Edit",
        btn_delete: "Delete",
        confirm_delete_event: "Are you sure you want to delete this event?",
        alert_event_added: "Event added successfully!",
        alert_event_updated: "Event updated successfully!",
        alert_event_deleted: "Event deleted!",
        no_events_year: "No events found for this year.",
        label_countdown_enable: "Show countdown reminder",
        label_year: "Year",
        label_all_types: "All Types",
        backup_reminder_due: "It has been a while since your last backup. You should go to the Settings here to save your backup file",
        backup_reminder_first: "You should consider backing up your preferences and data just in case, right here in the Settings",
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
