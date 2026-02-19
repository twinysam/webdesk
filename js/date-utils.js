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

      LUNAR_DATA: [
        { "year": 2027, "cny": "2027-02-06", "zodiac": "Goat", "element": "Fire", "ganzhi": "丁未", "liChun": "2027-02-04", "leapMonth": null },
        { "year": 2028, "cny": "2028-01-26", "zodiac": "Monkey", "element": "Earth", "ganzhi": "戊申", "liChun": "2028-02-04", "leapMonth": 5 },
        { "year": 2029, "cny": "2029-02-13", "zodiac": "Rooster", "element": "Earth", "ganzhi": "己酉", "liChun": "2029-02-03", "leapMonth": null },
        { "year": 2030, "cny": "2030-02-03", "zodiac": "Dog", "element": "Metal", "ganzhi": "庚戌", "liChun": "2030-02-04", "leapMonth": null },
        { "year": 2031, "cny": "2031-01-23", "zodiac": "Pig", "element": "Metal", "ganzhi": "辛亥", "liChun": "2031-02-04", "leapMonth": 3 },
        { "year": 2032, "cny": "2032-02-11", "zodiac": "Rat", "element": "Water", "ganzhi": "壬子", "liChun": "2032-02-04", "leapMonth": null },
        { "year": 2033, "cny": "2033-01-31", "zodiac": "Ox", "element": "Water", "ganzhi": "癸丑", "liChun": "2033-02-03", "leapMonth": 11 },
        { "year": 2034, "cny": "2034-02-19", "zodiac": "Tiger", "element": "Wood", "ganzhi": "甲寅", "liChun": "2034-02-04", "leapMonth": null },
        { "year": 2035, "cny": "2035-02-08", "zodiac": "Rabbit", "element": "Wood", "ganzhi": "乙卯", "liChun": "2035-02-04", "leapMonth": null },
        { "year": 2036, "cny": "2036-01-28", "zodiac": "Dragon", "element": "Fire", "ganzhi": "丙辰", "liChun": "2036-02-04", "leapMonth": 6 },
        { "year": 2037, "cny": "2037-02-15", "zodiac": "Snake", "element": "Fire", "ganzhi": "丁巳", "liChun": "2037-02-03", "leapMonth": null },
        { "year": 2038, "cny": "2038-02-04", "zodiac": "Horse", "element": "Earth", "ganzhi": "戊午", "liChun": "2038-02-04", "leapMonth": null },
        { "year": 2039, "cny": "2039-01-24", "zodiac": "Goat", "element": "Earth", "ganzhi": "己未", "liChun": "2039-02-04", "leapMonth": 5 },
        { "year": 2040, "cny": "2040-02-12", "zodiac": "Monkey", "element": "Metal", "ganzhi": "庚申", "liChun": "2040-02-04", "leapMonth": null },
        { "year": 2041, "cny": "2041-02-01", "zodiac": "Rooster", "element": "Metal", "ganzhi": "辛酉", "liChun": "2041-02-03", "leapMonth": null },
        { "year": 2042, "cny": "2042-01-22", "zodiac": "Dog", "element": "Water", "ganzhi": "壬戌", "liChun": "2042-02-04", "leapMonth": 2 },
        { "year": 2043, "cny": "2043-02-10", "zodiac": "Pig", "element": "Water", "ganzhi": "癸亥", "liChun": "2043-02-04", "leapMonth": null },
        { "year": 2044, "cny": "2044-01-30", "zodiac": "Rat", "element": "Wood", "ganzhi": "甲子", "liChun": "2044-02-04", "leapMonth": 7 },
        { "year": 2045, "cny": "2045-02-17", "zodiac": "Ox", "element": "Wood", "ganzhi": "乙丑", "liChun": "2045-02-03", "leapMonth": null },
        { "year": 2046, "cny": "2046-02-06", "zodiac": "Tiger", "element": "Fire", "ganzhi": "丙寅", "liChun": "2046-02-04", "leapMonth": null },
        { "year": 2047, "cny": "2047-01-26", "zodiac": "Rabbit", "element": "Fire", "ganzhi": "丁卯", "liChun": "2047-02-04", "leapMonth": 5 },
        { "year": 2048, "cny": "2048-02-14", "zodiac": "Dragon", "element": "Earth", "ganzhi": "戊辰", "liChun": "2048-02-04", "leapMonth": null },
        { "year": 2049, "cny": "2049-02-02", "zodiac": "Snake", "element": "Earth", "ganzhi": "己巳", "liChun": "2049-02-03", "leapMonth": null },
        { "year": 2050, "cny": "2050-01-23", "zodiac": "Horse", "element": "Metal", "ganzhi": "庚午", "liChun": "2050-02-03", "leapMonth": 3 },
        { "year": 2051, "cny": "2051-02-11", "zodiac": "Goat", "element": "Metal", "ganzhi": "辛未", "liChun": "2051-02-04", "leapMonth": null },
        { "year": 2052, "cny": "2052-02-01", "zodiac": "Monkey", "element": "Water", "ganzhi": "壬申", "liChun": "2052-02-04", "leapMonth": 8 },
        { "year": 2053, "cny": "2053-02-19", "zodiac": "Rooster", "element": "Water", "ganzhi": "癸酉", "liChun": "2053-02-03", "leapMonth": null },
        { "year": 2054, "cny": "2054-02-08", "zodiac": "Dog", "element": "Wood", "ganzhi": "甲戌", "liChun": "2054-02-03", "leapMonth": null },
        { "year": 2055, "cny": "2055-01-28", "zodiac": "Pig", "element": "Wood", "ganzhi": "乙亥", "liChun": "2055-02-04", "leapMonth": 6 },
        { "year": 2056, "cny": "2056-02-15", "zodiac": "Rat", "element": "Fire", "ganzhi": "丙子", "liChun": "2056-02-04", "leapMonth": null },
        { "year": 2057, "cny": "2057-02-04", "zodiac": "Ox", "element": "Fire", "ganzhi": "丁丑", "liChun": "2057-02-03", "leapMonth": null },
        { "year": 2058, "cny": "2058-01-24", "zodiac": "Tiger", "element": "Earth", "ganzhi": "戊寅", "liChun": "2058-02-03", "leapMonth": 4 },
        { "year": 2059, "cny": "2059-02-12", "zodiac": "Rabbit", "element": "Earth", "ganzhi": "己卯", "liChun": "2059-02-04", "leapMonth": null },
        { "year": 2060, "cny": "2060-02-02", "zodiac": "Dragon", "element": "Metal", "ganzhi": "庚辰", "liChun": "2060-02-04", "leapMonth": null },
        { "year": 2061, "cny": "2061-01-21", "zodiac": "Snake", "element": "Metal", "ganzhi": "辛巳", "liChun": "2061-02-03", "leapMonth": 3 },
        { "year": 2062, "cny": "2062-02-09", "zodiac": "Horse", "element": "Water", "ganzhi": "壬午", "liChun": "2062-02-03", "leapMonth": null },
        { "year": 2063, "cny": "2063-01-29", "zodiac": "Goat", "element": "Water", "ganzhi": "癸未", "liChun": "2063-02-04", "leapMonth": 7 },
        { "year": 2064, "cny": "2064-02-17", "zodiac": "Monkey", "element": "Wood", "ganzhi": "甲申", "liChun": "2064-02-04", "leapMonth": null },
        { "year": 2065, "cny": "2065-02-05", "zodiac": "Rooster", "element": "Wood", "ganzhi": "乙酉", "liChun": "2065-02-03", "leapMonth": null },
        { "year": 2066, "cny": "2066-01-26", "zodiac": "Dog", "element": "Fire", "ganzhi": "丙戌", "liChun": "2066-02-03", "leapMonth": 5 },
        { "year": 2067, "cny": "2067-02-14", "zodiac": "Pig", "element": "Fire", "ganzhi": "丁亥", "liChun": "2067-02-04", "leapMonth": null },
        { "year": 2068, "cny": "2068-02-03", "zodiac": "Rat", "element": "Earth", "ganzhi": "戊子", "liChun": "2068-02-04", "leapMonth": null },
        { "year": 2069, "cny": "2069-01-23", "zodiac": "Ox", "element": "Earth", "ganzhi": "己丑", "liChun": "2069-02-03", "leapMonth": 4 },
        { "year": 2070, "cny": "2070-02-11", "zodiac": "Tiger", "element": "Metal", "ganzhi": "庚寅", "liChun": "2070-02-03", "leapMonth": null },
        { "year": 2071, "cny": "2071-01-31", "zodiac": "Rabbit", "element": "Metal", "ganzhi": "辛卯", "liChun": "2071-02-04", "leapMonth": 8 },
        { "year": 2072, "cny": "2072-02-19", "zodiac": "Dragon", "element": "Water", "ganzhi": "壬辰", "liChun": "2072-02-04", "leapMonth": null },
        { "year": 2073, "cny": "2073-02-07", "zodiac": "Snake", "element": "Water", "ganzhi": "癸巳", "liChun": "2073-02-03", "leapMonth": null },
        { "year": 2074, "cny": "2074-01-27", "zodiac": "Horse", "element": "Wood", "ganzhi": "甲午", "liChun": "2074-02-03", "leapMonth": 6 },
        { "year": 2075, "cny": "2075-02-15", "zodiac": "Goat", "element": "Wood", "ganzhi": "乙未", "liChun": "2075-02-04", "leapMonth": null },
        { "year": 2076, "cny": "2076-02-05", "zodiac": "Monkey", "element": "Fire", "ganzhi": "丙申", "liChun": "2076-02-04", "leapMonth": null },
        { "year": 2077, "cny": "2077-01-24", "zodiac": "Rooster", "element": "Fire", "ganzhi": "丁酉", "liChun": "2077-02-03", "leapMonth": 4 },
        { "year": 2078, "cny": "2078-02-12", "zodiac": "Dog", "element": "Earth", "ganzhi": "戊戌", "liChun": "2078-02-03", "leapMonth": null },
        { "year": 2079, "cny": "2079-02-02", "zodiac": "Pig", "element": "Earth", "ganzhi": "己亥", "liChun": "2079-02-04", "leapMonth": null },
        { "year": 2080, "cny": "2080-01-22", "zodiac": "Rat", "element": "Metal", "ganzhi": "庚子", "liChun": "2080-02-04", "leapMonth": 3 },
        { "year": 2081, "cny": "2081-02-09", "zodiac": "Ox", "element": "Metal", "ganzhi": "辛丑", "liChun": "2081-02-03", "leapMonth": null },
        { "year": 2082, "cny": "2082-01-29", "zodiac": "Tiger", "element": "Water", "ganzhi": "壬寅", "liChun": "2082-02-03", "leapMonth": 7 },
        { "year": 2083, "cny": "2083-02-17", "zodiac": "Rabbit", "element": "Water", "ganzhi": "癸卯", "liChun": "2083-02-03", "leapMonth": null },
        { "year": 2084, "cny": "2084-02-06", "zodiac": "Dragon", "element": "Wood", "ganzhi": "甲辰", "liChun": "2084-02-04", "leapMonth": null },
        { "year": 2085, "cny": "2085-01-26", "zodiac": "Snake", "element": "Wood", "ganzhi": "乙巳", "liChun": "2085-02-03", "leapMonth": 5 },
        { "year": 2086, "cny": "2086-02-14", "zodiac": "Horse", "element": "Fire", "ganzhi": "丙午", "liChun": "2086-02-03", "leapMonth": null },
        { "year": 2087, "cny": "2087-02-03", "zodiac": "Goat", "element": "Fire", "ganzhi": "丁未", "liChun": "2087-02-03", "leapMonth": null },
        { "year": 2088, "cny": "2088-01-24", "zodiac": "Monkey", "element": "Earth", "ganzhi": "戊申", "liChun": "2088-02-04", "leapMonth": 4 },
        { "year": 2089, "cny": "2089-02-10", "zodiac": "Rooster", "element": "Earth", "ganzhi": "己酉", "liChun": "2089-02-03", "leapMonth": null },
        { "year": 2090, "cny": "2090-01-30", "zodiac": "Dog", "element": "Metal", "ganzhi": "庚戌", "liChun": "2090-02-03", "leapMonth": 8 },
        { "year": 2091, "cny": "2091-02-18", "zodiac": "Pig", "element": "Metal", "ganzhi": "辛亥", "liChun": "2091-02-03", "leapMonth": null },
        { "year": 2092, "cny": "2092-02-07", "zodiac": "Rat", "element": "Water", "ganzhi": "壬子", "liChun": "2092-02-04", "leapMonth": null },
        { "year": 2093, "cny": "2093-01-27", "zodiac": "Ox", "element": "Water", "ganzhi": "癸丑", "liChun": "2093-02-03", "leapMonth": 6 },
        { "year": 2094, "cny": "2094-02-15", "zodiac": "Tiger", "element": "Wood", "ganzhi": "甲寅", "liChun": "2094-02-03", "leapMonth": null },
        { "year": 2095, "cny": "2095-02-05", "zodiac": "Rabbit", "element": "Wood", "ganzhi": "乙卯", "liChun": "2095-02-03", "leapMonth": null },
        { "year": 2096, "cny": "2096-01-25", "zodiac": "Dragon", "element": "Fire", "ganzhi": "丙辰", "liChun": "2096-02-04", "leapMonth": 4 },
        { "year": 2097, "cny": "2097-02-12", "zodiac": "Snake", "element": "Fire", "ganzhi": "丁巳", "liChun": "2097-02-03", "leapMonth": null },
        { "year": 2098, "cny": "2098-02-01", "zodiac": "Horse", "element": "Earth", "ganzhi": "戊午", "liChun": "2098-02-03", "leapMonth": null },
        { "year": 2099, "cny": "2099-01-21", "zodiac": "Goat", "element": "Earth", "ganzhi": "己未", "liChun": "2099-02-03", "leapMonth": 2 },
        { "year": 2100, "cny": "2100-02-09", "zodiac": "Monkey", "element": "Metal", "ganzhi": "庚申", "liChun": "2100-02-04", "leapMonth": null }
      ],

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
        const item = scope.DateUtils.LUNAR_DATA.find(d => d.year === year);
        return item ? dayjs(item.cny, "YYYY-MM-DD").toDate() : null;
      },
  
      getChineseNewYearInfo: (year) => {
        const item = scope.DateUtils.LUNAR_DATA.find(d => d.year === year);
        if (!item) return null;

        const elementEmojis = {
          "Wood": "🌳",
          "Fire": "🔥",
          "Earth": "🌍",
          "Metal": "🪙",
          "Water": "🌊"
        };
        const zodiacEmojis = {
          "Rat": "🐀",
          "Ox": "🐂",
          "Tiger": "🐅",
          "Rabbit": "🐇",
          "Dragon": "🐉",
          "Snake": "🐍",
          "Horse": "🐎",
          "Goat": "🐐",
          "Monkey": "🐒",
          "Rooster": "🐓",
          "Dog": "🐕",
          "Pig": "🐖"
        };

        return {
          ...item,
          elementEmoji: elementEmojis[item.element] || "",
          zodiacEmoji: zodiacEmojis[item.zodiac] || ""
        };
      },

      isTodayChineseNewYear: (date) => {
        const year = date.getFullYear();
        const item = scope.DateUtils.LUNAR_DATA.find(d => d.year === year);
        if (!item) return false;

        const cny = dayjs(item.cny, "YYYY-MM-DD");
        return (
          date.getFullYear() === cny.year() &&
          date.getMonth() === cny.month() &&
          date.getDate() === cny.date()
        );
      }
    };
})(window);
