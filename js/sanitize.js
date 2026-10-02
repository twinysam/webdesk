/**
 * SafeLink — shared URL-validation and HTML-escaping helpers.
 *
 * WebDesk renders user- and import-supplied strings (event names, custom link
 * names/URLs, profile name, backup data) into innerHTML and into href/src
 * attributes. These helpers make that safe:
 *
 *   - SafeLink.url(u)    returns a trimmed URL only when its scheme is
 *                        http/https/mailto (or it is relative / an anchor);
 *                        otherwise it returns null. This blocks javascript:,
 *                        data:, vbscript:, etc.
 *   - SafeLink.escape(s) escapes text for use inside HTML text or attribute
 *                        values.
 *
 * Loaded before app-manager/links-manager/events-manager/webdesk.js on both
 * index.html and settings.html.
 */
window.SafeLink = (() => {
  const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

  function url(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Collapse control/whitespace chars that browsers ignore when parsing a
    // scheme (e.g. "java\nscript:") so the scheme check can't be bypassed.
    const probe = trimmed.replace(/[\u0000-\u0020\u007f]/g, "");

    // No scheme (relative path, "#anchor", "?query", "//host") -> allow as-is.
    if (!SCHEME_RE.test(probe)) return trimmed;

    let protocol;
    try {
      protocol = new URL(probe).protocol.toLowerCase();
    } catch {
      return null;
    }
    return ["http:", "https:", "mailto:"].includes(protocol) ? trimmed : null;
  }

  function escape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return { url, escape };
})();
