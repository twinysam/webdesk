/**
 * BackupManager — Shared import/export logic for WebDesk.
 * Used by both settings.html and onboarding.js.
 */
const BackupManager = {
  VERSION: 6,

  // Canonical localStorage key names
  KEYS: {
    STATS: "clickStats",
    CONFIG: "appConfig",
    PROFILE: "userProfile",
    MYAPPS: "myApps",
    LINKS: "userLinks",
    EVENTS: "customEvents",
    BIRTHDAYS: "userBirthdays",
    ANNUAL_EVENTS: "annualEvents",
    PREFERENCES: "userPreferences",
  },

  /**
   * Build a full backup object from current localStorage state.
   * Returns a plain object ready for JSON.stringify.
   */
  exportData: () => {
    const K = BackupManager.KEYS;
    const read = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) || fallback; }
      catch { return fallback; }
    };

    return {
      stats: read(K.STATS, {}),
      config: read(K.CONFIG, { filters: { hideNeverClicked: false, minClicks: 0 } }),
      customEvents: read(K.EVENTS, []),
      profile: read(K.PROFILE, { name: "", birthday: "", lang: "en" }),
      myApps: read(K.MYAPPS, []),
      userLinks: read(K.LINKS, []),
      userBirthdays: read(K.BIRTHDAYS, []),
      annualEvents: read(K.ANNUAL_EVENTS, []),
      preferences: read(K.PREFERENCES, {}),
      version: BackupManager.VERSION,
      date: new Date().toISOString(),
    };
  },

  /**
   * Restore a backup into localStorage.
   * Handles all primary data keys, derived cache keys, and first-time-user flags.
   *
   * @param {Object} data  — The parsed backup JSON object.
   */
  importData: (data) => {
    const K = BackupManager.KEYS;
    const write = (key, value) =>
      localStorage.setItem(key, JSON.stringify(value));

    // 1. Restore primary data keys
    if (data.stats) write(K.STATS, data.stats);
    if (data.config) write(K.CONFIG, data.config);
    if (data.customEvents) write(K.EVENTS, data.customEvents);
    if (data.profile) write(K.PROFILE, data.profile);
    if (data.myApps) write(K.MYAPPS, data.myApps);
    if (data.userLinks) write(K.LINKS, data.userLinks);
    if (data.userBirthdays) write(K.BIRTHDAYS, data.userBirthdays);
    if (data.annualEvents) write(K.ANNUAL_EVENTS, data.annualEvents);
    if (data.preferences) write(K.PREFERENCES, data.preferences);

    // 2. Legacy format: bare stats object (very old backups)
    if (!data.config && !data.stats && !data.profile) {
      write(K.STATS, data);
    }

    // 3. Sync derived keys
    if (data.profile && data.profile.lang) {
      localStorage.setItem("userLang", data.profile.lang);
    }

    // 4. Regenerate rendering cache from preferences
    BackupManager._regenerateCache(data.preferences);

    // 5. Mark first-time-user UX flags as seen.
    //    Imported users are returning users — they should not see the intro tooltip
    //    ("Today is your day number X") or the settings gear tooltip.
    localStorage.setItem("introDateShown", "true");
    localStorage.setItem("settingsTooltipSeen", "true");

    // 6. Notify active components of state changes
    window.dispatchEvent(new CustomEvent("webdesk:eventsUpdated"));
    window.dispatchEvent(new CustomEvent("webdesk:linksUpdated"));
    window.dispatchEvent(new CustomEvent("webdesk:appsUpdated"));
  },

  /**
   * Rebuild the rendering cache keys that index.html and webdesk.js read on startup
   * for instant background color/theme rendering.
   *
   * Pattern SVG data URIs (cachedBgImageLight/Dark) cannot be regenerated here because
   * bg-patterns.js is lazy-loaded. We clear stale values so webdesk.js will regenerate
   * them on next load via its fallback path.
   */
  _regenerateCache: (prefs) => {
    if (!prefs) return;

    // Color cache — used by index.html inline script for instant rendering
    if (prefs.bgColorLight)
      localStorage.setItem("cachedBgColorLight", prefs.bgColorLight);
    if (prefs.bgColorDark)
      localStorage.setItem("cachedBgColorDark", prefs.bgColorDark);
    if (prefs.linkColor)
      localStorage.setItem("cachedLinkColor", prefs.linkColor);
    if (prefs.linkHoverColor)
      localStorage.setItem("cachedLinkHoverColor", prefs.linkHoverColor);
    if (prefs.highlightColor)
      localStorage.setItem("cachedHighlightColor", prefs.highlightColor);

    // Pattern SVG cache — clear stale URIs so webdesk.js regenerates them.
    // We cannot generate them here (bg-patterns.js is not loaded).
    if (prefs.bgPattern && prefs.bgPattern !== "none") {
      // Remove stale cache — webdesk.js will lazy-load bg-patterns.js and rebuild
      localStorage.removeItem("cachedBgImageLight");
      localStorage.removeItem("cachedBgImageDark");
      localStorage.removeItem("cachedBgSize");
      localStorage.removeItem("cachedBgSizeY");
    } else if (prefs.bgPattern === "none") {
      localStorage.setItem("cachedBgImageLight", "none");
      localStorage.setItem("cachedBgImageDark", "none");
      localStorage.removeItem("cachedBgSize");
      localStorage.removeItem("cachedBgSizeY");
    }
  },
};

window.BackupManager = BackupManager;

