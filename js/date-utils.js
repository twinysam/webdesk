// ==========================================================================
// MODULE: DateUtils
// Centralized date/time helpers and constants
// Dependencies: Moment.js
// ==========================================================================
(function(scope) {
    scope.DateUtils = {
      START_DATE: moment(), // Will be updated by ProfileManager/Init if available
  
      getToday: () => moment(),
      getTomorrow: () => moment().add(1, "days"),
  
      getTodayStr: () => moment().format("DD/MM"),
      getTodayFull: () => moment().format("DD/MM/YYYY"),
  
      getTomorrowStr: () => moment().add(1, "days").format("DD/MM"),
      getTomorrowFull: () => moment().add(1, "days").format("DD/MM/YYYY"),
  
      getDaysSinceStart: (date = moment()) =>
        date.diff(scope.DateUtils.START_DATE, "days"),
  
      getSeason: (date = moment()) => {
        const month = date.month(); // 0-indexed
        const day = date.date();
  
        // Spring: Sept 21 - Nov 20 | Summer: Dec 21 - Feb 20 | Fall: Mar 21 - May 20 | Winter: Jun 21 - Sept 20
        // NOTE: This seems to be Southern Hemisphere logic (Sept 21 = Spring)
        if (
          (month === 8 && day >= 21) ||
          (month > 8 && month < 11) ||
          (month === 11 && day < 21)
        ) {
          return { season: "spring", isFirstDay: month === 8 && day === 21 };
        }
        if (
          (month === 11 && day >= 21) ||
          month > 11 ||
          month < 2 ||
          (month === 2 && day < 21)
        ) {
          return { season: "summer", isFirstDay: month === 11 && day === 21 };
        }
        if (
          (month === 2 && day >= 21) ||
          (month > 2 && month < 5) ||
          (month === 5 && day < 21)
        ) {
          return { season: "fall", isFirstDay: month === 2 && day === 21 };
        }
        return { season: "winter", isFirstDay: month === 5 && day === 21 };
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
          return moment(corrections[year], "YYYY-MM-DD").toDate();
  
        const WINTER_SOLSTICE = moment.utc({
          year: year - 1,
          month: 11,
          day: 21,
        });
        const SYNODIC_MONTH = 29.530588853;
        const baseNewMoon = moment.utc("2024-01-11");
        const monthsBetween =
          WINTER_SOLSTICE.diff(baseNewMoon, "days") / SYNODIC_MONTH;
        const lastNewMoon = baseNewMoon
          .clone()
          .add(Math.floor(monthsBetween) * SYNODIC_MONTH, "days");
        const firstNewMoon = lastNewMoon.clone().add(SYNODIC_MONTH, "days");
        let secondNewMoon = firstNewMoon.clone().add(SYNODIC_MONTH, "days");
  
        if (secondNewMoon.date() < 21 && secondNewMoon.month() === 0) {
          secondNewMoon = secondNewMoon.clone().add(SYNODIC_MONTH, "days");
        }
        return moment(secondNewMoon).local().toDate();
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
