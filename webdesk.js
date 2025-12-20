document.addEventListener("DOMContentLoaded", function () {
  
  // ==========================================================================
  // MODULE: DateUtils
  // Centralized date/time helpers and constants
  // ==========================================================================
  const DateUtils = {
    START_DATE: moment("17/10/1985", "DD/MM/YYYY"),

    getToday: () => moment(),
    getTomorrow: () => moment().add(1, "days"),
    
    getTodayStr: () => moment().format("DD/MM"),
    getTodayFull: () => moment().format("DD/MM/YYYY"),
    
    getTomorrowStr: () => moment().add(1, "days").format("DD/MM"),
    getTomorrowFull: () => moment().add(1, "days").format("DD/MM/YYYY"),
    
    getDaysSinceStart: (date = moment()) => date.diff(DateUtils.START_DATE, "days"),

    // Determine current season
    getSeason: (date = moment()) => {
      const month = date.month(); // 0-indexed
      const day = date.date();
      
      // Boundaries:
      // Spring: Sept 21 - Nov 20
      // Summer: Dec 21 - Feb 20
      // Fall: Mar 21 - May 20
      // Winter: Jun 21 - Sept 20
      
      if ((month === 8 && day >= 21) || (month > 8 && month < 11) || (month === 11 && day < 21)) {
        return { season: "spring", isFirstDay: (month === 8 && day === 21) };
      }
      if ((month === 11 && day >= 21) || month > 11 || month < 2 || (month === 2 && day < 21)) {
        return { season: "summer", isFirstDay: (month === 11 && day === 21) };
      }
      if ((month === 2 && day >= 21) || (month > 2 && month < 5) || (month === 5 && day < 21)) {
        return { season: "fall", isFirstDay: (month === 2 && day === 21) };
      }
      return { season: "winter", isFirstDay: (month === 5 && day === 21) };
    },

    isTodayEaster: (date) => {
      const year = date.getFullYear();
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      return date.getDate() === day && date.getMonth() + 1 === month;
    },

    getChineseNewYearDate: (year) => {
      const corrections = {
        2033: "2033-01-31",
        2034: "2034-02-19",
      };
      if (corrections[year]) return moment(corrections[year], "YYYY-MM-DD").toDate();

      const WINTER_SOLSTICE = moment.utc({ year: year - 1, month: 11, day: 21 });
      const SYNODIC_MONTH = 29.530588853;
      const baseNewMoon = moment.utc("2024-01-11");
      
      const monthsBetween = WINTER_SOLSTICE.diff(baseNewMoon, "days") / SYNODIC_MONTH;
      const lastNewMoon = baseNewMoon.clone().add(Math.floor(monthsBetween) * SYNODIC_MONTH, "days");
      const firstNewMoon = lastNewMoon.clone().add(SYNODIC_MONTH, "days");
      let secondNewMoon = firstNewMoon.clone().add(SYNODIC_MONTH, "days");
      
      if (secondNewMoon.date() < 21 && secondNewMoon.month() === 0) {
        secondNewMoon = secondNewMoon.clone().add(SYNODIC_MONTH, "days");
      }
      return moment(secondNewMoon).local().toDate();
    },

    getChineseZodiac: (year) => {
      const animals = [
        { sign: "Rat", emoji: "🐀" }, { sign: "Ox", emoji: "🐂" }, { sign: "Tiger", emoji: "🐅" },
        { sign: "Rabbit", emoji: "🐇" }, { sign: "Dragon", emoji: "🐉" }, { sign: "Snake", emoji: "🐍" },
        { sign: "Horse", emoji: "🐎" }, { sign: "Goat", emoji: "🐐" }, { sign: "Monkey", emoji: "🐒" },
        { sign: "Rooster", emoji: "🐓" }, { sign: "Dog", emoji: "🐕" }, { sign: "Pig", emoji: "🐖" },
      ];
      return animals[(year - 2020) % 12 + ((year - 2020) % 12 < 0 ? 12 : 0)];
    },

    isTodayChineseNewYear: (date) => {
      const cny = DateUtils.getChineseNewYearDate(date.getFullYear());
      return date.getFullYear() === cny.getFullYear() &&
             date.getMonth() === cny.getMonth() &&
             date.getDate() === cny.getDate();
    }
  };


  // ==========================================================================
  // MODULE: I18nManager
  // Internationalization and Localization Logic
  // ==========================================================================
  const I18nManager = {
    LANG_KEY: "userLang",
    
    // Default to 'en' if not set
    getLang: () => localStorage.getItem(I18nManager.LANG_KEY) || "en",
    setLang: (lang) => localStorage.setItem(I18nManager.LANG_KEY, lang),

    strings: {
      en: {
        morning: '<i class="bi bi-brightness-alt-high-fill"></i> Good morning',
        afternoon: '<i class="bi bi-brightness-high-fill"></i> Good afternoon',
        evening: '<i class="bi bi-moon-fill"></i> Good evening',
        late: '<i class="bi bi-moon-stars-fill"></i> Late Late Show',
        birthday: '<i class="bi bi-balloon-fill"></i> Happy birthday!',
        newYear: 'Happy New Year!',
        goodbyeYear: 'Yay! Goodbye',
        // Calculator
        calcDay: "Day",
        calcDate: "Date",
        calcTitle: '<i class="bi bi-calculator"></i> Life Calculator',
        // TV
        tvTitle: '<i class="bi bi-tv"></i> Live TV',
        // Events
        today: "Today",
        tomorrow: "Tomorrow",
        alsoToday: "Also today:",
        alsoTomorrow: "Also tomorrow:",
        birthdays: "birthdays",
        isBirthday: "is turning", // Simplification for "cumple"
        turns: "turns",
      },
      es: {
        morning: '<i class="bi bi-brightness-alt-high-fill"></i> Buenos días',
        afternoon: '<i class="bi bi-brightness-high-fill"></i> Buenas tardes',
        evening: '<i class="bi bi-moon-fill"></i> Buenas noches',
        late: '<i class="bi bi-moon-stars-fill"></i> Trasnoche',
        birthday: '<i class="bi bi-balloon-fill"></i> Feliz cumpleaños!',
        newYear: '¡Feliz Año Nuevo!',
        goodbyeYear: '¡Yay! Chau',
        // Calculator
        calcDay: "Día",
        calcDate: "Fecha",
        calcTitle: '<i class="bi bi-calculator"></i> Calculadora de Vida',
        // TV
        tvTitle: '<i class="bi bi-tv"></i> TV en Vivo',
        // Events
        today: "Hoy",
        tomorrow: "Mañana",
        alsoToday: "También hoy:",
        alsoTomorrow: "También mañana:",
        birthdays: "cumpleaños",
        isBirthday: "cumple",
        turns: "cumple",
      }
    },

    getString: (key) => {
      const lang = I18nManager.getLang();
      return I18nManager.strings[lang][key] || I18nManager.strings["en"][key];
    },

    getGreetingTime: (hour) => {
      const lang = I18nManager.getLang();
      if (lang === "es") {
        // Spanish Logic
        if (hour < 5) return "late";
        if (hour < 13) return "morning"; // Until 1 PM
        if (hour < 20) return "afternoon"; // Until 8 PM
        return "evening";
      } else {
        // English Logic
        if (hour < 5) return "late";
        if (hour < 12) return "morning"; // Until Noon
        if (hour < 18) return "afternoon"; // Until 6 PM
        return "evening";
      }
    }
  };


  // ==========================================================================
  // MODULE: ProfileManager
  // User Identity
  // ==========================================================================
  const ProfileManager = {
    STORAGE_KEY: "userProfile",

    getProfile: () => JSON.parse(localStorage.getItem(ProfileManager.STORAGE_KEY)) || null,
    
    setProfile: (name, birthday, lang) => {
      const profile = { name, birthday, lang, isSetup: true };
      localStorage.setItem(ProfileManager.STORAGE_KEY, JSON.stringify(profile));
      I18nManager.setLang(lang);
      // Trigger reload to apply changes globally
      location.reload();
    },

    getName: () => {
      const p = ProfileManager.getProfile();
      return p ? p.name : "User";
    },

    getBirthday: () => {
      const p = ProfileManager.getProfile();
      return p ? p.birthday : null; // YYYY-MM-DD
    },

    isSetup: () => {
      return !!ProfileManager.getProfile();
    }
  };


  // ==========================================================================
  // MODULE: StatsManager
  // Handling click tracking and local storage
  // ==========================================================================
  const StatsManager = {
    STORAGE_KEY: "clickStats",

    getStats: () => JSON.parse(localStorage.getItem(StatsManager.STORAGE_KEY)) || {},

    trackClick: (appName, category = "app") => {
      try {
        let stats = StatsManager.getStats();
        let entry = stats[appName];

        if (typeof entry === "number") {
          entry = { count: entry, category: category, lastClick: null };
        }
        if (!entry) {
          entry = { count: 0, category: category, lastClick: null };
        }

        entry.count++;
        entry.lastClick = moment().format();
        entry.category = category;

        stats[appName] = entry;
        localStorage.setItem(StatsManager.STORAGE_KEY, JSON.stringify(stats));
      } catch (e) {
        console.error("Error updating click stats:", e);
      }
    },

    init: () => {
      document.body.addEventListener("click", function (event) {
        const link = event.target.closest(".item a");
        if (link) {
          const appName = link.textContent.trim() || link.getAttribute("title") || link.href;
          const isTv = link.closest(".links.tv") !== null;
          if (appName) {
            StatsManager.trackClick(appName, isTv ? "tv" : "app");
          }
        }
      });
    }
  };


  // ==========================================================================
  // MODULE: GreetingManager
  // Dynamic header messages and visuals
  // ==========================================================================
  const GreetingManager = {
    specialDates: {
      "14/03": '<i class="bi bi-infinity"></i> Happy π Day!',
      "25/05": '🇦🇷 Feliz <a href="https://es.wikipedia.org/wiki/Revoluci%C3%B3n_de_Mayo" target="_blank">25 de Mayo!</a>',
      "09/07": '🇦🇷 Feliz día de la <a href="https://es.wikipedia.org/wiki/Declaraci%C3%B3n_de_independencia_de_la_Argentina" target="_blank">independencia</a>!',
      "17/10": '<i class="bi bi-balloon-fill"></i> Happy birthday!',
      "16/12": '<i class="bi bi-music-note-beamed"></i> Happy birthday <a href="https://peanuts.fandom.com/wiki/Beethoven%27s_birthday" target="_blank">Ludwig!</a>',
      "31/10": '<i class="bi bi-magic"></i> Happy Halloween!',
      "24/12": '<i class="bi.bi-tree-fill"></i> Christmas Eve!',
      "25/12": '<i class="bi.bi-tree-fill"></i> Merry Christmas!',
    },

    updateMessage: () => {
      const now = DateUtils.getToday();
      const time = now.hour();
      const todayStr = DateUtils.getTodayStr();
      const dayOfYear = now.dayOfYear();
      
      const name = ProfileManager.getName();
      const lang = I18nManager.getLang();
      const t = I18nManager.getString;

      let message;

      // 1. Time-based defaults using I18n Logic
      const timeKey = I18nManager.getGreetingTime(time);
      message = `${t(timeKey)} ${name}`;

      // 2. Overrides
      const { season, isFirstDay } = DateUtils.getSeason(now);
      
      // Check User Birthday
      const userBirthday = ProfileManager.getBirthday();
      if (userBirthday) {
         // Compare just day/month
         const bday = moment(userBirthday);
         if (bday.date() === now.date() && bday.month() === now.month()) {
             message = t("birthday");
         }
      }

      if (dayOfYear === 88) {
        message = "🎹 Happy Piano Day";
      } else if (DateUtils.isTodayEaster(now.toDate())) {
        message = '<i class="bi bi-egg-fill"></i> Happy Easter!';
      } else if (DateUtils.isTodayChineseNewYear(now.toDate())) {
        const zodiac = DateUtils.getChineseZodiac(now.year());
        message = `${zodiac.emoji} Happy New Lunar Year!`;
      } else if (isFirstDay) {
        const emojis = { spring: "🌸", summer: "🏖️", fall: "🍂", winter: "❄️" };
        message = `${emojis[season]} Happy first day of ${season}!`;
      } else if (GreetingManager.specialDates[todayStr]) {
        message = GreetingManager.specialDates[todayStr];
      } else if (todayStr === "31/12") {
        message = `${t("goodbyeYear")} ${now.locale(lang).format("YYYY")}`;
      } else if (todayStr === "01/01") {
        message = `${t("newYear")} Hello ${now.locale(lang).format("YYYY")}`;
      }

      const politeElem = document.getElementById("polite");
      if (politeElem) politeElem.innerHTML = message;
    },

    updateVisuals: () => {
      // Xmas Class
      if (moment().month() === 11) document.body.classList.add("xmas");
      
      // Tree Image
      const treeImage = document.querySelector(".tree img");
      if (treeImage) {
        const { season } = DateUtils.getSeason();
        const map = {
          spring: "images/tree_spring.png",
          summer: "images/tree_summer.png",
          fall: "images/tree_autumn.png",
          winter: "images/tree_winter.png"
        };
        treeImage.src = map[season];
      }
    },

    startAnimationControl: () => {
      const setAnim = (state) => document.body.style.animationPlayState = state;
      window.addEventListener("blur", () => setAnim("paused"));
      window.addEventListener("focus", () => setAnim("running"));
    },

    init: () => {
      GreetingManager.updateMessage();
      GreetingManager.updateVisuals();
      GreetingManager.startAnimationControl();
      setInterval(GreetingManager.updateMessage, 300000); // 5 mins
    }
  };


  // ==========================================================================
  // MODULE: EventsManager
  // Birthdays, Custom Events, Calculator
  // ==========================================================================
  const EventsManager = {
    formatList: (arr) => arr.join(", ").replace(/, ([^,]*)$/, " y $1"),

    checkDailyEvents: () => {
      Promise.all([
        fetch("cumples.json").then(res => res.json()).catch(() => ({ people: [] })), // Graceful fail
        fetch("events.json").then(res => res.json()).catch(() => ([])),
      ]).then(([cumplesData, eventsData]) => {
        const today = DateUtils.getTodayStr();
        const tomorrow = DateUtils.getTomorrowStr();
        const todayFull = DateUtils.getTodayFull();
        const tomorrowFull = DateUtils.getTomorrowFull();
        
        const t = I18nManager.getString;

        let baseMsg = `${todayFull} - ${t("calcDay")} ${DateUtils.getDaysSinceStart()}`;
        
        const matches = {
          cumplesToday: [], cumplesTomorrow: [],
          eventsToday: [], eventsTomorrow: []
        };

        // Filter Birthdays
        if(cumplesData.people) {
            cumplesData.people.forEach(b => {
              if (b.birthday === today) matches.cumplesToday.push(`<span>${b.name}</span>`);
              if (b.birthday === tomorrow) matches.cumplesTomorrow.push(b.name);
            });
        }

        // Merge file events with localStorage events (Deduplication)
        const customEvents = JSON.parse(localStorage.getItem("customEvents")) || [];
        
        const eventMap = new Map();
        
        [...eventsData, ...customEvents].forEach(e => {
            const key = `${e.date}|${e.name}`;
            eventMap.set(key, e);
        });
        
        const allEvents = Array.from(eventMap.values());

        // Filter Events
        allEvents.forEach(e => {
          const nameHtml = e.url ? `<a href="${e.url}" target="_blank"><span>${e.name}</span></a>` : `<span>${e.name}</span>`;
          const nameText = e.url ? `<a href="${e.url}" target="_blank">${e.name}</a>` : e.name;
          if (e.date === todayFull) matches.eventsToday.push(nameHtml);
          if (e.date === tomorrowFull) matches.eventsTomorrow.push(nameText);
        });

        const extraMsg = EventsManager.buildEventMessage(matches);
        if (extraMsg) baseMsg += " - " + extraMsg;
        
        document.getElementById("fecha").innerHTML = baseMsg.trim();
      }).catch(err => console.error("Error loading events:", err));
    },

    buildEventMessage: ({ cumplesToday, cumplesTomorrow, eventsToday, eventsTomorrow }) => {
      const hasCT = cumplesToday.length > 0;
      const hasCTM = cumplesTomorrow.length > 0;
      const hasET = eventsToday.length > 0;
      const hasETM = eventsTomorrow.length > 0;
      
      const t = I18nManager.getString;
      let parts = [];

      // Today
      if (hasCT) parts.push(`${t("today")} ${t(cumplesToday.length > 1 ? "turns" : "isBirthday")} ${EventsManager.formatList(cumplesToday)}`);
      if (hasET) parts.push(`${hasCT ? t("alsoToday") : t("today") + ":"}${EventsManager.formatList(eventsToday)}`);
      
      // Tomorrow
      if (hasCTM) parts.push(`${t("tomorrow")} ${t(cumplesTomorrow.length > 1 ? "turns" : "isBirthday")} ${EventsManager.formatList(cumplesTomorrow)}`);
      if (hasETM) parts.push(`${hasCTM ? t("alsoTomorrow") : t("tomorrow") + ":"}${EventsManager.formatList(eventsTomorrow)}`);

      return parts.length > 0 ? parts.join(". ") + "." : "";
    },

    initCalculator: () => {
      const t = I18nManager.getString;
      const userBirthday = ProfileManager.getBirthday() || "1985-10-17"; // Fallback to Santi's
      
      // Update START_DATE if user has one
      if(userBirthday) DateUtils.START_DATE = moment(userBirthday, "YYYY-MM-DD");

      const calcDiv = document.createElement("div");
      calcDiv.className = "dias-calc-section";
      calcDiv.innerHTML = `
        <div class="input-group mb-3">
          <span class="input-group-text">${t("calcDay")}</span>
          <input type="number" class="form-control dias-calc-input" min="0" placeholder="# de días">
          <span class="ms-3 dias-calc-resultado"></span>
        </div>
        <div class="input-group mb-3">
          <span class="input-group-text">${t("calcDate")}</span>
          <input type="date" class="form-control dias-calc-date" min="${userBirthday}" max="${moment().format("YYYY-MM-DD")}">
          <span class="ms-3 dias-calc-dia"></span>
        </div>
      `;
      
      const caja = document.querySelector(".caja");
      const hr = document.createElement("hr");
      const h2 = document.createElement("h2");
      h2.innerHTML = t("calcTitle");
      caja.appendChild(hr);
      caja.appendChild(h2);
      caja.appendChild(calcDiv);

      const inputDias = calcDiv.querySelector(".dias-calc-input");
      const resultDias = calcDiv.querySelector(".dias-calc-resultado");
      const inputFecha = calcDiv.querySelector(".dias-calc-date");
      const resultFecha = calcDiv.querySelector(".dias-calc-dia");

      inputDias.addEventListener("input", () => {
        const days = parseInt(inputDias.value, 10);
        if (!isNaN(days) && days >= 0) {
          resultDias.textContent = DateUtils.START_DATE.clone().add(days, "days").format("DD/MM/YYYY");
        } else {
          resultDias.textContent = "";
        }
      });

      inputFecha.addEventListener("change", () => {
        if (inputFecha.value) {
          const days = moment(inputFecha.value, "YYYY-MM-DD").diff(DateUtils.START_DATE, "days");
          resultFecha.textContent = `${t("calcDay")} ${days}`;
        } else {
          resultFecha.textContent = "";
        }
      });
      
      // UI Polish for date input
      inputFecha.addEventListener("input", () => {
        const val = inputFecha.value;
        if(val) inputFecha.setAttribute("data-date", moment(val).format("DD/MM/YYYY"));
        else inputFecha.removeAttribute("data-date");
      });
    },

    init: () => {
      EventsManager.checkDailyEvents();
    }
  };


  // ==========================================================================
  // MODULE: AppManager
  // Loading, Filtering, and Rendering Apps
  // ==========================================================================
  const AppManager = {
    // SEPARATE: Catalog (items.json) vs UserApps (localStorage)
    
    // Get list of configured apps (Array of names/indices or objects)
    // We'll store: [{ name: "Gmail" }, { name: "YouTube" }] in order
    getUserApps: () => JSON.parse(localStorage.getItem("myApps")) || [],
    
    // For now we just return the full list if no config, but moving forward we want explicit opt-in
    
    renderGrid: (userAppsItems, template) => {
      if (!userAppsItems || userAppsItems.length === 0) return;

      const html = template(userAppsItems);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      
      const fragment = document.createDocumentFragment();
      let container = document.querySelector(".links");
      // Clear existing content if refetching
      container.innerHTML = ""; 
      
      const children = Array.from(tempDiv.children);

      children.forEach((item, index) => {
        if (index === 40) {
          container.appendChild(fragment);
          const hr = document.createElement("hr");
          container.insertAdjacentElement("afterend", hr);
          const newContainer = document.createElement("div");
          newContainer.className = "morelinks";
          hr.insertAdjacentElement("afterend", newContainer);
          container = newContainer;
        }
        fragment.appendChild(item);
      });
      container.appendChild(fragment);
    },

    renderTv: (items, template) => {
      const t = I18nManager.getString;
      // TV is also optional now? For now let's keep it if enabled in apps
      // Actually user said: "items.json and tv-items.json are now the OPTIONS"
      // So TV channels should also be in the user list?
      // For simplicity, let's treat TV section as separate for now or merge them?
      // "In settings.html ... App Manager ... You can add and remove apps from the options presented in items.json."
      
      // It implies a unified list or keeping the distinction. 
      // Let's assume for now we only render if the user has selected them.
      // But typically TV channels are a separate block.
      // Let's hide TV block if no TV items are selected.
      
      if (!items || items.length === 0) return;

      const hr = document.createElement("hr");
      const h2 = document.createElement("h2");
      h2.innerHTML = t("tvTitle");

      const div = document.createElement("div");
      div.className = "links tv";
      div.innerHTML = template(items);

      const caja = document.querySelector(".caja");
      caja.appendChild(hr);
      caja.appendChild(h2);
      caja.appendChild(div);
      return div;
    },

    init: () => {
      const source = document.getElementById("item-template").innerHTML;
      const template = Handlebars.compile(source);

      // We need to fetch the CATALOG to know the details (icon, url) of the saved apps
      Promise.all([
        fetch("items.json").then(res => res.json()).catch(() => []),
        fetch("tv-items.json").then(res => res.json()).catch(() => [])
      ]).then(([appCatalog, tvCatalog]) => {
        
        // 1. Check if First Time
        if (!ProfileManager.isSetup()) {
            // Show Onboarding
            if (window.OnboardingManager) {
                OnboardingManager.start();
            } else {
                console.error("OnboardingManager not found");
            }
            return;
        }

        // 2. Load User Config
        const userApps = AppManager.getUserApps(); // [{ name: "Gmail" }, ...]
        
        // 3. Hydrate User Apps with Catalog Data
        // We match by Name
        const catalogMap = new Map([...appCatalog, ...tvCatalog].map(item => [item.name, item]));
        
        const hydratedApps = [];
        const hydratedTv = [];

        userApps.forEach(userApp => {
            const catalogItem = catalogMap.get(userApp.name);
            if (catalogItem) {
                // Determine if it was TV based on some flag? 
                // Using the checking of existence in tvCatalog is safer if overlapping names (unlikely)
                // Or we can store type in myApps.
                
                // For now, let's check input lists.
                // WEAKNESS: If name collision. 
                const isTv = tvCatalog.some(t => t.name === userApp.name);
                
                if (isTv) hydratedTv.push(catalogItem);
                else hydratedApps.push(catalogItem);
            }
        });

        // 4. Filter & Render
        const config = JSON.parse(localStorage.getItem("appConfig")) || { hidden: [], filters: {} };
        const stats = StatsManager.getStats();

        // Apply Filters to Apps
        let finalApps = hydratedApps.filter(app => {
            // 1. Explicitly Hidden
            if (config.hidden && config.hidden.includes(app.name)) return false;
            
            // 2. Smart Filters
            if (config.filters) {
                const appStats = stats[app.name];
                const clickCount = appStats ? (typeof appStats === 'number' ? appStats : appStats.count) : 0;
                
                if (config.filters.hideNeverClicked && clickCount === 0) return false;
                if (config.filters.minClicks > 0 && clickCount < config.filters.minClicks) return false;
            }
            return true;
        });

        AppManager.renderGrid(finalApps, template);
        
        // Render TV (Optional: Apply filters to TV too? For now, just render if present)
        if (hydratedTv.length > 0) {
            AppManager.renderTv(hydratedTv, template);
        }

        // Tooltips
        Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el => new bootstrap.Tooltip(el));

        // Calculator waits for DOM
        EventsManager.initCalculator();
      });
    }
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  // Stats Listener attached immediately
  StatsManager.init();
  
  // Boot up managers
  GreetingManager.init();
  EventsManager.init();
  AppManager.init();

});
