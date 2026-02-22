// ==========================================================================
// MODULE: DateUtils
// Centralized date/time helpers and constants
// Dependencies: Day.js
// ==========================================================================
(function(scope) {
    scope.DateUtils = {
      START_DATE: dayjs(), // Will be updated by ProfileManager/Init if available
  
      getToday: () => dayjs(),
      getTomorrow: () => dayjs().add(1, "days"),
  
      getTodayStr: () => dayjs().format("DD/MM"),
      getTodayFull: () => dayjs().format("DD/MM/YYYY"),
  
      getTomorrowStr: () => dayjs().add(1, "days").format("DD/MM"),
      getTomorrowFull: () => dayjs().add(1, "days").format("DD/MM/YYYY"),
  
      getDaysSinceStart: (date = dayjs()) =>
        date.diff(scope.DateUtils.START_DATE, "days"),

      initLunarData: () => {
        // Clean up any old cached TT payload
        localStorage.removeItem("webdesk_tt_data_v1");

        const now = dayjs();
        // Check if we are past Jan 15th, if so, ensure the current year's data is computed.
        if (now.month() > 0 || (now.month() === 0 && now.date() >= 15)) {
            scope.DateUtils.getChineseNewYearInfo(now.year());
        }
      },

      _computingYears: new Set(),
      
      _attachEmojis: (item) => {
        const elementEmojis = { "Wood": "🌳", "Fire": "🔥", "Earth": "🌍", "Metal": "🪙", "Water": "🌊" };
        const zodiacEmojis = { "Rat": "🐀", "Ox": "🐂", "Tiger": "🐅", "Rabbit": "🐇", "Dragon": "🐉", "Snake": "🐍", "Horse": "🐎", "Goat": "🐐", "Monkey": "🐒", "Rooster": "🐓", "Dog": "🐕", "Pig": "🐖" };
        
        return {
          ...item,
          elementEmoji: elementEmojis[item.element] || "",
          zodiacEmoji: zodiacEmojis[item.zodiac] || ""
        };
      },

      ensureLunarComputed: async (year) => {
          if (scope.DateUtils._computingYears.has(year)) return;
          scope.DateUtils._computingYears.add(year);

          try {
              const res = await fetch("webdesk-tt-2027-3000.json");
              const ttData = await res.json();

              const cnyInfo = scope.DateUtils.computeLunarYearFromTT(year, ttData);
              if (cnyInfo) {
                  localStorage.setItem("cny_data_" + year, JSON.stringify(cnyInfo));
                  if (window.GreetingManager && window.GreetingManager.updateMessage) {
                      window.GreetingManager.updateMessage();
                  }
              }
          } catch (e) {
              console.error("Error computing CNY data:", e);
          } finally {
              scope.DateUtils._computingYears.delete(year);
          }
      },

      computeLunarYearFromTT: (year, ttData) => {
          // Accuracy Note:
          // TT timestamps are absolute. For the Chinese Calendar, the day starts at Beijing midnight (UTC+8).
          // We convert JD to an integer representing the Beijing calendar day before comparing, ensuring that if a 
          // new moon and a solar term occur on the same true calendar day, they fall into the correct relative month.
          const getJdDay = (jd) => Math.floor(jd + 8 / 24 + 0.5);
          
          const getJdMs = (jd) => (jd - 2440587.5) * 86400000 + 28800000;
          const jdToDayjsStr = (jd) => {
              const ms = getJdMs(jd);
              const d = new Date(ms);
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          };

          const newMoons = ttData.new_moons_tt;
          const solarTerms = ttData.solar_terms_tt;

          const ws_all = solarTerms.filter(st => st[1] === 18);
          // Use UTC+8 string to match the year reliably
          const wsPrev = ws_all.find(st => Number(jdToDayjsStr(st[0]).substring(0, 4)) === year - 1);
          const wsCurr = ws_all.find(st => Number(jdToDayjsStr(st[0]).substring(0, 4)) === year);

          if (!wsPrev || !wsCurr) return null;

          let nmPrev = 0;
          for (let i = 0; i < newMoons.length; i++) {
              // Compare exactly or day-by-day? Astronomically, Month 11 starts with the new moon prioritizing the Solstice.
              // We compare strict astronomically: the New Moon immediately preceding or equal to the Winter Solstice.
              if (newMoons[i] <= wsPrev[0]) nmPrev = newMoons[i];
              else break;
          }

          let nmCurr = 0;
          for (let i = 0; i < newMoons.length; i++) {
              if (newMoons[i] <= wsCurr[0]) nmCurr = newMoons[i];
              else break;
          }

          const moons = newMoons.filter(nm => nm >= nmPrev && nm <= nmCurr);
          // If there are 14 moons in the array, there are 13 months, which means it's a leap year.
          const isLeapYear = moons.length === 14;

          let currMonthNum = 11;
          let hasLeaped = false;
          let leapMonth = null;
          let cny_str = null;

          for (let i = 0; i < moons.length - 1; i++) {
              const startDay = getJdDay(moons[i]);
              const endDay = getJdDay(moons[i + 1]);

              const hasZhongqi = solarTerms.some(st => {
                  if (st[1] % 2 !== 0) return false;
                  const stDay = getJdDay(st[0]);
                  return stDay >= startDay && stDay < endDay;
              });

              let isThisLeap = false;
              if (isLeapYear && !hasZhongqi && !hasLeaped) {
                  isThisLeap = true;
                  hasLeaped = true;
                  leapMonth = currMonthNum;
              } else if (i > 0) {
                  // We skip incrementing when i === 0 because the sequence starts on Month 11.
                  // For all subsequent non-leap months, we increment (wrapping 12 -> 1).
                  currMonthNum = currMonthNum === 12 ? 1 : currMonthNum + 1;
              }

              if (currMonthNum === 1 && !isThisLeap && !cny_str) {
                  cny_str = jdToDayjsStr(moons[i]);
              }
          }

          const lunarYear = year - 4;
          const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
          const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
          const zodiacs = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
          const elements = ["Wood", "Fire", "Earth", "Metal", "Water"];

          const stem_idx = ((lunarYear % 10) + 10) % 10;
          const branch_idx = ((lunarYear % 12) + 12) % 12;

          const ganzhi = stems[stem_idx] + branches[branch_idx];
          const zodiac = zodiacs[branch_idx];
          const element = elements[Math.floor(stem_idx / 2)];

          return {
              year,
              cny: cny_str,
              zodiac,
              element,
              ganzhi,
              leapMonth
          };
      },

      detectHemisphere: () => {
          try {
              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (!timeZone) return "southern"; // Default safety

              // Heuristic for Southern Hemisphere
              const isSouthern =
                  timeZone.includes("Australia") ||
                  timeZone.includes("Antarctica") ||
                  timeZone.includes("Argentina") ||
                  timeZone.includes("Buenos_Aires") ||
                  timeZone.includes("Brazil") ||
                  timeZone.includes("Sao_Paulo") ||
                  timeZone.includes("Chile") ||
                  timeZone.includes("Santiago") ||
                  timeZone.includes("Uruguay") ||
                  timeZone.includes("Montevideo") ||
                  timeZone.includes("Paraguay") ||
                  timeZone.includes("Asuncion") ||
                  timeZone.includes("New_Zealand") ||
                  timeZone.includes("Auckland") ||
                  timeZone.includes("Wellington") ||
                  timeZone.includes("America/Lima") ||
                  timeZone.includes("America/La_Paz") ||
                  timeZone.includes("Africa/Johannesburg") ||
                  timeZone.includes("Africa/Cape_Town");
                
              return isSouthern ? "southern" : "northern";
          } catch (e) {
              return "southern";
          }
      },

      getHemisphere: () => {
          // 1. Check LocalStorage Setting (Primary Source of Truth)
          const profileStr = localStorage.getItem("userProfile");
          if (profileStr) {
              const profile = JSON.parse(profileStr);
              if (profile.hemisphere) return profile.hemisphere;
          }
          
          // 2. Fallback to detection (should ideally be saved after this)
          return scope.DateUtils.detectHemisphere();
      },

      getSeason: (date = dayjs()) => {
        const month = date.month(); // 0-indexed
        const day = date.date();
        let result = { season: "", isFirstDay: false };

        // Default Logic (Southern Hemisphere)
        // Spring: Sept 21 - Nov 20 | Summer: Dec 21 - Feb 20 | Fall: Mar 21 - May 20 | Winter: Jun 21 - Sept 20
        if (
          (month === 8 && day >= 21) ||
          (month > 8 && month < 11) ||
          (month === 11 && day < 21)
        ) {
          result = { season: "spring", isFirstDay: month === 8 && day === 21 };
        } else if (
          (month === 11 && day >= 21) ||
          month > 11 ||
          month < 2 ||
          (month === 2 && day < 21)
        ) {
          result = { season: "summer", isFirstDay: month === 11 && day === 21 };
        } else if (
          (month === 2 && day >= 21) ||
          (month > 2 && month < 5) ||
          (month === 5 && day < 21)
        ) {
          result = { season: "fall", isFirstDay: month === 2 && day === 21 };
        } else {
          result = { season: "winter", isFirstDay: month === 5 && day === 21 };
        }

        // Invert for Northern Hemisphere
        if (scope.DateUtils.getHemisphere() === "northern") {
            const inversion = {
                "spring": "fall",
                "summer": "winter",
                "fall": "spring",
                "winter": "summer"
            };
            result.season = inversion[result.season];
        }

        return result;
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
        const item = scope.DateUtils.getChineseNewYearInfo(year);
        return item ? dayjs(item.cny, "YYYY-MM-DD").toDate() : null;
      },
  
      getChineseNewYearInfo: (year) => {
        const cached = localStorage.getItem("cny_data_" + year);
        if (cached) {
            try { return scope.DateUtils._attachEmojis(JSON.parse(cached)); } catch(e) {}
        }

        // Trigger async computation if missing, returning null for now
        scope.DateUtils.ensureLunarComputed(year);
        return null;
      },

      isTodayChineseNewYear: (date) => {
        const info = scope.DateUtils.getChineseNewYearInfo(date.getFullYear());
        if (!info || !info.cny) return false;

        const cny = dayjs(info.cny, "YYYY-MM-DD");
        return (
          date.getFullYear() === cny.year() &&
          date.getMonth() === cny.month() &&
          date.getDate() === cny.date()
        );
      },

      checkNextLunarNewYear: async () => {
          console.log("%cCalculating next Lunar New Year...", "color: #aaa; font-style: italic;");
          try {
              const res = await fetch("webdesk-tt-2027-3000.json");
              const ttData = await res.json();
              const now = dayjs();
              let year = now.year();
              let nextCny = scope.DateUtils.computeLunarYearFromTT(year, ttData);

              // If current year's CNY is already past, calculate for the next year
              if (nextCny && dayjs(nextCny.cny).isBefore(now, 'day')) {
                  year++;
                  nextCny = scope.DateUtils.computeLunarYearFromTT(year, ttData);
              }

              if (nextCny) {
                  const info = scope.DateUtils._attachEmojis(nextCny);
                  console.log(
                      `%cNext Lunar New Year: %c${info.cny}\n%cYear of the ${info.elementEmoji} ${info.element} ${info.zodiacEmoji} ${info.zodiac} (${info.ganzhi})`,
                      "font-weight: bold;", 
                      "color: #e74c3c; font-weight: bold;",
                      "color: #3498db;"
                  );
              } else {
                  console.error("Could not calculate Lunar New Year data for the upcoming period.");
              }
          } catch (e) {
              console.error("Failed to fetch or compute lunar data:", e);
          }
      }
    };
})(window);
