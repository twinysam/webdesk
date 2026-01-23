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

      getHemisphere: () => {
          try {
              // 1. Check LocalStorage Setting
              const profileStr = localStorage.getItem("userProfile");
              if (profileStr) {
                  const profile = JSON.parse(profileStr);
                  if (profile.hemisphere) return profile.hemisphere;
              }

              // 2. Infer from Timezone (Onboarding / First Run)
              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (!timeZone) return "southern"; // Default

              // Simple heuristic for Southern Hemisphere
              const isSouthern =
                  timeZone.includes("Australia") ||
                  timeZone.includes("Antarctica") ||
                  timeZone.includes("Argentina") ||
                  timeZone.includes("Buenos_Aires") || // Chrome often returns "America/Buenos_Aires"
                  timeZone.includes("Brazil") ||
                  timeZone.includes("Sao_Paulo") ||
                  timeZone.includes("Chile") ||
                  timeZone.includes("Santiago") ||
                  timeZone.includes("Uruguay") ||
                  timeZone.includes("Montevideo") ||
                  timeZone.includes("Paraguay") ||
                  timeZone.includes("New_Zealand") ||
                  timeZone.includes("America/Lima") ||
                  timeZone.includes("Africa/Johannesburg");
                
              return isSouthern ? "southern" : "northern";
          } catch (e) {
              return "southern";
          }
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
        const corrections = { 2033: "2033-01-31", 2034: "2034-02-19" };
        if (corrections[year])
          return dayjs(corrections[year], "YYYY-MM-DD").toDate();
  
        // DayJS object creation from object requires objectSupport plugin? NO.
        // It's better to use string construction for safety in DayJS base, 
        // OR rely on dayjs.utc() which usually accepts object IF the plugin supports it?
        // Actually, Moment's object constructor {year: ...} is specific.
        // DayJS .set() is chainable.
        // Safer: dayjs.utc().year(year-1).month(11).date(21)
        
        const WINTER_SOLSTICE = dayjs.utc()
            .year(year - 1)
            .month(11)
            .date(21)
            .startOf('day'); // Ensure time is 00:00

        const SYNODIC_MONTH = 29.530588853;
        const baseNewMoon = dayjs.utc("2024-01-11");
        
        // precise diff?
        const monthsBetween =
          WINTER_SOLSTICE.diff(baseNewMoon, "days", true) / SYNODIC_MONTH; 
          // Note: "days", true returns float in DayJS? Yes.
          
        const lastNewMoon = baseNewMoon
          .clone()
          .add(Math.floor(monthsBetween) * SYNODIC_MONTH, "days");
        const firstNewMoon = lastNewMoon.clone().add(SYNODIC_MONTH, "days");
        let secondNewMoon = firstNewMoon.clone().add(SYNODIC_MONTH, "days");
  
        if (secondNewMoon.date() < 21 && secondNewMoon.month() === 0) {
          secondNewMoon = secondNewMoon.clone().add(SYNODIC_MONTH, "days");
        }
        return dayjs(secondNewMoon).local().toDate();
      },
  
      getChineseZodiac: (year) => {
        const animals = [
          { sign: "Rat", emoji: "🐀" },
          { sign: "Ox", emoji: "🐂" },
          { sign: "Tiger", emoji: "🐅" },
          { sign: "Rabbit", emoji: "🐇" },
          { sign: "Dragon", emoji: "🐉" },
          { sign: "Snake", emoji: "🐍" },
          { sign: "Horse", emoji: "🐎" },
          { sign: "Goat", emoji: "🐐" },
          { sign: "Monkey", emoji: "🐒" },
          { sign: "Rooster", emoji: "🐓" },
          { sign: "Dog", emoji: "🐕" },
          { sign: "Pig", emoji: "🐖" },
        ];
        return animals[((year - 2020) % 12) + ((year - 2020) % 12 < 0 ? 12 : 0)];
      },
  
      isTodayChineseNewYear: (date) => {
        const cny = scope.DateUtils.getChineseNewYearDate(date.getFullYear());
        return (
          date.getFullYear() === cny.getFullYear() &&
          date.getMonth() === cny.getMonth() &&
          date.getDate() === cny.getDate()
        );
      }
    };
})(window);
