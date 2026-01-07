window.OnboardingManager = {
  config: {
    name: "",
    birthday: "",
    lang: "en",
    selectedApps: []
  },
  
  // Data for apps loaded from items.json
  catalog: [],
  
  // Language Map
  strings: {
    en: {
      welcome: "Hi!<br>What's your name?",
      hint_name: "Let us know what we should call you. Hit ENTER when done.",
      dob_title: "Hey, {name}<br>What's your birthdate?",
      hint_dob: "We’ll tell you how many days you’ve been on this planet. Hit ENTER when done.",
      apps_title: "Which of these websites do you<br>often use?",
      hint_apps: "You can pick more later. Hit ENTER when done.",
      ready_1: "Your web desk is ready! Besides having quick access to your most used websites, you'll be able to add your own links, add birthdays and other reminders.",
      ready_2: "This is meant to be your starting point on the web and it works best <strong>if you pin this tab</strong>.",
      press_enter: "Press ENTER to see your desk.",
      been_here: "Been here before?",
      import_btn: "Import Backup"
    },
    es: {
      welcome: "¡Hola!<br>¿Cómo te llamas?",
      hint_name: "Dinos cómo deberíamos llamarte. Presiona ENTER al terminar.",
      dob_title: "Hola, {name}<br>¿Cuándo naciste?",
      hint_dob: "Te diremos cuántos días has estado en este planeta. Presiona ENTER al terminar.",
      apps_title: "¿Cuáles de estos sitios usas<br>frecuentemente?",
      hint_apps: "Podrás elegir más tarde. Presiona ENTER al terminar.",
      ready_1: "¡Tu escritorio está listo! Además de acceso rápido a tus sitios favoritos, podrás añadir tus enlaces, cumpleaños y recordatorios.",
      ready_2: "Este será tu punto de partida en la web y funciona mejor <strong>si fijas esta pestaña</strong>.",
      press_enter: "Presiona ENTER para ver tu escritorio.",
      been_here: "¿Ya has estado aquí?",
      import_btn: "Importar Copia"
    }
  },

  init: async () => {
    // Check if profile exists
    if (localStorage.getItem("userProfile")) {
      return; // Already set up
    }

    // Detect Language
    const navLang = navigator.language || navigator.userLanguage;
    OnboardingManager.config.lang = navLang.startsWith("es") ? "es" : "en";
    
    // Apply initial text
    OnboardingManager.applyLang();

    // Show Overlay
    document.getElementById("onboarding-overlay").classList.remove("d-none");
    
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

  // ... (inside renderApps loop) ...
  
  renderApps: () => {
      const container = document.getElementById("ob-apps-list");
      if (!container) return;
      
      container.innerHTML = "";
      
      console.log("Onboarding: Rendering", OnboardingManager.catalog.length, "apps");
      
      // Load CSS based icons
      OnboardingManager.catalog.forEach(app => {
          // Wrapper
          const wrapper = document.createElement("div");
          wrapper.className = "item"; 
          wrapper.style.display = "inline-block";
          wrapper.style.width = "auto";
          wrapper.style.height = "auto";
          wrapper.style.margin = "0";
          wrapper.style.float = "none";
          
          const link = document.createElement("a");
          link.className = `ob-app-item ${app.icon}`;
          
          // Tooltip attributes
          link.setAttribute("data-bs-toggle", "tooltip");
          link.setAttribute("data-bs-placement", "top"); // Top works better for bottom ticker
          link.setAttribute("title", app.name); // Use name or title
          
          link.onclick = (e) => {
              e.preventDefault();
              OnboardingManager.toggleApp(app, link);
          };
          
          wrapper.appendChild(link);
          container.appendChild(wrapper);
      });
      
      // Initialize Tooltips for these new elements
      const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });

      console.log("Onboarding: Rendering complete");
  },

  applyLang: () => {
    const l = OnboardingManager.config.lang;
    const txt = OnboardingManager.strings[l];

    document.getElementById("lbl-welcome").innerHTML = txt.welcome;
    document.getElementById("hint-name").textContent = txt.hint_name;
    document.getElementById("lbl-dob-title").innerHTML = txt.dob_title.replace("{name}", ""); // Name comes later
    document.getElementById("hint-dob").textContent = txt.hint_dob;
    document.getElementById("lbl-apps-title").innerHTML = txt.apps_title;
    document.getElementById("hint-apps").textContent = txt.hint_apps;
    document.getElementById("lbl-ready-1").innerHTML = txt.ready_1;
    document.getElementById("lbl-ready-2").innerHTML = txt.ready_2;
    document.getElementById("lbl-press-enter").textContent = txt.press_enter;
    document.getElementById("link-import").textContent = txt.been_here;
    document.getElementById("btn-import-reveal").textContent = txt.import_btn;
    
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

  // --- STEP 2: DOB (Split) ---
  goToStep2: () => {
    // Transition
    document.getElementById("step-name").classList.remove("active");
    document.getElementById("step-name").classList.add("prev");
    const step2 = document.getElementById("step-dob");
    step2.classList.add("active");
    
    // Name replacement
    const l = OnboardingManager.config.lang;
    const txt = OnboardingManager.strings[l];
    document.getElementById("lbl-dob-title").innerHTML = txt.dob_title.replace("{name}", OnboardingManager.config.name);

    // Focus first input
    const d1 = document.getElementById("dob-1");
    const d2 = document.getElementById("dob-2");
    const d3 = document.getElementById("dob-3");
    
    d1.value = ""; d2.value = ""; d3.value = "";
    d1.focus();

    // Hint Logic
    const hint = document.getElementById("hint-dob");
    let hintTimeout = setTimeout(() => {
        hint.classList.remove("hidden");
        hint.classList.add("fade-in");
        hint.classList.add("visible");
    }, 10000);

    // Setup Listeners for all 3 inputs
    [d1, d2, d3].forEach((input, idx) => {
        input.addEventListener("input", (e) => {
             // Basic nums only
             input.value = input.value.replace(/\D/g, '');
             
             // Auto Advance
             if (input.value.length >= input.maxLength) {
                 if (idx === 0) d2.focus();
                 if (idx === 1) d3.focus();
             }
             
             // Show hint early on interaction
             hint.classList.remove("hidden");
             hint.classList.add("fade-in");
             hint.classList.add("visible");
        });

        input.addEventListener("keydown", (e) => {
            // Backspace Navigation
            if (e.key === "Backspace" && input.value.length === 0) {
                if (idx === 1) d1.focus();
                if (idx === 2) d2.focus();
            }
            
            // Enter to Submit
            if (e.key === "Enter") {
                // Collect full date
                let v1 = d1.value, v2 = d2.value, v3 = d3.value;
                // Basic pad
                if (v1.length === 1) v1 = "0" + v1;
                if (v2.length === 1) v2 = "0" + v2;
                
                const combined = `${v1}/${v2}/${v3}`;
                
                if (OnboardingManager.validateDate(combined)) {
                     clearTimeout(hintTimeout);
                     OnboardingManager.goToStep3();
                } else {
                     d1.style.borderBottomColor = "red";
                     d2.style.borderBottomColor = "red";
                     d3.style.borderBottomColor = "red";
                     setTimeout(() => {
                         d1.style.borderBottomColor = "#555";
                         d2.style.borderBottomColor = "#555";
                         d3.style.borderBottomColor = "#555";
                     }, 500);
                }
            }
        });
    });
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
          day = p1; month = p2;
      } else {
          month = p1; day = p2;
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
    document.getElementById("step-dob").classList.remove("active");
    document.getElementById("step-dob").classList.add("prev");
    const step3 = document.getElementById("step-apps");
    step3.classList.add("active");
    
    console.log("Onboarding: Entered Step 3");
    
    // Check if rendered
    const list = document.getElementById("ob-apps-list");
    console.log("Onboarding: Apps List Element:", list);
    console.log("Onboarding: Apps List Children Count:", list ? list.children.length : "N/A");
    
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
        originalChildren.forEach(child => {
            listContainer.appendChild(child.cloneNode(true));
        });

        // 2. Auto Scroll Logic
        let scrollSpeed = 0.5; // Pixels per frame (Slower)
        let scrollAccumulator = 0; // To handle sub-pixel speeds
        let isHovered = false;
        let animationId;

        const autoScroll = () => {
             // Loop logic: if we've scrolled past the first set (halfway), reset to 0
             // We use scrollWidth / 2 assuming exact cloning
             if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
                 scrollContainer.scrollLeft = 0;
                 scrollAccumulator = 0;
             }

             if (!isHovered) {
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
        // CHANGE: Use mousemove to detect *active* movement, ignoring if cursor was already there initially.
        scrollContainer.addEventListener("mousemove", () => { isHovered = true; });
        scrollContainer.addEventListener("mouseleave", () => { isHovered = false; });
        
        // 4. Mouse Wheel Override (works even while paused)
        scrollContainer.addEventListener("wheel", (evt) => {
            evt.preventDefault();
            scrollContainer.scrollLeft += evt.deltaY;
            // Force reset accumulator so auto-scroll doesn't jerk after manual
            scrollAccumulator = 0;
        }, { passive: false });
    }
  },

  _appsKeyHandler: (e) => {
      if (e.key === "Enter") {
          document.removeEventListener("keydown", OnboardingManager._appsKeyHandler);
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
      
      console.log("Onboarding: Rendering", OnboardingManager.catalog.length, "apps");
      
      
      // Load CSS based icons
      OnboardingManager.catalog.forEach(app => {
          // We render a div that MIMICS the 'a' tag structure from style.css
          // .item a.icon-name
          
          const iconEl = document.createElement("div");
          
          // Container to trick the CSS selector
          const wrapper = document.createElement("div");
          wrapper.className = "item"; // This might pick up unwanted styles from style.css, reset them in onboarding.css if needed
          wrapper.style.display = "inline-block";
          wrapper.style.width = "auto";
          wrapper.style.height = "auto";
          wrapper.style.margin = "0";
          wrapper.style.float = "none";
          
          const link = document.createElement("a");
          link.className = `ob-app-item ${app.icon}`; // 'ob-app-item' sets size, 'app.icon' sets bg image from app-icons.css
          
          // Tooltip attributes
          link.setAttribute("data-bs-toggle", "tooltip");
          link.setAttribute("data-bs-placement", "top");
          link.setAttribute("title", app.title || app.name); 

          link.onclick = (e) => {
              e.preventDefault();
              OnboardingManager.toggleApp(app, link);
          };
          
          wrapper.appendChild(link);
          container.appendChild(wrapper);
      });
      
      // Initialize Tooltips
      // Check if bootstrap exists
      if (typeof bootstrap !== 'undefined') {
          const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
          tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover',
                container: '#onboarding-overlay' // APPEND TO OVERLAY so z-index works (since overlay is 9999)
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
      
      const idx = OnboardingManager.config.selectedApps.findIndex(a => a.name === app.name);
      const isSelected = idx > -1;
      
      // Update data model
      if (isSelected) {
          OnboardingManager.config.selectedApps.splice(idx, 1);
      } else {
          OnboardingManager.config.selectedApps.push({name: app.name});
      }

      // Update UI (Sync duplicates)
      const allInstances = document.querySelectorAll(`.ob-app-item[data-app-name="${app.name}"]`);
      allInstances.forEach(el => {
          if (isSelected) {
              el.classList.remove("selected");
          } else {
              el.classList.add("selected");
          }
      });

      if (OnboardingManager.config.selectedApps.length >= 5) {
          const hint = document.getElementById("hint-apps");
          hint.classList.remove("hidden");
          hint.classList.add("visible");
      }
  },

  // --- STEP 4: READY ---
  goToStep4: () => {
      document.getElementById("step-apps").classList.remove("active");
      document.getElementById("step-apps").classList.add("prev");
      const step4 = document.getElementById("step-ready");
      step4.classList.add("active");
      
      document.addEventListener("keydown", OnboardingManager._finishKeyHandler);
  },

  _finishKeyHandler: (e) => {
      if (e.key === "Enter") {
          document.removeEventListener("keydown", OnboardingManager._finishKeyHandler);
          OnboardingManager.finish();
      }
  },

  finish: () => {
      const { name, birthday, lang, selectedApps } = OnboardingManager.config;
      
      // Save Config
      const config = {
          order: selectedApps.map(a => a.name),
          hidden: [],
          filters: { hideNeverClicked: false, minClicks: 0 }
      };
      
      localStorage.setItem("myApps", JSON.stringify(selectedApps));
      localStorage.setItem("appConfig", JSON.stringify(config));
      
      // Save Profile
      ProfileManager.setProfile(name, birthday, lang);
  },

  handleImport: (event) => {
      // Reuse existing logic from previous version, just adapted
       const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
    
            if (data.stats) localStorage.setItem("clickStats", JSON.stringify(data.stats));
            if (data.config) localStorage.setItem("appConfig", JSON.stringify(data.config));
            if (data.customEvents) localStorage.setItem("customEvents", JSON.stringify(data.customEvents));
            if (data.myApps) localStorage.setItem("myApps", JSON.stringify(data.myApps));
            if (data.userLinks) localStorage.setItem("userLinks", JSON.stringify(data.userLinks));
            if (data.userBirthdays) localStorage.setItem("userBirthdays", JSON.stringify(data.userBirthdays));
    
            if (data.profile) {
              localStorage.setItem("userProfile", JSON.stringify(data.profile));
            } else {
              ProfileManager.setProfile("User", "1985-10-17", "en"); 
            }
            
            location.reload();
          } catch (err) {
            alert("Error importing: " + err.message);
          }
        };
        reader.readAsText(file);
  }
};

// Auto-init logic moved to index.html or main loop
document.addEventListener("DOMContentLoaded", () => {
   // Only start if not importing or something? 
   // Actually, webdesk.js loads stats and things.
   // We want this to run if profile is missing.
   OnboardingManager.init();
});
