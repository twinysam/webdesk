window.OnboardingManager = {
  config: {
    name: "",
    birthday: "",
    lang: "en",
    selectedApps: [],
  },

  // Data for apps loaded from items.json
  catalog: [],

  // Loaded strings
  strings: {},

  init: async () => {
    // Check if profile exists
    if (localStorage.getItem("userProfile")) {
      return; // Already set up
    }

    // Detect Language
    const navLang = navigator.language || navigator.userLanguage;
    const langCode = navLang.startsWith("es") ? "es" : "en";
    OnboardingManager.config.lang = langCode;

    // Show Overlay Immediately (with empty text, or wait? Better show it to cover content)
    document.getElementById("onboarding-overlay").classList.remove("d-none");

    // Fetch Strings
    try {
        const response = await fetch(`locales/${langCode}.json`);
        if (!response.ok) throw new Error("Strings not found");
        const json = await response.json();
        OnboardingManager.strings = json.strings; // Store flat strings
        
        // Apply text now that we have it
        OnboardingManager.applyLang();
    } catch (e) {
        console.error("Onboarding: Failed to load strings", e);
        // Fallback? Or just let it be empty/English default if we had one. 
        // For now, assume fetch works.
    }
    
    // Setup Listeners
    OnboardingManager.setupStep1();
    
    // Load Apps for later
    console.log("Onboarding: Starting catalog fetch...");
    fetch("items.json")
       .then(res => {
           console.log("Onboarding: fetch status", res.status);
           if (!res.ok) throw new Error("HTTP " + res.status);
           return res.json();
       })
       .then(data => {
           console.log("Onboarding: Loaded catalog, items:", data.length);
           // Use raw order from JSON (user preference)
           OnboardingManager.catalog = data;
           // Pre-render now just in case
           console.log("Onboarding: Triggering pre-render of apps.");
           OnboardingManager.renderApps();
       })
       .catch(err => console.error("Error loading items.json:", err));
  },

  applyLang: () => {
    // Strings are now loaded directly into OnboardingManager.strings variable from fetch
    const txt = OnboardingManager.strings;
    if (!txt) return; // Not ready

    // Helper to safely get string
    const get = (k) => txt[`onboarding_${k}`] || "";

    document.getElementById("lbl-welcome").innerHTML = get("welcome");
    document.getElementById("hint-name").textContent = get("hint_name");
    
    const dobTitle = get("dob_title") || "";
    document.getElementById("lbl-dob-title").innerHTML = dobTitle.replace("{name}", ""); // Name comes later
    
    document.getElementById("hint-dob").textContent = get("hint_dob");
    document.getElementById("lbl-apps-title").innerHTML = get("apps_title");
    document.getElementById("hint-apps").textContent = get("hint_apps");
    document.getElementById("lbl-ready-1").innerHTML = get("ready_1");
    document.getElementById("lbl-ready-2").innerHTML = get("ready_2");
    document.getElementById("lbl-press-enter").textContent = get("press_enter");
    document.getElementById("link-import").textContent = get("been_here");
    document.getElementById("btn-import-reveal").textContent = get("import_btn");

    // Split Input Placeholders based on Lang
    const idx1 = document.getElementById("dob-1");
    const idx2 = document.getElementById("dob-2");

    if (l === "es") {
      idx1.placeholder = "DD";
      idx2.placeholder = "MM";
    } else {
      idx1.placeholder = "MM";
      idx2.placeholder = "DD";
    }
  },

  // --- STEP 1: NAME ---
  setupStep1: () => {
    const input = document.getElementById("ob-input-name");
    const hint = document.getElementById("hint-name");

    input.focus();

    // Hint timer
    let hintTimeout = setTimeout(() => {
      hint.classList.remove("hidden");
      hint.classList.add("fade-in");
      hint.classList.add("visible");
    }, 10000);

    input.addEventListener("input", (e) => {
      if (input.value.length >= 3) {
        hint.classList.remove("hidden");
        hint.classList.add("fade-in");
        hint.classList.add("visible");
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim().length > 0) {
        clearTimeout(hintTimeout);
        OnboardingManager.config.name = input.value.trim();
        OnboardingManager.goToStep2();
      }
    });
  },

  showImportButton: (e) => {
    e.preventDefault();
    document.getElementById("link-import").classList.add("d-none");
    const btn = document.getElementById("btn-import-reveal");
    btn.classList.remove("d-none");
  },

  triggerImport: () => {
    document.getElementById("importInput").click();
  },

  // --- STEP 2: DOB ---
  goToStep2: () => {
    document.getElementById("ob-pagination").innerText = "2/4";
    document.getElementById("step-name").classList.remove("active");
    document.getElementById("step-name").classList.add("prev");
    const step2 = document.getElementById("step-dob");
    step2.classList.add("active");

    // Name replacement
    const txt = OnboardingManager.strings;
    const title = txt["onboarding_dob_title"] || "";
    document.getElementById("lbl-dob-title").innerHTML = title.replace("{name}", OnboardingManager.config.name);

    // Focus first input
    const d1 = document.getElementById("dob-1");
    if (d1) setTimeout(() => d1.focus(), 600);
    
    // Hint Logic
    const hint = document.getElementById("hint-dob");
    let hintTimeout = setTimeout(() => {
        hint.classList.remove("hidden");
        hint.classList.add("fade-in");
        hint.classList.add("visible");
    }, 10000);

    const inputs = [
        document.getElementById("dob-1"),
        document.getElementById("dob-2"),
        document.getElementById("dob-3")
    ];

    inputs.forEach((input, idx) => {
        input.addEventListener("input", () => {
             // 1. Numbers only
             input.value = input.value.replace(/\D/g, "");

             // 2. Hint Logic
             clearTimeout(hintTimeout);
             hint.classList.remove("hidden");
             hint.classList.add("fade-in");
             hint.classList.add("visible");

             // 3. Auto Advance
             if (input.value.length >= input.maxLength) {
                  if (idx === 0) inputs[1].focus(); // dob-1 -> dob-2
                  if (idx === 1) inputs[2].focus(); // dob-2 -> dob-3
             }
        });

        // 4. Backspace Navigation
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && input.value.length === 0) {
                 if (idx === 1) inputs[0].focus();
                 if (idx === 2) inputs[1].focus();
            }
        });
    });

    document.getElementById("dob-3").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
             OnboardingManager.goToStep3();
        }
    });

    // Auto-focus logic already verified in previous turn
  },

  validateDate: (dateStr) => {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;

    const p1 = parts[0];
    const p2 = parts[1];
    const year = parts[2];

    if (year.length !== 4) return false;

    const isEs = OnboardingManager.config.lang === "es";

    let day, month;
    if (isEs) {
      day = p1;
      month = p2;
    } else {
      month = p1;
      day = p2;
    }

    // Check logical ranges
    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;

    const iso = `${year}-${month}-${day}`;
    const dob = new Date(iso);
    if (isNaN(dob.getTime())) return false;

    OnboardingManager.config.birthday = iso;
    return true;
  },

  // --- STEP 3: APPS ---
  goToStep3: () => {
    // 1. Capture and Save DOB
    const d1 = document.getElementById("dob-1").value;
    const d2 = document.getElementById("dob-2").value;
    const d3 = document.getElementById("dob-3").value;

    let day, month;
    if (OnboardingManager.config.lang === "es") {
        day = d1;
        month = d2;
    } else {
        month = d1;
        day = d2;
    }
    const year = d3;
    
    // Save standard ISO format
    OnboardingManager.config.birthday = `${year}-${month}-${day}`;

    // 2. Pagination & Transition
    document.getElementById("ob-pagination").innerText = "3/4";
    document.getElementById("step-dob").classList.remove("active");
    document.getElementById("step-dob").classList.add("prev");
    const step3 = document.getElementById("step-apps");
    step3.classList.add("active");

    // 3. Days Calculation for "Happy Xth day!"
    try {
        if (typeof dayjs !== 'undefined') {
            const birth = dayjs(OnboardingManager.config.birthday); // YYYY-MM-DD
            if (birth.isValid()) {
                const now = dayjs();
                const days = now.diff(birth, 'day');
                
                // Construct string
                const txt = OnboardingManager.strings;
                const happyTemplate = txt["onboarding_happy_days"] || "Happy {days}th day!";
                const happyMsg = happyTemplate.replace("{days}", days);
                
                // Combine with existing Title
                // We re-fetch the title just in case language changed or we need base
                const baseTitle = txt["onboarding_apps_title"] || "Which of these websites do you<br>often use?";
                
                const combinedHtml = `<span class="happy-days-msg">${happyMsg}</span>${baseTitle}`;
                
                document.getElementById("lbl-apps-title").innerHTML = combinedHtml;
            }
        }
    } catch (e) {
        console.error("Onboarding: Error calculating days", e);
    }

    console.log("Onboarding: Entered Step 3");

    // Check if rendered
    const list = document.getElementById("ob-apps-list");
    console.log("Onboarding: Apps List Element:", list);
    console.log(
      "Onboarding: Apps List Children Count:",
      list ? list.children.length : "N/A"
    );

    if (list && list.children.length === 0) {
      console.log("Onboarding: Apps list empty, calling renderApps()");
      OnboardingManager.renderApps();
    }

    // Hint logic
    const hint = document.getElementById("hint-apps");
    OnboardingManager._appHintTimeout = setTimeout(() => {
      hint.classList.remove("hidden");
      hint.classList.add("fade-in");
      hint.classList.add("visible");
    }, 30000);

    // Listen for Enter globally on this step, BUT DELAY IT
    // to prevent the Enter form Step 2 from triggering this immediately.
    setTimeout(() => {
      document.addEventListener("keydown", OnboardingManager._appsKeyHandler);
      console.log("Onboarding: Step 3 Listeners active");
    }, 500);

    // --- INFINITE AUTO SCROLL ---
    const scrollContainer = document.querySelector(".apps-carousel-wrapper");
    const listContainer = document.getElementById("ob-apps-list");

    if (scrollContainer && listContainer) {
      // 1. Clone items for seamless loop
      // We clone the children once and append them
      const originalChildren = Array.from(listContainer.children);
      originalChildren.forEach((child) => {
        listContainer.appendChild(child.cloneNode(true));
      });

      // 2. Auto Scroll Logic
      let scrollSpeed = 1; // Pixels per frame
      let scrollAccumulator = 0; // To handle sub-pixel speeds
      let isHovered = false;
      let isDragging = false;
      let startX;
      let scrollLeft;
      let animationId;

      const autoScroll = () => {
        // Loop logic: if we've scrolled past the first set (halfway), reset to 0
        // We use scrollWidth / 2 assuming exact cloning
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
          scrollAccumulator = 0;
        }

        if (!isHovered && !isDragging) {
          scrollAccumulator += scrollSpeed;
          if (scrollAccumulator >= 1) {
            const wholePixels = Math.floor(scrollAccumulator);
            scrollContainer.scrollLeft += wholePixels;
            scrollAccumulator -= wholePixels;
          }
        }

        animationId = requestAnimationFrame(autoScroll);
      };

      // Start
      animationId = requestAnimationFrame(autoScroll);

      // 3. Pause on Hover
      scrollContainer.addEventListener("mousemove", () => {
        isHovered = true;
      });
      scrollContainer.addEventListener("mouseleave", () => {
        isHovered = false;
        isDragging = false; 
      });

      // 4. Mouse Wheel Override
      scrollContainer.addEventListener(
        "wheel",
        (evt) => {
          evt.preventDefault();
          scrollContainer.scrollLeft += evt.deltaY;
          scrollAccumulator = 0;
        },
        { passive: false }
      );

      // 5. Drag to Scroll
      scrollContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        isHovered = true; // Auto-pause while dragging
        scrollContainer.style.cursor = 'grabbing';
        startX = e.pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
      });

      scrollContainer.addEventListener('mouseup', () => {
        isDragging = false;
        scrollContainer.style.cursor = 'grab';
      });

      scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) {
             isHovered = true; // Still hover even if not dragging
             return;
        } 
        e.preventDefault();
        const x = e.pageX - scrollContainer.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast factor
        scrollContainer.scrollLeft = scrollLeft - walk;
        scrollAccumulator = 0; // Reset smooth scroll
      });
      
      // Set initial cursor
      scrollContainer.style.cursor = 'grab';
    }
  },

  _appsKeyHandler: (e) => {
    if (e.key === "Enter") {
      document.removeEventListener(
        "keydown",
        OnboardingManager._appsKeyHandler
      );
      clearTimeout(OnboardingManager._appHintTimeout);
      OnboardingManager.goToStep4();
    }
  },

  renderApps: () => {
    const container = document.getElementById("ob-apps-list");
    if (!container) {
      console.error("Onboarding: #ob-apps-list layout missing");
      return;
    }

    container.innerHTML = "";

    console.log(
      "Onboarding: Rendering",
      OnboardingManager.catalog.length,
      "apps"
    );

    // Load CSS based icons
    OnboardingManager.catalog.forEach((app) => {
      // We render a div that MIMICS the 'a' tag structure from style.css
      // .item a.icon-name

      const iconEl = document.createElement("div");

      // Container to trick the CSS selector
      const wrapper = document.createElement("div");
      wrapper.className = "item ob-item-wrapper";

      const link = document.createElement("a");
      link.className = `ob-app-item ${app.icon}`; // 'ob-app-item' sets size, 'app.icon' sets bg image from app-icons.css

      // Tooltip attributes
      link.setAttribute("data-bs-toggle", "tooltip");
      link.setAttribute("data-bs-placement", "top");
      link.setAttribute("title", app.title || app.name);

      // Data attribute for syncing clones
      link.setAttribute("data-app-name", app.name);

      link.onclick = (e) => {
        e.preventDefault();
        OnboardingManager.toggleApp(app, link);
      };

      wrapper.appendChild(link);
      container.appendChild(wrapper);
    });

    // Initialize Tooltips
    // Check if bootstrap exists
    if (typeof bootstrap !== "undefined") {
      const tooltipTriggerList = [].slice.call(
        container.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
          trigger: "hover",
          container: "#onboarding-overlay", // APPEND TO OVERLAY so z-index works (since overlay is 9999)
        });
      });
    }

    console.log("Onboarding: Rendering complete");
  },

  toggleApp: (app, element) => {
    // Logic for toggle needs to handle finding the index by name, which works.
    // But visually, if we have clones, we might need to update BOTH the original and the clone
    // so visual state stays in sync if the user scrolls around.
    // Or simple solution: Just toggle the class on the clicked element.
    // BETTER: Find ALL instances of this app card in the DOM and toggle them.

    const idx = OnboardingManager.config.selectedApps.findIndex(
      (a) => a.name === app.name
    );
    const isSelected = idx > -1;

    // Update data model
    if (isSelected) {
      OnboardingManager.config.selectedApps.splice(idx, 1);
    } else {
      OnboardingManager.config.selectedApps.push({ name: app.name });
    }

    // Update UI (Sync duplicates)
    const allInstances = document.querySelectorAll(
      `.ob-app-item[data-app-name="${app.name}"]`
    );
    allInstances.forEach((el) => {
      if (isSelected) {
        el.classList.remove("selected");
      } else {
        el.classList.add("selected");
      }
    });

    if (OnboardingManager.config.selectedApps.length >= 5) {
      const hint = document.getElementById("hint-apps");
      clearTimeout(OnboardingManager._appHintTimeout);
      hint.classList.remove("hidden");
      hint.classList.add("fade-in");
      hint.classList.add("visible");
    }
  },

  // --- STEP 4: READY ---
  goToStep4: () => {
      document.getElementById("ob-pagination").innerText = "4/4";
      document.getElementById("step-apps").classList.remove("active");
      document.getElementById("step-apps").classList.add("prev");
      const step4 = document.getElementById("step-ready");
      step4.classList.add("active");
      
      document.addEventListener("keydown", OnboardingManager._finishKeyHandler);
  },

  _finishKeyHandler: (e) => {
    if (e.key === "Enter") {
      document.removeEventListener(
        "keydown",
        OnboardingManager._finishKeyHandler
      );
      OnboardingManager.finish();
    }
  },

  finish: () => {
    const { name, birthday, lang, selectedApps } = OnboardingManager.config;

    // Save Config
    const config = {
      order: selectedApps.map((a) => a.name),
      hidden: [],
      filters: { hideNeverClicked: false, minClicks: 0 },
    };

    localStorage.setItem("myApps", JSON.stringify(selectedApps));
    localStorage.setItem("appConfig", JSON.stringify(config));

    // Save Config
    const profile = {
      name: OnboardingManager.config.name,
      birthday: OnboardingManager.config.birthday, // YYYY-MM-DD
      lang: OnboardingManager.config.lang,
      // Infer and store hemisphere preference permanently
      hemisphere: typeof DateUtils !== 'undefined' ? DateUtils.detectHemisphere() : 'southern'
    };

    localStorage.setItem("userProfile", JSON.stringify(profile));
    localStorage.setItem("userLang", OnboardingManager.config.lang);

    // Save Profile
    ProfileManager.setProfile(name, birthday, lang);
  },

  handleImport: (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Use shared BackupManager for consistent import
        // (handles all 9 keys, cache regeneration, and first-time-user flags)
        BackupManager.importData(data);

        // Fallback: if backup had no profile, create a minimal one
        if (!data.profile) {
          ProfileManager.setProfile("User", "1985-10-17", "en");
        }

        location.reload();
      } catch (err) {
        alert("Error importing: " + err.message);
      }
    };
    reader.readAsText(file);
  },
};

// Initialize onboarding when DOM is ready (if profile is not set)
document.addEventListener("DOMContentLoaded", () => {
  if (window.isMobileBlocked) return;
  OnboardingManager.init();
});
