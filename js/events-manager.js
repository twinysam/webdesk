// ==========================================================================
// MODULE: EventManager
// Unified Event Management (Birthdays, Annual Events, Unique Events)
// ==========================================================================
window.EventManager = (() => {
  const BIRTHDAYS_KEY = "userBirthdays";
  const ANNUAL_EVENTS_KEY = "annualEvents";
  const CUSTOM_EVENTS_KEY = "customEvents";

  let abortController = null;

  // --- Storage Helpers ---
  function getBirthdays() {
    return JSON.parse(localStorage.getItem(BIRTHDAYS_KEY)) || [];
  }

  function saveBirthdays(list) {
    localStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(list));
    dispatchUpdate();
  }

  function getAnnualEvents() {
    return JSON.parse(localStorage.getItem(ANNUAL_EVENTS_KEY)) || [];
  }

  function saveAnnualEvents(list) {
    localStorage.setItem(ANNUAL_EVENTS_KEY, JSON.stringify(list));
    dispatchUpdate();
  }

  function getCustomEvents() {
    return JSON.parse(localStorage.getItem(CUSTOM_EVENTS_KEY)) || [];
  }

  function saveCustomEvents(list) {
    localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(list));
    dispatchUpdate();
  }

  function dispatchUpdate() {
    window.dispatchEvent(new CustomEvent("webdesk:eventsUpdated"));
  }

  function t(key, fallback) {
    if (window.I18nManager && typeof window.I18nManager.getString === "function") {
      return window.I18nManager.getString(key);
    }
    return fallback || key;
  }

  function showAlertMsg(msg, type = "success") {
    if (typeof window.showAlert === "function") {
      window.showAlert(msg, type);
    }
  }

  function getMonthNames() {
    const isEs = (window.I18nManager && window.I18nManager.getLang() === "es") ||
      (localStorage.getItem("userLang") === "es");
    if (isEs) {
      return [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
    }
    return [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  }

  function getMaxDays(monthNum) {
    const m = parseInt(monthNum, 10);
    if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
    if (m === 2) return 29;
    return 31;
  }

  // --- CRUD Operations ---
  function addEvent(type, data) {
    if (type === "birthday") {
      const list = getBirthdays();
      list.push({
        name: data.name.trim(),
        birthday: `${data.day}/${data.month}`,
        countdown: !!data.countdown,
      });
      saveBirthdays(list);
      showAlertMsg(t("alert_birthday_added", "Birthday added!"));
    } else if (type === "annual") {
      const list = getAnnualEvents();
      list.push({
        name: data.name.trim(),
        date: `${data.day}/${data.month}`,
        url: data.url ? data.url.trim() : "",
        countdown: !!data.countdown,
      });
      saveAnnualEvents(list);
      showAlertMsg(t("alert_annual_added", "Annual event added!"));
    } else if (type === "custom") {
      const list = getCustomEvents();
      // Date from <input type="date"> is YYYY-MM-DD, convert to DD/MM/YYYY
      let formattedDate = data.date;
      if (data.date && data.date.includes("-")) {
        const parts = data.date.split("-");
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      list.push({
        name: data.name.trim(),
        date: formattedDate,
        url: data.url ? data.url.trim() : "",
        countdown: !!data.countdown,
      });
      saveCustomEvents(list);
      showAlertMsg(t("alert_event_added", "Event added!"));
    }
  }

  function updateEvent(type, oldItem, data) {
    if (type === "birthday") {
      const list = getBirthdays();
      const idx = list.findIndex(
        (b) => b.name === oldItem.name && b.birthday === oldItem.birthday
      );
      if (idx !== -1) {
        list[idx] = {
          name: data.name.trim(),
          birthday: `${data.day}/${data.month}`,
          countdown: !!data.countdown,
        };
        saveBirthdays(list);
        showAlertMsg(t("alert_event_updated", "Event updated!"));
      }
    } else if (type === "annual") {
      const list = getAnnualEvents();
      const idx = list.findIndex(
        (e) => e.name === oldItem.name && e.date === oldItem.date
      );
      if (idx !== -1) {
        list[idx] = {
          name: data.name.trim(),
          date: `${data.day}/${data.month}`,
          url: data.url ? data.url.trim() : "",
          countdown: !!data.countdown,
        };
        saveAnnualEvents(list);
        showAlertMsg(t("alert_event_updated", "Event updated!"));
      }
    } else if (type === "custom") {
      const list = getCustomEvents();
      const idx = list.findIndex(
        (e) => e.name === oldItem.name && e.date === oldItem.date
      );
      if (idx !== -1) {
        let formattedDate = data.date;
        if (data.date && data.date.includes("-")) {
          const parts = data.date.split("-");
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        list[idx] = {
          name: data.name.trim(),
          date: formattedDate,
          url: data.url ? data.url.trim() : "",
          countdown: !!data.countdown,
        };
        saveCustomEvents(list);
        showAlertMsg(t("alert_event_updated", "Event updated!"));
      }
    }
  }

  function deleteEvent(type, item) {
    if (type === "birthday") {
      const list = getBirthdays();
      const idx = list.findIndex(
        (b) => b.name === item.name && b.birthday === item.birthday
      );
      if (idx !== -1) {
        list.splice(idx, 1);
        saveBirthdays(list);
        showAlertMsg(t("alert_birthday_deleted", "Birthday deleted!"));
      }
    } else if (type === "annual") {
      const list = getAnnualEvents();
      const idx = list.findIndex(
        (e) => e.name === item.name && e.date === item.date
      );
      if (idx !== -1) {
        list.splice(idx, 1);
        saveAnnualEvents(list);
        showAlertMsg(t("alert_annual_deleted", "Annual event deleted!"));
      }
    } else if (type === "custom") {
      const list = getCustomEvents();
      const idx = list.findIndex(
        (e) => e.name === item.name && e.date === item.date
      );
      if (idx !== -1) {
        list.splice(idx, 1);
        saveCustomEvents(list);
        showAlertMsg(t("alert_event_deleted", "Event deleted!"));
      }
    }
  }

  function toggleCountdown(type, item) {
    if (type === "birthday") {
      const list = getBirthdays();
      const idx = list.findIndex(
        (b) => b.name === item.name && b.birthday === item.birthday
      );
      if (idx !== -1) {
        list[idx].countdown = !list[idx].countdown;
        saveBirthdays(list);
      }
    } else if (type === "annual") {
      const list = getAnnualEvents();
      const idx = list.findIndex(
        (e) => e.name === item.name && e.date === item.date
      );
      if (idx !== -1) {
        list[idx].countdown = !list[idx].countdown;
        saveAnnualEvents(list);
      }
    } else if (type === "custom") {
      const list = getCustomEvents();
      const idx = list.findIndex(
        (e) => e.name === item.name && e.date === item.date
      );
      if (idx !== -1) {
        list[idx].countdown = !list[idx].countdown;
        saveCustomEvents(list);
      }
    }
  }

  // --- Year Aggregation ---
  function getAllEventsForYear(year) {
    const targetYear = parseInt(year, 10) || (typeof dayjs === "function" ? dayjs().year() : new Date().getFullYear());
    const all = [];

    // 1. Birthdays
    getBirthdays().forEach((b) => {
      if (!b.birthday) return;
      const parts = b.birthday.split("/");
      if (parts.length < 2) return;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      all.push({
        type: "birthday",
        name: b.name,
        date: b.birthday,
        day,
        month,
        year: targetYear,
        displayDate: b.birthday,
        url: "",
        countdown: !!b.countdown,
        raw: b,
      });
    });

    // 2. Annual Events
    getAnnualEvents().forEach((e) => {
      if (!e.date) return;
      const parts = e.date.split("/");
      if (parts.length < 2) return;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      all.push({
        type: "annual",
        name: e.name,
        date: e.date,
        day,
        month,
        year: targetYear,
        displayDate: e.date,
        url: e.url || "",
        countdown: !!e.countdown,
        raw: e,
      });
    });

    // 3. Custom / Unique Events
    getCustomEvents().forEach((e) => {
      if (!e.date) return;
      const parts = e.date.split("/");
      if (parts.length < 3) return;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const yr = parseInt(parts[2], 10);
      if (yr === targetYear) {
        all.push({
          type: "custom",
          name: e.name,
          date: e.date,
          day,
          month,
          year: yr,
          displayDate: e.date,
          url: e.url || "",
          countdown: !!e.countdown,
          raw: e,
        });
      }
    });

    // Sort chronologically by month, then day, then name
    all.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.name.localeCompare(b.name);
    });

    return all;
  }

  // --- Overlay / Popup UI ---
  function closeOverlay() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    const wrapper = document.getElementById("eventsOverlayWrapper");
    if (wrapper) wrapper.remove();
  }

  function showOverlay(initialYear) {
    closeOverlay();

    abortController = new AbortController();
    const { signal } = abortController;

    let selectedYear = parseInt(initialYear, 10) || (typeof dayjs === "function" ? dayjs().year() : new Date().getFullYear());
    let currentType = "birthday";
    let editingState = null; // { type, raw }

    const monthNames = getMonthNames();

    const overlayHTML = `
      <div class="events-overlay" id="eventsOverlay">
        <div class="events-overlay-header">
          <h4 class="text-white m-0">
            <i class="bi bi-calendar-event"></i> <span data-i18n="header_manage_events">${t("header_manage_events", "Manage Events")}</span>
          </h4>
          <button type="button" id="closeEventsOverlayBtn" class="events-overlay-close" aria-label="Close">&times;</button>
        </div>

        <div class="events-overlay-body">
          <!-- ADD / EDIT SECTION -->
          <div class="card bg-dark text-white border-secondary p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="m-0 text-info fw-bold" id="formModeTitle">
                <i class="bi bi-plus-circle"></i> <span data-i18n="btn_add_event">${t("btn_add_event", "Add Event")}</span>
              </h6>
              <button type="button" id="btnCancelEdit" class="btn btn-sm btn-outline-secondary d-none">
                <i class="bi bi-x-circle"></i> <span data-i18n="btn_cancel_edit">${t("btn_cancel_edit", "Cancel")}</span>
              </button>
            </div>

            <!-- TYPE SELECTOR -->
            <div class="events-type-selector mb-3" id="typeSelectorWrapper">
              <button type="button" class="btn btn-sm btn-info text-dark fw-bold events-type-btn" data-type="birthday">
                🎈 <span data-i18n="type_birthday">${t("type_birthday", "Birthday")}</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning events-type-btn" data-type="annual">
                🔁 <span data-i18n="type_annual">${t("type_annual", "Annual Event")}</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-success events-type-btn" data-type="custom">
                📅 <span data-i18n="type_unique">${t("type_unique", "Unique Event")}</span>
              </button>
            </div>

            <!-- FORM -->
            <form id="overlayEventForm" class="row g-2 align-items-end">
              <!-- Name Input -->
              <div class="col-md-5">
                <label class="form-label text-light mb-1 small" data-i18n="label_name">${t("label_name", "Name")}</label>
                <input type="text" id="evInputName" class="form-control bg-dark text-white border-secondary" placeholder="Event or Person Name" required />
              </div>

              <!-- Birthday / Annual Date Selectors (Month + Day) -->
              <div class="col-md-4" id="evMonthDayGroup">
                <div class="row g-2">
                  <div class="col-7">
                    <label class="form-label text-light mb-1 small" data-i18n="label_month">${t("label_month", "Month")}</label>
                    <select id="evSelectMonth" class="form-select bg-dark text-white border-secondary">
                      ${monthNames.map((name, i) => `<option value="${(i + 1).toString().padStart(2, "0")}">${name}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-5">
                    <label class="form-label text-light mb-1 small" data-i18n="label_day">${t("label_day", "Day")}</label>
                    <select id="evSelectDay" class="form-select bg-dark text-white border-secondary"></select>
                  </div>
                </div>
              </div>

              <!-- Custom / Unique Date Input (YYYY-MM-DD) -->
              <div class="col-md-4 d-none" id="evCustomDateGroup">
                <label class="form-label text-light mb-1 small" data-i18n="label_date">${t("label_date", "Date")}</label>
                <input type="date" id="evInputDate" class="form-control bg-dark text-white border-secondary" />
              </div>

              <!-- URL Input (shown for annual and unique) -->
              <div class="col-md-3 d-none" id="evUrlGroup">
                <label class="form-label text-light mb-1 small" data-i18n="label_url_optional">${t("label_url_optional", "URL (Optional)")}</label>
                <input type="url" id="evInputUrl" class="form-control bg-dark text-white border-secondary" placeholder="https://..." />
              </div>

              <!-- Countdown Checkbox -->
              <div class="col-12 mt-2">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="evCheckCountdown" />
                  <label class="form-check-label text-light small" for="evCheckCountdown" data-i18n="label_countdown_enable">
                    ${t("label_countdown_enable", "Show countdown reminder")}
                  </label>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="col-12 mt-3">
                <button type="submit" id="btnSubmitEvent" class="btn btn-success w-100">
                  <i class="bi bi-plus-lg"></i> <span id="btnSubmitText" data-i18n="btn_add_event">${t("btn_add_event", "Add Event")}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- YEAR SELECTOR & CHRONOLOGICAL LIST -->
          <div>
            <div class="events-year-controls mb-3">
              <button type="button" id="btnPrevYear" class="btn btn-sm btn-outline-light">
                <i class="bi bi-chevron-left"></i>
              </button>
              <h5 class="m-0 text-white fw-bold">
                <i class="bi bi-calendar3"></i> <span id="displayYearText">${selectedYear}</span>
              </h5>
              <button type="button" id="btnNextYear" class="btn btn-sm btn-outline-light">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <!-- LIST CONTAINER -->
            <div id="eventsListContainer" class="d-flex flex-column gap-2 pb-4"></div>
          </div>
        </div>
      </div>
    `;

    // Dismiss any active tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      if (window.bootstrap && bootstrap.Tooltip) {
        const tip = bootstrap.Tooltip.getInstance(el);
        if (tip) tip.hide();
      }
    });

    const wrapper = document.createElement("div");
    wrapper.id = "eventsOverlayWrapper";
    wrapper.innerHTML = overlayHTML;
    document.body.appendChild(wrapper);

    // Elements
    const overlay = document.getElementById("eventsOverlay");
    const closeBtn = document.getElementById("closeEventsOverlayBtn");
    const form = document.getElementById("overlayEventForm");
    const formModeTitle = document.getElementById("formModeTitle");
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    const btnSubmitEvent = document.getElementById("btnSubmitEvent");
    const btnSubmitText = document.getElementById("btnSubmitText");

    const inputName = document.getElementById("evInputName");
    const monthGroup = document.getElementById("evMonthDayGroup");
    const selectMonth = document.getElementById("evSelectMonth");
    const selectDay = document.getElementById("evSelectDay");
    const customDateGroup = document.getElementById("evCustomDateGroup");
    const inputDate = document.getElementById("evInputDate");
    const urlGroup = document.getElementById("evUrlGroup");
    const inputUrl = document.getElementById("evInputUrl");
    const checkCountdown = document.getElementById("evCheckCountdown");

    const displayYearText = document.getElementById("displayYearText");
    const btnPrevYear = document.getElementById("btnPrevYear");
    const btnNextYear = document.getElementById("btnNextYear");
    const listContainer = document.getElementById("eventsListContainer");
    const typeButtons = document.querySelectorAll(".events-type-btn");

    function updateDayOptions(selectedVal) {
      const m = selectMonth.value;
      const max = getMaxDays(m);
      selectDay.innerHTML = "";
      for (let i = 1; i <= max; i++) {
        const dStr = i.toString().padStart(2, "0");
        const opt = document.createElement("option");
        opt.value = dStr;
        opt.textContent = i;
        selectDay.appendChild(opt);
      }
      if (selectedVal && parseInt(selectedVal, 10) <= max) {
        selectDay.value = selectedVal.toString().padStart(2, "0");
      }
    }

    function setFormType(type) {
      currentType = type;
      typeButtons.forEach((btn) => {
        const bType = btn.dataset.type;
        if (bType === type) {
          if (bType === "birthday") {
            btn.className = "btn btn-sm btn-info text-dark fw-bold events-type-btn";
          } else if (bType === "annual") {
            btn.className = "btn btn-sm btn-warning text-dark fw-bold events-type-btn";
          } else {
            btn.className = "btn btn-sm btn-success text-white fw-bold events-type-btn";
          }
        } else {
          if (bType === "birthday") btn.className = "btn btn-sm btn-outline-info events-type-btn";
          else if (bType === "annual") btn.className = "btn btn-sm btn-outline-warning events-type-btn";
          else btn.className = "btn btn-sm btn-outline-success events-type-btn";
        }
      });

      if (type === "birthday") {
        monthGroup.classList.remove("d-none");
        customDateGroup.classList.add("d-none");
        inputDate.required = false;
        urlGroup.classList.add("d-none");
      } else if (type === "annual") {
        monthGroup.classList.remove("d-none");
        customDateGroup.classList.add("d-none");
        inputDate.required = false;
        urlGroup.classList.remove("d-none");
      } else if (type === "custom") {
        monthGroup.classList.add("d-none");
        customDateGroup.classList.remove("d-none");
        inputDate.required = true;
        urlGroup.classList.remove("d-none");
      }
    }

    function resetForm() {
      editingState = null;
      form.reset();
      selectMonth.value = "01";
      updateDayOptions("01");
      setFormType("birthday");

      formModeTitle.innerHTML = `<i class="bi bi-plus-circle"></i> ${t("btn_add_event", "Add Event")}`;
      formModeTitle.className = "m-0 text-info fw-bold";
      btnSubmitEvent.className = "btn btn-success w-100";
      btnSubmitText.textContent = t("btn_add_event", "Add Event");
      btnCancelEdit.classList.add("d-none");
    }

    function startEdit(item) {
      editingState = item;
      setFormType(item.type);

      inputName.value = item.name;
      checkCountdown.checked = !!item.countdown;

      if (item.type === "birthday" || item.type === "annual") {
        const mStr = item.month.toString().padStart(2, "0");
        const dStr = item.day.toString().padStart(2, "0");
        selectMonth.value = mStr;
        updateDayOptions(dStr);
        selectDay.value = dStr;
        inputUrl.value = item.url || "";
      } else if (item.type === "custom") {
        // Form input requires YYYY-MM-DD
        const mStr = item.month.toString().padStart(2, "0");
        const dStr = item.day.toString().padStart(2, "0");
        inputDate.value = `${item.year}-${mStr}-${dStr}`;
        inputUrl.value = item.url || "";
      }

      formModeTitle.innerHTML = `<i class="bi bi-pencil-square"></i> ${t("btn_save_changes", "Save Changes")}`;
      formModeTitle.className = "m-0 text-warning fw-bold";
      btnSubmitEvent.className = "btn btn-primary w-100";
      btnSubmitText.textContent = t("btn_save_changes", "Save Changes");
      btnCancelEdit.classList.remove("d-none");

      overlay.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderEventsList() {
      displayYearText.textContent = selectedYear;
      listContainer.innerHTML = "";

      const events = getAllEventsForYear(selectedYear);

      if (events.length === 0) {
        listContainer.innerHTML = `
          <div class="text-center text-muted p-4 border border-secondary rounded">
            <i class="bi bi-calendar-x fs-2 d-block mb-2"></i>
            <span>${t("no_events_year", "No events found for this year.")}</span>
          </div>
        `;
        return;
      }

      events.forEach((ev) => {
        const card = document.createElement("div");
        card.className = `events-list-item type-${ev.type} card bg-dark text-white border-secondary p-3`;

        let typeBadge = "";
        if (ev.type === "birthday") {
          typeBadge = `<span class="badge bg-info text-dark"><i class="bi bi-balloon-fill"></i> ${t("type_birthday", "Birthday")}</span>`;
        } else if (ev.type === "annual") {
          typeBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-repeat"></i> ${t("type_annual", "Annual")}</span>`;
        } else {
          typeBadge = `<span class="badge bg-success text-white"><i class="bi bi-calendar-event"></i> ${t("type_unique", "Unique")}</span>`;
        }

        const countdownBadge = ev.countdown
          ? `<span class="badge bg-secondary text-light ms-1" title="${t("tooltip_countdown", "Countdown Active")}"><i class="bi bi-stopwatch"></i></span>`
          : "";

        const monthName = monthNames[ev.month - 1] || "";
        const formattedDateDisplay = `${ev.day} ${monthName}${ev.type === "custom" ? ` ${ev.year}` : ""}`;

        const nameDisplay = ev.url
          ? `<a href="${ev.url}" target="_blank" class="text-info text-decoration-none fw-bold">${ev.name} <i class="bi bi-box-arrow-up-right small"></i></a>`
          : `<span class="fw-bold">${ev.name}</span>`;

        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                ${typeBadge}
                ${countdownBadge}
                <span class="text-white-50 small"><i class="bi bi-calendar"></i> ${formattedDateDisplay} (${ev.displayDate})</span>
              </div>
              <div class="fs-6">${nameDisplay}</div>
            </div>
            <div class="d-flex gap-1">
              <button type="button" class="btn btn-sm btn-outline-warning btn-edit-ev" title="${t("btn_edit", "Edit")}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-ev" title="${t("btn_delete", "Delete")}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `;

        card.querySelector(".btn-edit-ev").addEventListener("click", () => startEdit(ev));
        card.querySelector(".btn-delete-ev").addEventListener("click", () => {
          if (confirm(t("confirm_delete_event", "Are you sure you want to delete this event?"))) {
            deleteEvent(ev.type, ev.raw);
            if (editingState && editingState.raw === ev.raw) {
              resetForm();
            }
            renderEventsList();
          }
        });

        listContainer.appendChild(card);
      });
    }

    // Event Listeners
    typeButtons.forEach((btn) => {
      btn.addEventListener("click", () => setFormType(btn.dataset.type));
    });

    selectMonth.addEventListener("change", () => {
      updateDayOptions(selectDay.value);
    });

    btnPrevYear.addEventListener("click", () => {
      selectedYear--;
      renderEventsList();
    });

    btnNextYear.addEventListener("click", () => {
      selectedYear++;
      renderEventsList();
    });

    btnCancelEdit.addEventListener("click", () => {
      resetForm();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = inputName.value.trim();
      if (!name) return;

      const eventPayload = {
        name,
        month: selectMonth.value,
        day: selectDay.value,
        date: inputDate.value,
        url: inputUrl.value.trim(),
        countdown: checkCountdown.checked,
      };

      if (editingState) {
        updateEvent(editingState.type, editingState.raw, eventPayload);
      } else {
        addEvent(currentType, eventPayload);
      }

      resetForm();
      renderEventsList();
    });

    closeBtn.addEventListener("click", closeOverlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") closeOverlay();
      },
      { signal }
    );

    // Initial setup
    updateDayOptions("01");
    setFormType("birthday");
    renderEventsList();
  }

  // --- Table Renderers for Settings.html ---
  function renderBirthdaysTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";

    const birthdays = getBirthdays();
    const sorted = [...birthdays].sort((a, b) => {
      if (typeof dayjs === "function") {
        return dayjs(a.birthday, "DD/MM").dayOfYear() - dayjs(b.birthday, "DD/MM").dayOfYear();
      }
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((bday) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${bday.birthday}</td>
        <td>${bday.name}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-${bday.countdown ? "warning" : "outline-warning"} me-1 btn-toggle-cd" title="${t("tooltip_countdown", "Toggle Countdown")}"><i class="bi bi-stopwatch"></i></button>
          <button class="btn btn-sm btn-danger btn-del-bday"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tr.querySelector(".btn-toggle-cd").addEventListener("click", () => {
        toggleCountdown("birthday", bday);
        renderBirthdaysTable(tbodyId);
      });
      tr.querySelector(".btn-del-bday").addEventListener("click", () => {
        if (confirm(t("confirm_delete_event", "Are you sure you want to delete this event?"))) {
          deleteEvent("birthday", bday);
          renderBirthdaysTable(tbodyId);
        }
      });
      tbody.appendChild(tr);
    });
  }

  function renderAnnualEventsTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";

    const annualEvents = getAnnualEvents();
    const sorted = [...annualEvents].sort((a, b) => {
      if (typeof dayjs === "function") {
        return dayjs(a.date, "DD/MM").dayOfYear() - dayjs(b.date, "DD/MM").dayOfYear();
      }
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((evt) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${evt.date}</td>
        <td>${evt.name}</td>
        <td>${evt.url ? `<a href="${evt.url}" target="_blank" class="text-info"><i class="bi bi-link-45deg"></i> Link</a>` : "-"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-${evt.countdown ? "warning" : "outline-warning"} me-1 btn-toggle-cd" title="${t("tooltip_countdown", "Toggle Countdown")}"><i class="bi bi-stopwatch"></i></button>
          <button class="btn btn-sm btn-danger btn-del-annual"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tr.querySelector(".btn-toggle-cd").addEventListener("click", () => {
        toggleCountdown("annual", evt);
        renderAnnualEventsTable(tbodyId);
      });
      tr.querySelector(".btn-del-annual").addEventListener("click", () => {
        if (confirm(t("confirm_delete_event", "Are you sure you want to delete this event?"))) {
          deleteEvent("annual", evt);
          renderAnnualEventsTable(tbodyId);
        }
      });
      tbody.appendChild(tr);
    });
  }

  function renderCustomEventsTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";

    const customEvents = getCustomEvents();
    const sorted = [...customEvents].sort((a, b) => {
      if (typeof dayjs === "function") {
        return dayjs(a.date, "DD/MM/YYYY") - dayjs(b.date, "DD/MM/YYYY");
      }
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((evt) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${evt.date}</td>
        <td>${evt.name}</td>
        <td>${evt.url ? `<a href="${evt.url}" target="_blank" class="text-info"><i class="bi bi-link-45deg"></i> Link</a>` : "-"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-${evt.countdown ? "warning" : "outline-warning"} me-1 btn-toggle-cd" title="${t("tooltip_countdown", "Toggle Countdown")}"><i class="bi bi-stopwatch"></i></button>
          <button class="btn btn-sm btn-danger btn-del-custom"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tr.querySelector(".btn-toggle-cd").addEventListener("click", () => {
        toggleCountdown("custom", evt);
        renderCustomEventsTable(tbodyId);
      });
      tr.querySelector(".btn-del-custom").addEventListener("click", () => {
        if (confirm(t("confirm_delete_event", "Are you sure you want to delete this event?"))) {
          deleteEvent("custom", evt);
          renderCustomEventsTable(tbodyId);
        }
      });
      tbody.appendChild(tr);
    });
  }

  return {
    getBirthdays,
    saveBirthdays,
    getAnnualEvents,
    saveAnnualEvents,
    getCustomEvents,
    saveCustomEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleCountdown,
    getAllEventsForYear,
    showOverlay,
    closeOverlay,
    renderBirthdaysTable,
    renderAnnualEventsTable,
    renderCustomEventsTable,
  };
})();
