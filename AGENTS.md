# AGENTS.md — WebDesk

Guidance for AI coding agents working in this repository. Read `README.md` first: it
covers what WebDesk is, its features, its privacy stance, how to test special days and
how to contribute. This file only adds what an agent needs beyond that.

## Constraints

- Plain HTML/CSS/vanilla JS. **No build step, no bundler, no npm, no framework.**
- Static site on GitHub Pages; default branch `master`.
- UI languages: English and Spanish. Desktop browsers only (`js/device-check.js`
  deliberately blocks phones and tablets).

## Priorities (when they conflict, the earlier one wins)

1. **Configuration and personalization must apply as early as possible, with no blink
   of any kind.** No flash of default theme/colors/pattern, no font swap that moves
   layout, no content popping in or shifting, no light/dark flicker, no seasonal
   decoration appearing late. First paint should already be *the user's* page.
2. **Stay agile and cheap to keep open.** The tab runs all day. Idle cost must be close
   to zero: no polling, no wasted timers, no layout thrash, no memory growth, no heavy
   assets loaded unless needed. Startup must be fast too.
3. **Keep the README's privacy promise.** Third-party requests are limited to pinned
   static CDN libraries and Google Fonts. Never hotlink images.
4. **Accuracy where it is visible** (moon phase, solar terms, dates), as long as it
   doesn't cost smooth performance.
5. Simplicity: prefer the smallest change that does the job.

## Working agreement

- Make focused diffs. Don't reformat or refactor unrelated code. Don't add
  dependencies, build tooling or new CDN scripts without asking first.
- **Don't guess facts.** If you don't know something (a font's available weights,
  browser behavior, an API's response), verify it or say it's unverified. "I don't
  know" is always better than a plausible invention.
- Don't commit or push unless asked. Never commit anything from `dev/`.
- Commit messages: short, imperative, descriptive (e.g. "Fix settings season cutoff").

## The `dev/` folder (required for all development-only material)

`dev/` is listed in `.gitignore`. **Anything that exists only to help develop, test or
document the project goes in `dev/`**, never in the repo root or any tracked folder:

- helper scripts (locale-key parity checker, data/pipeline scripts, image converters)
- test harnesses, headless-browser checks, performance/CLS measurements, fixtures
- scratch files, generated reports, benchmark output, audit/design notes, drafts

Rules:
- Create `dev/` if it doesn't exist; organize with subfolders (`dev/scripts/`,
  `dev/tests/`, `dev/notes/`).
- The shipped app must never import, fetch or reference anything in `dev/`.
- `dev/` is not versioned, so scripts must be self-contained and begin with a comment
  saying what they do and how to run them.
- Durable guidance for future agents belongs in this file, not in `dev/`.
- Don't edit `.gitignore` to un-ignore `dev/` or hide other things without asking.

## Project map

| Path | Purpose |
| --- | --- |
| `index.html` | The desk. Head contains the **early-config inline script**. Scripts load at end of body in a fixed order. |
| `settings.html` | Settings page: one large file with inline JS. Sections: general, dates, links, apps, appearance (incl. typography), usage, data. |
| `webdesk.js` | Main app: `ProfileManager`, `PreferencesManager`, `StatsManager`, `GreetingManager`, `EventsManager`, `DesktopAppRenderer`, `TooltipManager`, `CalendarManager`, then init. |
| `onboarding.js` / `onboarding.css` | First-run flow (name, birthday, language, app picking). |
| `halloween.js` / `halloween.css` | Seasonal theme (ghosts, spider, skull pattern). Template for any future seasonal theme. |
| `js/font-manager.js` | **Only** entry point for fonts: curated catalog, `--font-headings/--font-date/--font-body` variables, Google Fonts loading. |
| `js/i18n.js` | `I18nManager`: locale loading, `getString`, greeting rules, Halloween season check. |
| `js/date-utils.js` | `DateUtils`: calendars, Easter, Chinese New Year, lunar phase, hemisphere, season theme presets. |
| `js/moon-renderer.js` | Renders the current moon phase locally (emoji fallback). |
| `js/app-manager.js` | `AppManager`: app catalog (`items.json`) + user's apps (`myApps`). |
| `js/links-manager.js`, `js/events-manager.js` | Custom links; birthdays/annual/one-time events (`EventManager`, not the same as `EventsManager` in `webdesk.js`). |
| `js/backup.js` | `BackupManager`: export/import of all user data. |
| `js/sanitize.js` | `SafeLink`: escaping/URL safety. Use it for any user text put into HTML. |
| `js/bg-patterns.js` | ~216 KB SVG pattern library. **Settings-only**; lazy-loaded. |
| `js/device-check.js` | Blocks phones/tablets. |
| `items.json`, `tv-items.json` | App and TV-channel catalogs (`name`, `url`, `icon`, `title`). |
| `app-icons.css`, `tv-icons.css` | Icon class per catalog entry (`.item a.<icon>`) pointing to `images/app_*.webp`. |
| `webdesk-tt-2027-3000.json` | Precomputed astronomical data (new moons, solar terms, in TT) from Skyfield + JPL DE440/441. Fetched on demand. |
| `locales/en.json`, `locales/es.json` | UI strings (`strings`) and `greetingRules`. Key sets must stay identical. |
| `images/`, `icons/`, `fonts/` | Assets. |

Script order in `index.html` matters (backup, sanitize, onboarding, app-manager,
Popper, Bootstrap JS, dayjs + plugins, date-utils, moon-renderer, i18n, device-check,
links-manager, events-manager, `webdesk.js`, `halloween.js`). Modules are globals
(`window.XManager`) or IIFEs; keep that style.

## Early-load, no-blink rules (Priority 1)

- Anything that changes first paint — theme (light/dark/system), colors, background
  pattern and scroll speed, fonts, season/Halloween class, full-width mode, language
  — must be resolved by **synchronous code in `<head>`** (the inline script in
  `index.html`, `js/font-manager.js`) from `localStorage`, before `<body>` renders.
  Not in `DOMContentLoaded`, not after a `fetch`, not after an async init.
- If a value is expensive to derive (e.g. a pattern data URI), compute it **at save
  time** in settings and store it in a `cached*` key the head script reads
  (`cachedBgColorLight/Dark`, `cachedBgImageLight/Dark`, `cachedBgSize/SizeY`,
  `cachedLinkColor`, `cachedLinkHoverColor`, `cachedHighlightColor`). When a setting
  affects first paint, add its cache key to backup import's cache regeneration too.
- Mirror early-config changes in `settings.html`'s head script so both pages agree.
- "System" light/dark must work through CSS `prefers-color-scheme` with no JS; JS only
  adds classes for explicit overrides.
- **Never gate first paint on the network** when cached data exists. Render from cache
  (e.g. `catalogCache`, stored locale) and revalidate in the background.
- No cache-busting query strings (`?v=Date.now()`) on static files in production code.
- Reserve space for content that arrives later (greeting, date line, tree, icon grid)
  so nothing shifts. Don't insert elements above existing content after paint.
- Fonts: use the CSS variables, never hard-coded families. Request only the weights
  actually used. Keep `display=swap` and fallback stacks with similar metrics. If you
  change which weights the CSS uses, update `weightsFor()` in `font-manager.js`.
- Only the tiny config script and `font-manager.js` may run in `<head>`; everything
  else goes at the end of `<body>` or uses `defer`.
- Seasonal themes: set the theme class in the head, before first paint.

## Performance and resource rules (Priority 2)

- **Idle must be idle.** No polling; prefer events. Any timer must be justified, paused
  while the tab is hidden or the window is blurred (follow the `blur`/`focus`/
  `visibilitychange` handling in `webdesk.js` and `halloween.js`), and cleared on
  teardown.
- Animate with CSS or the Web Animations API on `transform`/`opacity` only; use
  `will-change` sparingly; respect `prefers-reduced-motion`.
- No scroll-linked effects (JS repositioning on scroll). Use `IntersectionObserver` /
  `ResizeObserver`; debounce `resize`; never read layout (`getBoundingClientRect`,
  `offsetWidth`…) inside loops or right after writes.
- No leaks: remove listeners/observers, cancel animations, don't grow DOM or caches
  without bounds.
- Load heavy things only when needed, following existing patterns: FullCalendar only
  if the calendar is enabled; Sortable, Coloris and `bg-patterns.js` only in settings.
  Keep large libraries and data off the `index.html` startup path.
- Large data (`webdesk-tt-2027-3000.json`, ~1.5 MB): fetch on demand, parse once, keep
  in memory.
- Images: `.webp`, sized to roughly 2x their displayed size; a decorative sprite should
  be KBs, not MBs. **Seasonal or conditional assets must not download outside their
  condition** — create `<img>` via JS when the theme is active, or scope CSS to the
  theme class. Don't commit unreferenced assets.
- Justify any bytes added to the startup path. Prefer vanilla JS over new libraries.
- Remove debug `console.log` from startup and hot paths.

## Storage contract

Shapes are part of the public contract because backups import them.

`userPreferences` (object; includes `fonts: {headings,date,body}`, theme, bg*,
`patternColor*`, `linkColor*`, `highlightColor`, `autoSeason`, feature flags,
`disableHalloweenDecorations`…), `userProfile`, `userLang` (raw string, not JSON),
`myApps`, `userLinks`, `userBirthdays` (`DD/MM`), `annualEvents` (`DD/MM`),
`customEvents` (`DD/MM/YYYY`), `clickStats`, `appConfig` (`order`, `hidden`,
`filters`), `catalogCache`, the `cached*` keys above, and backup/tooltip bookkeeping
(`lastBackupTime`, `changesSinceBackup`, `settingsTooltipSeen`, …).

- Always read-modify-write and **preserve keys you don't own** (saving filters must not
  drop `appConfig.order`/`hidden`; saving preferences must not drop `fonts`).
- Wrap every `JSON.parse` of stored data in try/catch with a safe default.
- Don't change an existing shape without a backward-compatible migration. Legacy
  values (e.g. bare-number `clickStats`) must stay readable.
- New persisted data must be covered by `js/backup.js` export/import and validated or
  normalized on import (see how `fonts` is normalized).
- Writes that count as "changed since backup" go through `BackupManager.recordChange()`.

## i18n

- Every user-visible string goes in **both** `locales/en.json` and `locales/es.json`
  with identical keys, read via `I18nManager.getString` / `data-i18n`. No new
  hard-coded English in the UI.
- Date formatting uses dayjs with the saved locale.
- Keep a locale-parity check in `dev/scripts/` and run it after touching locales.

## Code conventions

- Vanilla ES2020+, two-space indent, double quotes, English comments, section banners
  like `// MODULE: Name`.
- Don't rename element ids/classes the JS depends on (settings tabs, panes, form ids).
  Search for usages first.
- Escape user-supplied text inserted into HTML with `SafeLink`. Validate imported data;
  never trust backups.
- Adding an app: add an entry to `items.json`, plus its `.item a.<icon>` rule in
  `app-icons.css` with a **local** `images/app_<name>.webp` (some legacy entries
  hotlink; don't copy that). TV channels use `tv-items.json` / `tv-icons.css`.
- New assets and code must be GPL-compatible and credited. Gap: the emoji-style images
  in `images/openmoji/` and `images/halloween/` appear OpenMoji-derived, but no credit
  or license note was found in the repo. Confirm the source and license, then credit
  it (OpenMoji's license has attribution/share-alike terms; verify before relying on
  this).

## Astronomy and dates

- Moon phase/illumination should be checkable against NASA's Daily Moon Guide.
- `webdesk-tt-2027-3000.json` holds TT timestamps, generated with Skyfield against JPL
  DE440/DE441. Regeneration tooling lives outside the shipped app (use `dev/`).
  Document any ΔT/UTC assumptions where code consumes the data.
- Hemisphere is inferred from timezone/profile only. **Do not collect exact location.**
  Any location feature must be opt-in and stay local.
- `dayjs('YYYY-MM-DD')` parses as UTC midnight (off-by-one in UTC−3): split and
  construct dates locally. Feb 29 events roll to Mar 1 in non-leap years in countdowns.

## Verifying changes

There is no automated test suite. Serve statically (`python3 -m http.server`; `fetch()`
needs http, not `file://`) and check in **Firefox and a Chromium browser**:

- Hard reload with an empty cache **and** a warm cache; throttle CPU/network in
  DevTools and watch first paint for any flash or layout shift.
- Light, dark and system themes; English and Spanish; fresh profile (onboarding) and
  existing one.
- `?theme=halloween` and `?theme=none`, plus the special-day effects described in the
  README.
- Leave the tab idle for a few minutes: CPU should sit near zero (browser task manager
  / Performance panel) and animation should pause when hidden or blurred.
- Console is clean, settings saves survive a reload, and a backup export → import
  round-trips.

## Known gaps against these rules (as of commit `fad84f6`, from code reading only)

Fix opportunistically; none were measured in a browser.

- **Halloween class is applied late.** `I18nManager.applyHalloweenTheme()` runs after
  the async locale load in `startWebDesk()`, so themed styles may appear after first
  paint. It previously ran inline in `<head>`. Restore a synchronous head check.
- **Halloween images load year-round (probably).** `index.html` has static `<img>` tags
  for the ghosts, spider and headstone (~1 MB PNGs each at last check) inside a
  `display: none` container, which browsers generally still fetch. Create them from JS
  only when the theme is active, and shrink them to WebP.
- **Locale fetch uses `?v=Date.now()`** in `js/i18n.js` and happens before first
  content, defeating the cache on every load.
- **`.caja` starts visible** in markup; `webdesk.js` later sets `style.display = ""`.
  Check whether content can show before the profile/fonts are applied.
- **Unreferenced assets:** `images/openmoji/` (~4,500 files, ~23 MB) isn't referenced
  by any code. Verify, then remove or move out of the shipped tree.
- **Hotlinked icons** remain in `app-icons.css` (e.g. Yahoo Mail, Banco Nación).
- **Heavy startup path:** Bootstrap JS 5.0.0 vs CSS 5.3.3 mismatch;
  `bootstrap-icons@latest` is unpinned; scripts are non-deferred at end of body.
- **Duplicate timers:** `GreetingManager.updateMessage` is scheduled with `setInterval`
  in both `init()` and `startWebDesk()`; confirm only one runs. The interval also
  doesn't pause while the tab is hidden.

## Definition of done

- [ ] No first-paint flash or layout shift introduced; new first-paint settings are
      cached and applied from `<head>`.
- [ ] No new idle work, leaks, scroll-linked effects or startup-path weight without
      justification.
- [ ] `localStorage` shapes unchanged or migrated; backup export/import covers new data.
- [ ] Strings added to both locales; parity check passes.
- [ ] Dev-only files are in `dev/` and nothing from `dev/` is referenced or committed.
- [ ] Anything unverified is stated as unverified.
