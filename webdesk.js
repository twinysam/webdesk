document.addEventListener("DOMContentLoaded", function () {
  if (window.isMobileBlocked) return;

  // Extend I18nManager with time-based greeting logic (depends on Day.js loaded here)
  if (window.I18nManager) {
    window.I18nManager.getGreetingTime = (m) => {
      const g = window.I18nManager.data.greetingRules || {}; // fallback
      if (!m || !m.isValid()) return "generic";

      const currentHour = parseFloat(m.format("H"));

      if (currentHour >= g.morningStart && currentHour < g.morningEnd) {
        return "morning";
      } else if (
        currentHour >= g.afternoonStart &&
        currentHour < g.eveningStart
      ) {
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

    getPreferences: () => {
      const prefs = JSON.parse(localStorage.getItem(PreferencesManager.STORAGE_KEY)) || {};
      return {
        bgPattern: "Endless Clouds",
        bgScrollSpeed: 10,
        patternOpacity: 0.2,
        theme: "system",
        ...prefs
      };
    },

    // Helper for SVG Patterns
    getPatternDataUri: (patternName, color, opacity) => {
      if (typeof generatePatternUri === "function") {
        return generatePatternUri(patternName, color, opacity);
      }
      return null;
    },

    cachePattern: (patternUri, bgColor) => {
      localStorage.setItem("cachedBgPattern", patternUri || "");
      localStorage.setItem("cachedBgColor", bgColor || "");
    },

    apply: () => {
      const prefs = PreferencesManager.getPreferences();

      // 1. Evening Start Override
      if (prefs.eveningStart !== null && prefs.eveningStart !== undefined) {
        if (!I18nManager.data.greetingRules)
          I18nManager.data.greetingRules = {};
        I18nManager.data.greetingRules.eveningStart = prefs.eveningStart;
      }

      // 2. Tree Toggle
      const tree = document.querySelector(".tree");
      if (tree) {
        if (prefs.treeEnabled === false) {
          tree.classList.add("d-none");
        } else {
          tree.classList.remove("d-none"); // Reset
        }
      }

      // 3. Custom Late Late Show Greeting
      if (prefs.customLateGreeting) {
        if (!I18nManager.data.strings) I18nManager.data.strings = {};
        I18nManager.data.strings["greeting_latelateshow"] =
          prefs.customLateGreeting;
      }

      // 4. Full Width
      const caja = document.querySelector(".caja");
      if (caja) {
        if (prefs.fullWidth) {
          caja.classList.add("fullwidth");
        } else {
          caja.classList.remove("fullwidth");
        }
      }

      // 5. Theme & Mode Calculation
      const theme = prefs.theme || "system";
      const body = document.body;

      // 1. Reset Classes - Clean slate
      body.classList.remove("light-mode", "dark-mode");

      // Only force a class if explicitly set to light or dark
      // If theme is 'system', let CSS media queries handle it
      if (theme === "light") {
        body.classList.add("light-mode");
      } else if (theme === "dark") {
        body.classList.add("dark-mode");
      }
      // No class added for 'system' mode - CSS media queries will handle theme switching

      // 6. Background Appearance - Inject Dual Variables
      // We define both light and dark variables so CSS media queries can swap instantly
      const pColorLight = prefs.patternColorLight || "#014669";
      const pColorDark = prefs.patternColorDark || "#313131";
      const pOpacity = prefs.patternOpacity || 0.2;

      // Set Colors - Both light and dark values always injected
      body.style.setProperty(
        "--bg-color-light",
        prefs.bgColorLight || "#016293",
      );
      body.style.setProperty("--bg-color-dark", prefs.bgColorDark || "#131313");

      // Set Patterns - Use cached values if available to avoid loading bg-patterns.js
      const cachedLight = localStorage.getItem("cachedBgImageLight");
      const cachedDark = localStorage.getItem("cachedBgImageDark");
      const cachedSize = localStorage.getItem("cachedBgSize");

      if (cachedLight && cachedLight !== "none") {
        body.style.setProperty("--bg-image-light", `url("${cachedLight}")`);
      } else if (prefs.bgPattern === "none") {
        body.style.setProperty("--bg-image-light", "none");
      }

      if (cachedDark && cachedDark !== "none") {
        body.style.setProperty("--bg-image-dark", `url("${cachedDark}")`);
      } else if (prefs.bgPattern === "none") {
        body.style.setProperty("--bg-image-dark", "none");
      }

      // If no cache, but we have a pattern name and generator, try to generate (fallback)
      if (!cachedLight && prefs.bgPattern && prefs.bgPattern !== "none" && typeof generatePatternUri === "function") {
          const uriLight = generatePatternUri(prefs.bgPattern, pColorLight, pOpacity);
          const uriDark = generatePatternUri(prefs.bgPattern, pColorDark, pOpacity);
          if (uriLight) body.style.setProperty("--bg-image-light", `url("${uriLight}")`);
          if (uriDark) body.style.setProperty("--bg-image-dark", `url("${uriDark}")`);
      }

      // Set background size for animation
      let currentSize = cachedSize || (typeof bgPatterns !== "undefined" ? bgPatterns.find((p) => p.name === prefs.bgPattern)?.size : null);
      
      const speed = prefs.bgScrollSpeed ?? 10;
      console.log('Background Physics:', currentSize ? 'Precise' : 'Estimated', 'Size:', currentSize || 100, 'Speed:', speed);

      if (currentSize || prefs.bgPattern !== "none") {
        const activeSize = currentSize || 100;
        body.style.setProperty("--bg-size", activeSize + "px");
        body.style.setProperty("--bg-pattern-size", activeSize + "px"); // Loop distance

        if (speed > 0) {
          body.classList.remove("paused");
          body.style.setProperty(
            "--bg-animate-duration",
            activeSize / speed + "s",
          );
        } else {
          body.classList.add("paused");
          body.style.removeProperty("--bg-animate-duration");
        }
      } else {
        body.style.removeProperty("--bg-size");
        body.style.removeProperty("--bg-pattern-size");
        body.style.removeProperty("--bg-animate-duration");
      }
    },

    init: () => {
      PreferencesManager.apply();

      // Listen for system theme changes if set to system
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          const prefs = PreferencesManager.getPreferences();
          if (!prefs.theme || prefs.theme === "system") {
            PreferencesManager.apply();
          }
        });
    },
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
        entry.lastClick = dayjs().format();
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

      const greetingText = t(`greeting_${timeKey}`, { name: name });

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
        // dayjs(input) parses YYYY-MM-DD correctly
        const bday = dayjs(userBirthday);
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
      if (politeElem) {
        politeElem.innerHTML = message;
      }
    },

    updateVisuals: () => {
      // Xmas Class
      if (dayjs().month() === 11) document.body.classList.add("xmas");

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
      const setAnim = (state) => {
        const prefs = PreferencesManager.getPreferences();
        const speed = prefs.bgScrollSpeed ?? 10;
        if (state === "paused" || speed === 0)
          document.body.classList.add("paused");
        else document.body.classList.remove("paused");
      };
      window.addEventListener("blur", () => setAnim("paused"));
      window.addEventListener("focus", () => setAnim("running"));
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

    getSpecialDayClass: (n) => {
      if (n < 2000) return null; // Start checking from Day 2000 per user request

      // Priority 1: Orange for 1000s
      if (n % 1000 === 0) return "special-day-orange";

      // Priority 2: Green for others
      if (n % 100 === 0) return "special-day-green";

      const s = n.toString();

      // Repdigit (e.g. 2222, 33333)
      if (/^(\d)\1+$/.test(s)) return "special-day-green";

      // Palindrome (e.g. 1221, 12321)
      if (s === s.split("").reverse().join("")) return "special-day-green";

      // Consecutive (e.g. 1234, 23456)
      if ("0123456789".includes(s)) return "special-day-green";

      return null;
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

          // --- INTRO MESSAGE LOGIC ---
          const hasIntroDate = localStorage.getItem("introDateShown");
          let dayLabel = t("day");
          let showIntro = !hasIntroDate;

          // Check if user is "old" (has stats > 24h ago) to skip intro
          if (showIntro) {
            const stats = StatsManager.getStats();
            const hasOldActivity = Object.values(stats).some(
              (s) =>
                s.lastClick &&
                dayjs(s.lastClick).isBefore(dayjs().subtract(24, "hour")),
            );
            if (hasOldActivity) {
              showIntro = false;
              localStorage.setItem("introDateShown", "true"); // Silently mark as shown
            }
          }

          if (showIntro && ProfileManager.isSetup()) {
            dayLabel = t("day_intro");
            localStorage.setItem("introDateShown", "true");
          }

          // Calculate day count and check for special highlighting
          const daysInfo = DateUtils.getDaysSinceStart();
          const dayCount = typeof daysInfo === "number" ? daysInfo : daysInfo; // It is number
          const specialClass = EventsManager.getSpecialDayClass(dayCount);
          const dayCountHtml = specialClass
            ? `<span class="${specialClass}">${dayCount}</span>`
            : dayCount;

          let baseMsg = `${todayFull} - ${dayLabel} ${dayCountHtml}`;

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
          const annualEvents =
            JSON.parse(localStorage.getItem("annualEvents")) || [];
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
        if (I18nManager.getLang() === "en") {
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
              cumplesToday.length > 1 ? "turns" : "isBirthday",
            )} ${EventsManager.formatList(cumplesToday)}`,
          );
        }
      }
      if (hasET)
        parts.push(
          `${
            hasCT ? t("alsoToday") + " " : t("today") + ": "
          }${EventsManager.formatList(eventsToday)}`,
        );

      // Tomorrow
      if (hasCTM) {
        if (I18nManager.getLang() === "en") {
          // ENGLISH LOGIC
          const list = EventsManager.formatList(cumplesTomorrow);
          const isPlural = cumplesTomorrow.length > 1;
          const subject = isPlural ? "birthdays" : "birthday";
          const verb = isPlural ? "are" : "is";
          parts.push(
            `${list}'s ${subject} ${verb} ${t("today") === "Today" ? "tomorrow" : t("tomorrow")}`,
          );
          // Note: t("today") check is a hack if "tomorrow" key isn't strictly just "tomorrow".
          // Better: just hardcode "tomorrow" since this IS the English block.
        } else {
          parts.push(
            `${t("tomorrow")} ${t(
              cumplesTomorrow.length > 1 ? "turns" : "isBirthday",
            )} ${EventsManager.formatList(cumplesTomorrow)}`,
          );
        }
      }
      if (hasETM)
        parts.push(
          `${
            hasCTM ? t("alsoTomorrow") + " " : t("tomorrow") + ": "
          }${EventsManager.formatList(eventsTomorrow)}`,
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
          <input type="date" class="form-control dias-calc-date" min="${calcMinDate}" max="${dayjs().format(
            "YYYY-MM-DD",
          )}">
          <span class="ms-3 dias-calc-dia"></span>
        </div>
      `;

      const caja = document.querySelector(".caja");
      if (caja) {
        const hr = document.createElement("hr");
        const h2 = document.createElement("h2");
        h2.innerHTML = t("calcTitle");

        const pDesc = document.createElement("p");
        pDesc.innerHTML = t("calcDescription");
        // pDesc.className = "text-muted mb-3";

        caja.appendChild(hr);
        caja.appendChild(h2);
        caja.appendChild(pDesc);
        caja.appendChild(calcDiv);

        const inputDias = calcDiv.querySelector(".dias-calc-input");
        const resultDias = calcDiv.querySelector(".dias-calc-resultado");
        const inputFecha = calcDiv.querySelector(".dias-calc-date");
        const resultFecha = calcDiv.querySelector(".dias-calc-dia");

        inputDias.addEventListener("input", () => {
          const days = parseInt(inputDias.value, 10);
          if (!isNaN(days) && days >= 0) {
            resultDias.textContent = DateUtils.START_DATE.add(
              days,
              "days",
            ).format("DD/MM/YYYY");
          } else {
            resultDias.textContent = "";
          }
        });

        inputFecha.addEventListener("change", () => {
          if (inputFecha.value) {
            const days = dayjs(inputFecha.value, "YYYY-MM-DD").diff(
              DateUtils.START_DATE,
              "days",
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
              dayjs(val).format("DD/MM/YYYY"),
            );
          else inputFecha.removeAttribute("data-date");
        });
      }
    },

    init: () => {
      // Ensure START_DATE is correct before checking events
      const userBirthday = ProfileManager.getBirthday();
      if (userBirthday) DateUtils.START_DATE = dayjs(userBirthday);

      // Auto-Delete Logic
      const prefs = PreferencesManager.getPreferences();
      if (prefs.autoDeleteEvents !== false) {
        EventsManager.cleanExpiredEvents();
      }

      EventsManager.checkDailyEvents();
    },

    cleanExpiredEvents: () => {
      try {
        const customEvents =
          JSON.parse(localStorage.getItem("customEvents")) || [];
        if (customEvents.length === 0) return;

        // Clean events older than yesterday (allow today and tomorrow and yesterday? No, User said: "older than 24 hours (strictly speaking, older than "yesterday")")
        // If today is 12th.
        // 12th - OK
        // 11th - OK (Yesterday - Grace Period?) "built-in grace period of 24 hours"
        // 10th - DELETE

        const yesterday = dayjs().subtract(1, "day");

        // We keep event if date >= yesterday (in YYYY-MM-DD string comp works if format is ISO)
        const filtered = customEvents.filter((e) => {
          const eDate = dayjs(e.date, "DD/MM/YYYY"); // e.date is DD/MM/YYYY
          // isAfter or Same yesterday
          return (
            eDate.isSame(yesterday, "day") || eDate.isAfter(yesterday, "day")
          );
        });

        if (filtered.length !== customEvents.length) {
          localStorage.setItem("customEvents", JSON.stringify(filtered));
          console.log(
            `Auto cleaned ${customEvents.length - filtered.length} events.`,
          );
        }
      } catch (err) {
        console.error("Error cleaning events", err);
      }
    },
  };

  // ==========================================================================
  // MODULE: AppManager
  // Loading, Filtering, and Rendering Apps
  // ==========================================================================
  const AppManager = {
    getUserApps: () => JSON.parse(localStorage.getItem("myApps")) || [],

    renderGrid: (userAppsItems) => {
      if (!userAppsItems || userAppsItems.length === 0) return;

      const html = userAppsItems
        .map(
          (item) => `
        <div class="item">
          <a href="${item.url}"
             target="_blank"
             class="${item.icon}"
             data-bs-toggle="tooltip"
             data-bs-placement="bottom"
             title="${item.title}">${item.name}</a>
        </div>
      `,
        )
        .join("");

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

    renderTv: (items) => {
      const t = I18nManager.getString;

      if (!items || items.length === 0) return;

      const hr = document.createElement("hr");
      const h2 = document.createElement("h2");
      h2.innerHTML = t("tvTitle");

      const div = document.createElement("div");
      div.className = "links tv";

      div.innerHTML = items
        .map(
          (item) => `
        <div class="item">
          <a href="${item.url}"
             target="_blank"
             class="${item.icon}"
             data-bs-toggle="tooltip"
             data-bs-placement="bottom"
             title="${item.title}">${item.name}</a>
        </div>
      `,
        )
        .join("");

      const caja = document.querySelector(".caja");
      caja.appendChild(hr);
      caja.appendChild(h2);
      caja.appendChild(div);
      return div;
    },

    init: () => {
      return Promise.all([
        fetch("items.json")
          .then((res) => res.json())
          .catch(() => []),
        fetch("tv-items.json")
          .then((res) => res.json())
          .catch(() => []),
      ]).then(([appCatalog, tvCatalog]) => {
        const userApps = AppManager.getUserApps();
        const catalogMap = new Map(
          [...appCatalog, ...tvCatalog].map((item) => [item.name, item]),
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

        AppManager.renderGrid(finalApps);

        if (hydratedTv.length > 0) {
          AppManager.renderTv(hydratedTv);
        }

        Array.from(
          document.querySelectorAll('[data-bs-toggle="tooltip"]'),
        ).forEach((el) => new bootstrap.Tooltip(el));

        // EventsManager.initCalculator(); // Handled separately in startWebDesk based on prefs
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
  // MODULE: TooltipManager
  // First-time UX Enhancements
  // ==========================================================================
  const TooltipManager = {
    init: () => {
      // Check if already seen or not setup
      if (localStorage.getItem("settingsTooltipSeen")) return;

      const icon = document.querySelector(".settings-icon");
      if (!icon) return;

      // Create Tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "settings-tooltip";
      const text = I18nManager.getString("custom_tooltip");
      tooltip.innerHTML = `
              <div class="tooltip-text">
                  ${text}
              </div>
              <button class="tooltip-close" aria-label="Close">×</button>
          `;

      // Append
      icon.appendChild(tooltip);

      // Events
      const close = () => {
        tooltip.remove();
        localStorage.setItem("settingsTooltipSeen", "true");
      };

      const closeBtn = tooltip.querySelector(".tooltip-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          close();
        });
      }

      // Also close if they actually click the link
      const link = icon.querySelector("a");
      if (link) {
        link.addEventListener("click", () => {
          localStorage.setItem("settingsTooltipSeen", "true");
        });
      }
    },
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  // Stats Listener attached immediately
  StatsManager.init();

  const startWebDesk = () => {
    I18nManager.init()
      .then(() => {
        // Initialize other non-gating managers in parallel/early
        EventsManager.init();
        LinksManager.init();

        // Wait for Apps to be fetched and rendered
        return AppManager.init();
      })
      .then(() => {
        // Once apps are ready, initialize visuals
        GreetingManager.updateVisuals(); // Set tree image (starts load)
        PreferencesManager.init(); // Apply prefs (might reveal tree container)

        // Life Calculator (Optional)
        const prefs = PreferencesManager.getPreferences();
        if (prefs.enableCalculator === true) {
          EventsManager.initCalculator();
        }

        GreetingManager.updateMessage();
        GreetingManager.startAnimationControl();
        setInterval(GreetingManager.updateMessage, 60000 * 5);

        TooltipManager.init();

        // Reveal Main Content
        const caja = document.querySelector(".caja");
        if (caja) caja.style.display = "";
      });
  };

  if (ProfileManager.isSetup()) {
    // Legacy Migration: Detect Once and Save if missing
    const profile = ProfileManager.getProfile();
    if (!profile.hemisphere) {
      profile.hemisphere = DateUtils.detectHemisphere();
      localStorage.setItem(ProfileManager.STORAGE_KEY, JSON.stringify(profile));
      console.log(
        "Migrated Legacy User: Hemisphere set to",
        profile.hemisphere,
      );
    }
    startWebDesk();
  } else {
    if (window.OnboardingManager) {
      OnboardingManager.start();
    } else {
      console.error("OnboardingManager not found");
      startWebDesk(); // Fallback
    }
  }
});
