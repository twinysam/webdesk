# Settings redesign — Phase 0 audit notes

Audited: `settings.html` (all 2,710 lines), `index.html`, `webdesk.js`, `js/*.js`, `locales/*.json`.
Branch: `settings-redesign`. No code changed in this phase.

## 1. localStorage inventory

| Key | Written by | Read by | Shape |
| --- | --- | --- | --- |
| `userPreferences` | settings.html (`saveData`), webdesk.js auto-season syncer, backup import | index.html inline script, webdesk.js, settings.html | object, see below |
| `userProfile` | settings.html (Save Profile), onboarding, backup import | webdesk.js `ProfileManager`, settings.html | `{ name: string, birthday: "YYYY-MM-DD", lang: "en"\|"es", hemisphere: "southern"\|"northern", isSetup: true }` |
| `userLang` | settings.html, `ProfileManager.setProfile`, backup import | `I18nManager.getLang()`, dayjs locale bootstrap | raw string `"en"` or `"es"` (not JSON) |
| `myApps` | `AppManager.saveRawApps/saveOrder` | `AppManager.getRawApps`, webdesk.js | array of `{ name }` (sparse; catalog data is merged in from `items.json`) |
| `userLinks` | `LinksManager.saveLinks` | `LinksManager.getLinks`, webdesk.js | array of `{ name: string, url: string }` |
| `userBirthdays` | `EventManager.saveBirthdays` | `EventManager.getBirthdays`, webdesk.js | array of `{ name, birthday: "DD/MM", countdown: boolean }` |
| `annualEvents` | `EventManager.saveAnnualEvents` | `EventManager.getAnnualEvents`, webdesk.js | array of `{ name, date: "DD/MM", url, countdown }` |
| `customEvents` | `EventManager.saveCustomEvents`, webdesk.js auto-delete | `EventManager.getCustomEvents`, webdesk.js | array of `{ name, date: "DD/MM/YYYY", url, countdown }` |
| `clickStats` | webdesk.js click handler | settings.html (Usage), backup | map `{ [name]: number \| { count, lastClick, category } }`; `category: "tv"` marks TV channels; legacy bare numbers must stay readable |
| `appConfig` | settings.html (filters), onboarding (`order`, `hidden`) | webdesk.js, settings.html | `{ order?: string[], hidden: string[], filters: { hideNeverClicked: boolean, minClicks: number } }` — **`order`/`hidden` must survive a filters save** |

| `cachedBgColorLight/Dark` | settings.html appearance commit, `BackupManager._regenerateCache` | index.html inline head script | raw CSS color string |
| `cachedBgImageLight/Dark` | settings.html appearance commit | index.html inline head script | SVG data URI or `"none"` |
| `cachedBgSize`, `cachedBgSizeY` | settings.html appearance commit | index.html inline head script | stringified number |
| `cachedLinkColor`, `cachedLinkHoverColor`, `cachedHighlightColor` | settings.html appearance commit | index.html inline head script | raw CSS color string |
| `cachedBgPattern`, `cachedBgColor` | settings.html appearance commit | legacy only | data URI / color |
| `lastBackupTime`, `changesSinceBackup`, `lastBackupReminderTime` | `BackupManager` | `BackupManager.shouldShowBackupReminder` | ISO string / integer / ISO string |
| `catalogCache` | `AppManager.getCatalog` | `AppManager.getCatalog` offline fallback | `items.json` copy |
| `introDateShown`, `settingsTooltipSeen`, `setupTime` | onboarding / import | webdesk.js tooltips | `"true"` / ISO string |

`userPreferences` fields (from `defaultPreferences` plus everything `applyLiveBackground` writes):
`eveningStart` (int\|null), `treeEnabled`, `customLateGreeting`, `autoDeleteEvents`, `enableCalculator`,
`enableCalendar`, `fullWidth`, `theme` (`"system"|"light"|"dark"`), `bgPattern` (string),
`bgColorLight`, `bgColorDark`, `patternColorLight`, `patternColorDark` (colors),
`patternOpacity` (0–1 decimal), `bgScrollSpeed` (int), `selectedPreset`
(`"custom"|"winter"|"spring"|"summer"|"autumn"`), `autoSeason` (bool), and preset-derived
`linkColor`, `linkHoverColor`, `highlightColor`.

## 2. DOM ids and classes the JS depends on

- Tabs/nav: `settingsTabs`, `settingsTabsContent`, `profile-tab`, `stats-tab`, `apps-tab`,
  `links-tab`, `events-tab`, `birthdays-tab`, `appearance-tab`, `preferences-tab`, `data-tab`.
- Panes: `profile`, `stats`, `apps`, `links`, `birthdays`, `events`, `appearance`,
  `preferences`, `data`.
- `#appearance-tab` has a `shown.bs.tab` listener that lazy-loads `js/bg-patterns.js`;
  `#apps-tab` and `#links-tab` have `shown.bs.tab` listeners that lazy-load SortableJS.
- General: `setting-name`, `setting-dob`, `setting-lang`, `setting-hemisphere`, `btnSaveProfile`.
- Dates: `birthdayForm`, `bdayName`, `bdayMonth`, `bdayDay`, `birthdaysListBody`,
  `annualEventForm`, `annualName`, `annualUrl`, `annualMonth`, `annualDay`, `annualEventsListBody`,
  `eventForm`, `eventName`, `eventDate`, `eventUrl`, `eventsListBody`, `btnCleanEvents`.
- Apps: `catalog-list`, `catalog-search`, `myapp-list`, `AppManager`, class `sort-handle`,
  Sortable option `ghostClass: "ghost-class"`.
- Links: `linkForm`, `linkName`, `linkUrl`, `linksListBody`.
- Appearance: `checkFullWidth`, `selectTheme`, `selectBgPattern`, `presetThemeSelect`,
  `autoSeasonToggle`, `lightModeSection`, `darkModeSection`, `inputBgColorLight`,
  `inputBgColorDark`, `inputPatternColorLight`, `inputPatternColorDark`,
  `patternSettingsLight`, `patternSettingsDark`, `rangePatternOpacity`,
  `labelPatternOpacityVal`, `rangeBgScrollSpeed`, `labelBgScrollSpeedVal`, `btnSaveAppearance`.
- Usage/stats: `appsBody`, `tvStatsSection`, `tvBody` (never filled), `inputRemoveThreshold`,
  `btnRemoveLowClicks`.
- Preferences: `btnPersistentStorage`, `textPersistentStorageActive`, `checkHideNeverClicked`,
  `inputMinClicks`, `prefEveningStart`, `prefLateGreeting`, `prefTreeToggle`,
  `checkAutoDeleteEvents`, `checkEnableCalculator`, `checkEnableCalendar`, `btnSavePreferences`.
- Data: `btnExport`, `btnImport`, `fileInput`, `lastBackupText`, `alertContainer`.
- Shared helpers: `showAlert()`, `goHome()`, `getData()`, `saveData()`, `BackupManager`,
  `EventManager`, `LinksManager`, `AppManager`, `DateUtils`, `I18nManager`, `SafeLink`,
  `dayjs`, Bootstrap 5.0 JS (loaded from CDN, CSS is 5.3.3), Coloris.

Grep result: nothing outside `settings.html` references any tab/pane id, so the pane ids are safe
to rename as long as `settings.html` itself is consistent.

## 3. Answers to the 11 audit questions

1. **Date stores and item shape.** Birthdays `userBirthdays` → `{ name, birthday: "DD/MM", countdown }`;
   annual events `annualEvents` → `{ name, date: "DD/MM", url, countdown }`; one-time events
   `customEvents` → `{ name, date: "DD/MM/YYYY", url, countdown }`. **No ids.** Matching for
   update/delete is `findIndex` on `name` + date string, so duplicates are allowed and the first
   match wins.
2. **`YYYY-MM-DD` parsing.** The only `YYYY-MM-DD` values in play are `<input type="date">` values
   and `userProfile.birthday`. `EventManager.addEvent("custom")` converts the input value to
   `DD/MM/YYYY` by splitting on `-` (never `new Date(string)`). `webdesk.js` uses
   `dayjs(userBirthday)` (profile birthday) for the "is it your birthday today" check and
   `dayjs(userBirthday)` for `DateUtils.START_DATE`; that ISO parse is UTC midnight in dayjs, the
   known UTC−3 off-by-one. **The new Dates UI will split `YYYY-MM-DD` into parts and call
   `new Date(y, m-1, d)` for anything it parses itself.**
3. **Feb 29 in non-leap years.** `index.html` has no explicit rule anywhere (grep for `29/02`,
   `isLeap` finds nothing outside the Chinese-calendar leap month). Today/tomorrow detection is
   string equality (`b.birthday === today`, `"DD/MM"`), so a `29/02` entry simply never matches in
   a non-leap year — no "today" line, no balloons. The countdown path builds the date with
   `dayjs(dateStr + '/' + year, 'DD/MM/YYYY')`, which normalises Feb 29 to **Mar 1** in a non-leap
   year (verified against the same CDN build: `dayjs('29/02/2025','DD/MM/YYYY')` → `2025-03-01`).
   Rule adopted for the Dates list: next occurrence of `29/02` is **Feb 29 in leap years and
   Mar 1 otherwise**, matching the desk countdown (documented in the Dates code).
4. **Tab-dependent listeners.** `#appearance-tab` → lazy-load `bg-patterns.js`;
   `#apps-tab` and `#links-tab` → lazy-load SortableJS then re-render. `#label-events-tab` is only
   an i18n target. Nothing listens to `shown.bs.tab` on the other buttons, and nothing outside
   `settings.html` references these ids. All three ids are kept in the new sidebar.
   **Bootstrap note:** the page loads `bootstrap@5.0.0` JS (CSS is 5.3.3), which has **no
   `Tab.getOrCreateInstance`** and **no arrow-key support in `tab.js`**. Section activation uses
   `getInstance() || new Tab()` and the sidebar implements Up/Down/Home/End itself.

5. **Preferences and Backup contents.** Preferences holds the persistent-storage request button plus
   8 controls (hide-never-clicked, min clicks, evening start, late greeting, tree, auto-delete,
   calculator, calendar) and has its own Save button. Backup holds export, import and the
   "last backup" line. **There is no reset/destructive action anywhere**, so none is added
   (plan default).
6. **Language change today:** writes `userProfile.lang` + `userLang`, shows an alert, then
   `location.reload()` after 1 s. dayjs locale and the locale fetch both read `userLang` at load, so
   a reload is the existing contract; the language select keeps it (after flushing pending saves).
7. **Empty name / empty birthday:** the current Save button refuses both (`alert_fill_fields`).
   Outside the form, `ProfileManager.getName()` returns `""` (not `"User"`) when the profile exists
   with an empty name, and `webdesk.js` skips `DateUtils.START_DATE` fallback when the birthday is
   empty, leaving "Day 0" in the greeting line and `initCalculator` on its 1900 fallback. **Neither
   is safe to clear**, so both are validated: empty name and empty birthday are rejected inline and
   the last valid value stays in storage.
8. **Appearance already applies live**, and `applyLiveBackground()` *already writes*
   `userPreferences` + all `cachedBg*` keys on every `input` event; the Save button only adds an
   alert and persists `selectedPreset`/`autoSeason`. Presets: the select's own `change` handler
   pushes the preset palette into the two light-mode pickers and saves the colors, but
   `selectedPreset` is only stored by the Save button. With a non-custom preset (or auto-season
   active) the next load overwrites the pickers with the preset/season palette, so a hand-edited
   colour is silently reverted on reload. **Decision:** autosave keeps preset and auto-season
   behaviour, but a manual colour edit now switches the preset select to `custom` and switches
   auto-season off (both visible in the same card) so an autosaved edit is not silently reverted.
   This is the only deliberate behaviour change in Appearance. Note `webdesk.js` has its own
   auto-season syncer (lines 271–300) that rewrites the stored colours and cache keys whenever
   `autoSeason` is true — another reason the switch must be off for a manual colour to stick.

9. **Writes are scattered**: `saveData(key, data)` exists in `settings.html` and wraps
   `localStorage.setItem` + `BackupManager.recordChange()`, but the head script, `userLang`,
   the `cachedBg*` keys and the `EventManager`/`LinksManager`/`AppManager` modules each write
   directly. `updatePrefs`/`saveSetting` will wrap read-modify-write around the same keys and keep
   calling `BackupManager.recordChange()`, leaving the shared modules' own writers alone.
10. **No service worker.** Commit `199dd86` removed it ("Remove retired cumples.json/events.json
    fetches and unused service worker"); the only remaining copy is `old-website/service-worker.js`,
    which nothing registers (`navigator.serviceWorker` appears nowhere in `index.html`,
    `settings.html` or any script). The "bump the SW version / test the upgrade path" tasks are
    therefore **N/A**.
11. **`index.html` does listen for `storage`** — `myApps` (re-render desktop), and
    `userBirthdays`/`annualEvents`/`customEvents` (re-check events + calendar) in `webdesk.js`.
    It does **not** listen for `userPreferences`/`userProfile`/`userLang`, so theme and greeting do
    not update live in another tab; that stays out of scope (optional item). `settings.html`
    already listens for `myApps`; a general `storage` listener is added in Phase 6.

Extra findings worth recording:

- **Balloons on the desk are for the profile's own birthday only** (`webdesk.js:456-464`,
  month + day-of-month match). `userBirthdays` entries are plain text in the `#fecha` line on an
  exact `DD/MM` match; annual and one-time events likewise. The QA row "index.html shows balloons
  for birthdays only" therefore means "nothing about the desk's output changes" — no desk code is
  touched by this project.
- `EventManager.updateEvent` rebuilds each item with exactly four fields, so an `id` added to a
  date item would additionally be **dropped on the next edit**. Another reason the plan's
  index-keyed fallback is the right choice here.
- Import/export is entirely shape-agnostic (no `Array.isArray`, no version check, `version` is
  write-only), so today's backups and older ones both keep importing: `importData` only writes the
  nine keys that are present.


## 4. Decisions carried into the implementation

- **No `id` field is added to date items.** Although `BackupManager.importData` copies
  `userBirthdays`/`annualEvents`/`customEvents` wholesale and would tolerate an extra field, the
  plan's hard constraint is "no schema change", so rows are keyed by `{ type, index }` into the
  original array and the list is re-rendered after every mutation. Rollback stays trivial.
- **Preferences folds into General** as a "Features" card (5 switches + 3 inputs, i.e. not "more
  than about six toggles" and not visual settings), plus a Storage card. Seven sections as designed.
- **Section ids:** `general`, `dates`, `links`, `apps`, `appearance`, `usage`, `data`. Legacy hashes
  `#profile`→`general`, `#stats`→`usage`, `#birthdays`/`#events`→`dates`, `#preferences`→`general`.
- **No reset button** is added to Data.
- `EventManager.renderBirthdaysTable/renderAnnualEventsTable/renderCustomEventsTable` become unused
  by the settings page (the unified list replaces them) but stay in `js/events-manager.js`
  untouched, so `index.html` and the events overlay keep working.
