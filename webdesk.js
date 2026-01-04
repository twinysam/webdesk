document.addEventListener("DOMContentLoaded", function () {
  // ==========================================================================
  // MODULE: DateUtils
  // Centralized date/time helpers and constants
  // ==========================================================================
  // ==========================================================================
  // MODULE: DateUtils -> MOVED TO js/date-utils.js
  // ==========================================================================
  // (DateUtils is now global)

  // ==========================================================================
  // MODULE: I18nManager -> MOVED TO js/i18n.js
  // ==========================================================================
  // Extending I18nManager with time-based logic which depends on Moment (loaded here)
  if (window.I18nManager) {
      window.I18nManager.getGreetingTime = (m) => {
          const g = window.I18nManager.data.greetingRules || {}; // fallback
          if (!m || !m.isValid()) return "generic";
      
          const currentHour = parseFloat(m.format("H"));
      
          if (currentHour >= g.morningStart && currentHour < g.morningEnd) {
            return "morning";
          } else if (currentHour >= g.afternoonStart && currentHour < g.eveningStart) {
            return "afternoon";
          } else if (currentHour >= g.eveningStart) {
            return "evening";
          } else {
            return "generic";
          }
      };
  }

  // ==========================================================================
  // MODULE: ProfileManager
  // User Identity
  // ==========================================================================
  window.ProfileManager = {
    STORAGE_KEY: "userProfile",

    getProfile: () =>
      JSON.parse(localStorage.getItem(ProfileManager.STORAGE_KEY)) || null,

    setProfile: (name, birthday, lang) => {
      const profile = { name, birthday, lang, isSetup: true };
      localStorage.setItem(ProfileManager.STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem("userLang", lang); // Sync lang
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
    },
  };

  // ==========================================================================
  // MODULE: PreferencesManager
  // Internal OS Preferences
  // ==========================================================================
  const PreferencesManager = {
      STORAGE_KEY: "userPreferences",

      getPreferences: () => JSON.parse(localStorage.getItem(PreferencesManager.STORAGE_KEY)) || {},

      apply: () => {
          const prefs = PreferencesManager.getPreferences();
          
          // 1. Evening Start Override
          if (prefs.eveningStart !== null && prefs.eveningStart !== undefined) {
              if (!I18nManager.data.greetingRules) I18nManager.data.greetingRules = {};
              I18nManager.data.greetingRules.eveningStart = prefs.eveningStart;
          }

          // 2. Tree Toggle
          const tree = document.querySelector(".tree");
          if (tree) {
             if (prefs.treeEnabled === false) {
                 tree.style.display = "none";
             } else {
                 tree.style.display = ""; // Reset
             }
          }

          // 3. Custom Late Late Show Greeting
           if (prefs.customLateGreeting) {
              if (!I18nManager.data.strings) I18nManager.data.strings = {};
              // Directly override the string in memory
              I18nManager.data.strings["greeting_latelateshow"] = prefs.customLateGreeting;
          }
      },

      init: () => {
          PreferencesManager.apply();
      }
  };

  // ==========================================================================
  // MODULE: StatsManager
  // Handling click tracking and local storage
  // ==========================================================================
  const StatsManager = {
    STORAGE_KEY: "clickStats",

    getStats: () =>
      JSON.parse(localStorage.getItem(StatsManager.STORAGE_KEY)) || {},

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
          const appName =
            link.textContent.trim() || link.getAttribute("title") || link.href;
          const isTv = link.closest(".links.tv") !== null;
          if (appName) {
            StatsManager.trackClick(appName, isTv ? "tv" : "app");
          }
        }
      });
    },
  };

  // ==========================================================================
  // MODULE: GreetingManager
  // Dynamic header messages and visuals
  // ==========================================================================
  const GreetingManager = {
    specialDates: {
      "14/03": '<i class="bi bi-infinity"></i> Happy π Day!',
      "25/05":
        '🇦🇷 Feliz <a href="https://es.wikipedia.org/wiki/Revoluci%C3%B3n_de_Mayo" target="_blank">25 de Mayo!</a>',
      "09/07":
        '🇦🇷 Feliz día de la <a href="https://es.wikipedia.org/wiki/Declaraci%C3%B3n_de_independencia_de_la_Argentina" target="_blank">independencia</a>!',
      "16/12":
        '<i class="bi bi-music-note-beamed"></i> Happy birthday <a href="https://peanuts.fandom.com/wiki/Beethoven%27s_birthday" target="_blank">Ludwig!</a>',
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
      const t = I18nManager.getString;

      let message;

      // 1. Time-based defaults
      let timeKey = I18nManager.getGreetingTime(now);
      if (time < 5) timeKey = "latelateshow"; // Late Late Show override

      const greetingText = t(`greeting_${timeKey}`, { name: name }); // Pass name for Late Late Show
      
      // If the localized string already contains the name (checked by presence of {name} placeholder in source), 
      // t() handles it if we passed params. If it's a standard greeting without placeholder, we append name.
      if (greetingText.includes(name)) {
         message = greetingText;
      } else {
         message = `${greetingText}, <span class="name-highlight">${name}</span>`;
      }

      // 2. Overrides
      const { season, isFirstDay } = DateUtils.getSeason(now);

      // User Birthday Check
      const userBirthday = ProfileManager.getBirthday();
      if (userBirthday) {
        const bday = moment(userBirthday);
        if (bday.date() === now.date() && bday.month() === now.month()) {
          message = `<i class="bi bi-balloon-fill"></i> ${t("birthday")}`;
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
        message = `Goodbye ${now.format("YYYY")}`;
      } else if (todayStr === "01/01") {
        message = `Happy New Year! Hello ${now.format("YYYY")}`;
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
          winter: "images/tree_winter.png",
        };
        treeImage.src = map[season];
      }
    },

    startAnimationControl: () => {
      const setAnim = (state) =>
        (document.body.style.animationPlayState = state);
      window.addEventListener("blur", () => setAnim("paused"));
      window.addEventListener("focus", () => setAnim("running"));
      
      let resizeTimeout;
      window.addEventListener("resize", () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
              const fechaEl = document.getElementById("fecha");
              if(fechaEl && fechaEl.innerHTML) EventsManager.handleOverflow(fechaEl);
          }, 100);
      });
    },

    init: () => {
      GreetingManager.updateMessage();
      GreetingManager.updateVisuals();
      GreetingManager.startAnimationControl();
      setInterval(GreetingManager.updateMessage, 60000 * 5); // 5 mins
    },
  };

  // ==========================================================================
  // MODULE: EventsManager
  // Birthdays, Custom Events, Calculator
  // ==========================================================================
  const EventsManager = {
    formatList: (arr) => {
      const sep = I18nManager.getString("list_separator") || ", ";
      const lastSep = I18nManager.getString("list_last_separator") || " y ";
      if (arr.length === 0) return "";
      if (arr.length === 1) return arr[0];
      const last = arr.pop();
      return arr.join(sep) + lastSep + last;
    },

    checkDailyEvents: () => {
      Promise.all([
        fetch("cumples.json")
          .then((res) => res.json())
          .catch(() => []),
        fetch("events.json")
          .then((res) => res.json())
          .catch(() => []),
      ])
        .then(([cumplesFile, eventsData]) => {
          const today = DateUtils.getTodayStr();
          const tomorrow = DateUtils.getTomorrowStr();
          const todayFull = DateUtils.getTodayFull();
          const tomorrowFull = DateUtils.getTomorrowFull();

          const t = (key) => I18nManager.getString(key);
          const tSafe = (key) => I18nManager.data.strings[key] || key; // Direct access helper

          let baseMsg = `${todayFull} - ${t(
            "day"
          )} ${DateUtils.getDaysSinceStart()}`;

          const matches = {
            cumplesToday: [],
            cumplesTomorrow: [],
            eventsToday: [],
            eventsTomorrow: [],
          };

          // --- MERGE BIRTHDAYS (File + LocalStorage) ---
          // 1. Get File Data
          let fileBirthdays = [];
          if (
            Array.isArray(cumplesFile) &&
            cumplesFile.length > 0 &&
            cumplesFile[0].people
          ) {
            fileBirthdays = cumplesFile[0].people;
          } else if (Array.isArray(cumplesFile)) {
            fileBirthdays = cumplesFile;
          }

          // 2. Get Local Storage Data
          const userBirthdays =
            JSON.parse(localStorage.getItem("userBirthdays")) || [];

          // 3. Combine
          const allBirthdays = [...fileBirthdays, ...userBirthdays];

          // 4. Check Dates
          allBirthdays.forEach((b) => {
            if (b.birthday === today)
              matches.cumplesToday.push(`<span>${b.name}</span>`);
            if (b.birthday === tomorrow) matches.cumplesTomorrow.push(b.name);
          });

          // --- ANNUAL EVENTS (Treat as regular events for display) ---
          const annualEvents = JSON.parse(localStorage.getItem("annualEvents")) || [];
          annualEvents.forEach((e) => {
            const nameHtml = e.url
              ? `<a href="${e.url}" target="_blank"><span>${e.name}</span></a>`
              : `<span>${e.name}</span>`;
            const nameText = e.url
              ? `<a href="${e.url}" target="_blank">${e.name}</a>`
              : e.name;
            if (e.date === today) matches.eventsToday.push(nameHtml);
            if (e.date === tomorrow) matches.eventsTomorrow.push(nameText);
          });

          // --- MERGE EVENTS ---
          const customEvents =
            JSON.parse(localStorage.getItem("customEvents")) || [];
          const eventMap = new Map();

          [...eventsData, ...customEvents].forEach((e) => {
            const key = `${e.date}|${e.name}`;
            eventMap.set(key, e);
          });

          const allEvents = Array.from(eventMap.values());

          allEvents.forEach((e) => {
            const nameHtml = e.url
              ? `<a href="${e.url}" target="_blank"><span>${e.name}</span></a>`
              : `<span>${e.name}</span>`;
            const nameText = e.url
              ? `<a href="${e.url}" target="_blank">${e.name}</a>`
              : e.name;
            if (e.date === todayFull) matches.eventsToday.push(nameHtml);
            if (e.date === tomorrowFull) matches.eventsTomorrow.push(nameText);
          });

          const extraMsg = EventsManager.buildEventMessage(matches);
          if (extraMsg) baseMsg += " - " + extraMsg;

          const fechaEl = document.getElementById("fecha");
          if (fechaEl) {
             fechaEl.innerHTML = baseMsg.trim();
             // Check overflow after rendering
             setTimeout(() => EventsManager.handleOverflow(fechaEl), 0);
          }
        })
        .catch((err) => console.error("Error loading events:", err));
    },

    buildEventMessage: ({
      cumplesToday,
      cumplesTomorrow,
      eventsToday,
      eventsTomorrow,
    }) => {
      const hasCT = cumplesToday.length > 0;
      const hasCTM = cumplesTomorrow.length > 0;
      const hasET = eventsToday.length > 0;
      const hasETM = eventsTomorrow.length > 0;

      const t = I18nManager.getString;
      let parts = [];

      // Today
      if (hasCT) {
         if (I18nManager.getLang() === 'en') {
             // ENGLISH LOGIC: "[Name]'s birthday is today" / "[Names]'s birthdays are today"
             const list = EventsManager.formatList(cumplesToday);
             const isPlural = cumplesToday.length > 1;
             const subject = isPlural ? "birthdays" : "birthday";
             const verb = isPlural ? "are" : "is";
             // e.g. "Spike's birthday is today" / "Carlos and Vivi's birthdays are today"
             parts.push(`${list}'s ${subject} ${verb} ${t("today")}`);
         } else {
             // SPANISH / DEFAULT LOGIC
             parts.push(
               `${t("today")} ${t(
                 cumplesToday.length > 1 ? "turns" : "isBirthday"
               )} ${EventsManager.formatList(cumplesToday)}`
             );
         }
      }
      if (hasET)
        parts.push(
          `${
            hasCT ? t("alsoToday") + " " : t("today") + ": "
          }${EventsManager.formatList(eventsToday)}`
        );

      // Tomorrow
      if (hasCTM) {
         if (I18nManager.getLang() === 'en') {
             // ENGLISH LOGIC
             const list = EventsManager.formatList(cumplesTomorrow);
             const isPlural = cumplesTomorrow.length > 1;
             const subject = isPlural ? "birthdays" : "birthday";
             const verb = isPlural ? "are" : "is";
             parts.push(`${list}'s ${subject} ${verb} ${t("today") === "Today" ? "tomorrow" : t("tomorrow")}`);
             // Note: t("today") check is a hack if "tomorrow" key isn't strictly just "tomorrow". 
             // Better: just hardcode "tomorrow" since this IS the English block.
         } else {
             parts.push(
               `${t("tomorrow")} ${t(
                 cumplesTomorrow.length > 1 ? "turns" : "isBirthday"
               )} ${EventsManager.formatList(cumplesTomorrow)}`
             );
         }
      }
      if (hasETM)
        parts.push(
          `${
            hasCTM ? t("alsoTomorrow") + " " : t("tomorrow") + ": "
          }${EventsManager.formatList(eventsTomorrow)}`
        );

      return parts.length > 0 ? parts.join(". ") + "." : "";
    },

    initCalculator: () => {
      const t = I18nManager.getString;
      const userBirthday = ProfileManager.getBirthday();
      const calcMinDate = userBirthday || "1900-01-01";

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
          <input type="date" class="form-control dias-calc-date" min="${calcMinDate}" max="${moment().format(
        "YYYY-MM-DD"
      )}">
          <span class="ms-3 dias-calc-dia"></span>
        </div>
      `;

      const caja = document.querySelector(".caja");
      if (caja) {
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
            resultDias.textContent = DateUtils.START_DATE.clone()
              .add(days, "days")
              .format("DD/MM/YYYY");
          } else {
            resultDias.textContent = "";
          }
        });

        inputFecha.addEventListener("change", () => {
          if (inputFecha.value) {
            const days = moment(inputFecha.value, "YYYY-MM-DD").diff(
              DateUtils.START_DATE,
              "days"
            );
            resultFecha.textContent = `${t("calcDay")} ${days}`;
          } else {
            resultFecha.textContent = "";
          }
        });

        inputFecha.addEventListener("input", () => {
          const val = inputFecha.value;
          if (val)
            inputFecha.setAttribute(
              "data-date",
              moment(val).format("DD/MM/YYYY")
            );
          else inputFecha.removeAttribute("data-date");
        });
      }
    },

    init: () => {
      // Ensure START_DATE is correct before checking events
      const userBirthday = ProfileManager.getBirthday();
      if (userBirthday)
        DateUtils.START_DATE = moment(userBirthday, "YYYY-MM-DD");

      EventsManager.checkDailyEvents();
    },

    handleOverflow: (element) => {
      // 1. Reset (in case of re-run)
      element.classList.remove("expandable-text");
      const oldArrow = element.querySelector(".expandable-arrow");
      if (oldArrow) oldArrow.remove();

      // 2. Check Overflow
      // Temporarily force nowrap to check if it WOULD overflow
      const prevWS = element.style.whiteSpace;
      element.style.whiteSpace = "nowrap";
      const isOverflowing = element.scrollWidth > element.clientWidth;
      element.style.whiteSpace = prevWS;

      if (isOverflowing) {
        element.classList.add("expandable-text");

        const arrow = document.createElement("span");
        arrow.className = "expandable-arrow";
        arrow.innerHTML = "▼";
        arrow.title = "Show full text";
        
        arrow.onclick = (e) => {
          e.stopPropagation();
          element.classList.remove("expandable-text");
          arrow.remove();
        };

        element.appendChild(arrow);
      }
    },
  };

  // ==========================================================================
  // MODULE: AppManager
  // Loading, Filtering, and Rendering Apps
  // ==========================================================================
  const AppManager = {
    getUserApps: () => JSON.parse(localStorage.getItem("myApps")) || [],

    renderGrid: (userAppsItems, template) => {
      if (!userAppsItems || userAppsItems.length === 0) return;

      const html = template(userAppsItems);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const fragment = document.createDocumentFragment();
      let container = document.querySelector(".links");
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

      Promise.all([
        fetch("items.json")
          .then((res) => res.json())
          .catch(() => []),
        fetch("tv-items.json")
          .then((res) => res.json())
          .catch(() => []),
      ]).then(([appCatalog, tvCatalog]) => {
        if (!ProfileManager.isSetup()) {
          if (window.OnboardingManager) {
            OnboardingManager.start();
          } else {
            console.error("OnboardingManager not found");
          }
          return;
        }

        const userApps = AppManager.getUserApps();
        const catalogMap = new Map(
          [...appCatalog, ...tvCatalog].map((item) => [item.name, item])
        );

        const hydratedApps = [];
        const hydratedTv = [];

        userApps.forEach((userApp) => {
          const catalogItem = catalogMap.get(userApp.name);
          if (catalogItem) {
            const isTv = tvCatalog.some((t) => t.name === userApp.name);
            if (isTv) hydratedTv.push(catalogItem);
            else hydratedApps.push(catalogItem);
          }
        });

        const config = JSON.parse(localStorage.getItem("appConfig")) || {
          hidden: [],
          filters: {},
        };
        const stats = StatsManager.getStats();

        let finalApps = hydratedApps.filter((app) => {
          if (config.hidden && config.hidden.includes(app.name)) return false;
          if (config.filters) {
            const appStats = stats[app.name];
            const clickCount = appStats
              ? typeof appStats === "number"
                ? appStats
                : appStats.count
              : 0;

            if (config.filters.hideNeverClicked && clickCount === 0)
              return false;
            if (
              config.filters.minClicks > 0 &&
              clickCount < config.filters.minClicks
            )
              return false;
          }
          return true;
        });

        AppManager.renderGrid(finalApps, template);

        if (hydratedTv.length > 0) {
          AppManager.renderTv(hydratedTv, template);
        }

        Array.from(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        ).forEach((el) => new bootstrap.Tooltip(el));

        EventsManager.initCalculator();
      });
    },
  };

  // ==========================================================================
  // MODULE: LinksManager
  // Custom User Links
  // ==========================================================================
  const LinksManager = {
    STORAGE_KEY: "userLinks",

    getLinks: () =>
      JSON.parse(localStorage.getItem(LinksManager.STORAGE_KEY)) || [],

    render: () => {
      const links = LinksManager.getLinks();
      const container = document.getElementById("custom-links-container");
      if (!container) return;

      container.innerHTML = "";
      container.className = "custom-links-container";

      if (links.length === 0) return;

      const count = links.length;
      let colClass = "links-cols-1";
      if (count > 21) colClass = "links-cols-4";
      else if (count > 14) colClass = "links-cols-3";
      else if (count > 7) colClass = "links-cols-2";

      container.classList.add(colClass);

      const h2 = document.createElement("h2");
      h2.innerHTML = '<hr /><i class="bi bi-link-45deg"></i> Links';
      container.appendChild(h2);

      const ul = document.createElement("ul");
      links.forEach((link) => {
        const li = document.createElement("li");
        const displayName = link.name || link.url;
        li.innerHTML = `<a href="${link.url}" target="_blank">${displayName}</a>`;
        ul.appendChild(li);
      });
      container.appendChild(ul);
    },

    init: () => {
      LinksManager.render();
    },
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  // Stats Listener attached immediately
  StatsManager.init();

  // Boot up managers
  I18nManager.init().then(() => {
    PreferencesManager.init();
    GreetingManager.init();
    EventsManager.init();
    AppManager.init();
    LinksManager.init();
  });
});
