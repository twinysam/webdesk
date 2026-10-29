/* Curated font preferences and on-demand Google Fonts loading. */
(function (global) {
  "use strict";

  const DEFAULTS = Object.freeze({ headings: "exo", date: "inconsolata", body: "nunito" });
  // Google Fonts metadata was checked; weights and italic support are curated
  // per family so generated CSS requests never ask for unsupported styles.
  const CATALOG = {
    headings: [
      ["exo", "Exo", [100,200,300,400,500,600,700,800,900]],
      ["handjet", "Handjet", [100,200,300,400,500,600,700,800,900]],
      ["geist-pixel", "Geist Pixel", [400]],
      ["mozilla-headline", "Mozilla Headline", [200,300,400,500,600,700]],
      ["roboto-condensed", "Roboto Condensed", [100,200,300,400,500,600,700,800,900], true],
      ["oswald", "Oswald", [200,300,400,500,600,700]],
      ["jost", "Jost", [100,200,300,400,500,600,700,800,900], true],
      ["inter-tight", "Inter Tight", [100,200,300,400,500,600,700,800,900], true],
      ["urbanist", "Urbanist", [100,200,300,400,500,600,700,800,900], true],
      ["dosis", "Dosis", [200,300,400,500,600,700,800]],
      ["chivo", "Chivo", [100,200,300,400,500,600,700,800,900], true],
      ["encode-sans-semi-condensed", "Encode Sans Semi Condensed", [100,200,300,400,500,600,700,800,900]],
      ["cuprum", "Cuprum", [400,500,600,700], true],
      ["google-sans-flex", "Google Sans Flex", [100,200,300,400,500,600,700,800,900]],
      ["barlow-semi-condensed", "Barlow Semi Condensed", [100,200,300,400,500,600,700,800,900], true],
      ["sofia-sans-condensed", "Sofia Sans Condensed", [100,200,300,400,500,600,700,800,900], true],
      ["iosevka-charon", "Iosevka Charon", [300,400,500,700], true],
      ["bellota-text", "Bellota Text", [300,400,700], true],
    ],
    date: [
      ["inconsolata", "Inconsolata", [200,300,400,500,600,700,800,900]],
      ["iosevka-charon-mono", "Iosevka Charon Mono", [300,400,500,700], true],
      ["datatype", "Datatype", [100,200,300,400,500,600,700,800,900]],
    ],
    body: [
      ["nunito", "Nunito", [200,300,400,500,600,700,800,900,1000], true],
      ["roboto", "Roboto", [100,200,300,400,500,600,700,800,900], true],
      ["ibm-plex-sans", "IBM Plex Sans", [100,200,300,400,500,600,700], true],
      ["geist", "Geist", [100,200,300,400,500,600,700,800,900], true],
      ["figtree", "Figtree", [300,400,500,600,700,800,900], true],
      ["source-sans-3", "Source Sans 3", [200,300,400,500,600,700,800,900], true],
      ["fira-sans", "Fira Sans", [100,200,300,400,500,600,700,800,900], true],
      ["be-vietnam-pro", "Be Vietnam Pro", [100,200,300,400,500,600,700,800,900], true],
      ["miranda-sans", "Miranda Sans", [400,500,600,700], true],
      ["google-sans", "Google Sans", [400,500,600,700], true],
      ["manrope", "Manrope", [200,300,400,500,600,700,800]],
      ["barlow", "Barlow", [100,200,300,400,500,600,700,800,900], true],
      ["sofia-sans", "Sofia Sans", [100,200,300,400,500,600,700,800,900], true],
      ["red-hat-text", "Red Hat Text", [300,400,500,600,700], true],
    ],
  };

  const entries = {};
  Object.entries(CATALOG).forEach(([role, rows]) => {
    CATALOG[role] = rows.map(([id, family, weights, italics]) => {
      const entry = Object.freeze({ id, family, role, fallback: role === "date" ? "monospace" : "sans-serif", weights, italics: !!italics });
      entries[id] = entry;
      return entry;
    });
  });

  function normalize(value) {
    const candidate = value && typeof value === "object" ? value : {};
    const result = {};
    Object.keys(DEFAULTS).forEach((role) => {
      const id = candidate[role];
      result[role] = typeof id === "string" && CATALOG[role].some((font) => font.id === id)
        ? id : DEFAULTS[role];
    });
    return result;
  }

  function readPreferences() {
    try {
      const prefs = JSON.parse(global.localStorage.getItem("userPreferences") || "{}");
      return normalize(prefs && prefs.fonts);
    } catch (_) {
      return normalize(null);
    }
  }

  const requested = new Map();
  let stylesheet;
  function weightsFor(font) {
    const wanted = font.role === "headings" ? [200, 400, 600] : font.role === "date" ? [400] : [400, 700];
    const available = font.weights;
    const nearest = (target) => available.reduce((best, n) => Math.abs(n - target) < Math.abs(best - target) ? n : best, available[0]);
    return [...new Set(wanted.map(nearest))].sort((a, b) => a - b);
  }

  function load(font) {
    const weights = weightsFor(font);
    const key = `${font.family}|${weights.join(",")}|${font.italics}`;
    if (requested.has(key)) return;
    requested.set(key, { font, weights });
    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.id = "webdesk-selected-fonts";
      document.head.appendChild(stylesheet);
    }
    const families = [...requested.values()].map(({ font: item, weights: values }) => {
      const name = encodeURIComponent(item.family).replace(/%20/g, "+");
      const axisValues = item.italics
        ? [...values.map((weight) => `0,${weight}`), ...values.map((weight) => `1,${weight}`)].sort().join(";")
        : values.join(";");
      return item.italics
        ? `family=${name}:ital,wght@${axisValues}`
        : `family=${name}:wght@${axisValues}`;
    });
    stylesheet.href = `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
  }

  function apply(preferences, role) {
    const normalized = normalize(preferences);
    const roles = role ? [role] : Object.keys(DEFAULTS);
    roles.forEach((name) => {
      const font = entries[normalized[name]];
      if (!font) return;
      const variable = name === "headings" ? "--font-headings" : name === "date" ? "--font-date" : "--font-body";
      document.documentElement.style.setProperty(variable, `"${font.family}", ${font.fallback}`);
      load(font);
    });
    return normalized;
  }

  global.FontManager = Object.freeze({ DEFAULTS, CATALOG: Object.freeze(CATALOG), normalize, readPreferences, apply, getFont: (id) => entries[id] || null });
  apply(readPreferences());
})(window);
