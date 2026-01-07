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
           OnboardingManager.catalog = data.sort((a,b) => a.name.localeCompare(b.name));
           // Pre-render now just in case
           console.log("Onboarding: Triggering pre-render of apps.");
           OnboardingManager.renderApps();
       })
       .catch(err => console.error("Error loading items.json:", err));
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
        hint.classList.add("visible");
    }, 10000);

    input.addEventListener("input", (e) => {
        if (input.value.length >= 3) {
            hint.classList.remove("hidden");
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
        hint.classList.add("visible");
    }, 30000);
    
    // Listen for Enter globally on this step, BUT DELAY IT
    // to prevent the Enter form Step 2 from triggering this immediately.
    setTimeout(() => {
        document.addEventListener("keydown", OnboardingManager._appsKeyHandler);
        console.log("Onboarding: Step 3 Listeners active");
    }, 500);
  },

  _appsKeyHandler: (e) => {
      if (e.key === "Enter") {
          document.removeEventListener("keydown", OnboardingManager._appsKeyHandler);
          clearTimeout(OnboardingManager._appHintTimeout);
          OnboardingManager.goToStep4();
      }
  },

  renderApps: () => {
      console.log("Onboarding: renderApps called");
      const container = document.getElementById("ob-apps-list");
      if (!container) {
          console.error("Onboarding: #ob-apps-list layout missing");
          return;
      }
      
      container.innerHTML = "";
      
      if (OnboardingManager.catalog.length === 0) {
          console.warn("Onboarding: renderApps called but catalog is empty");
          container.innerHTML = "<div>Loading apps...</div>";
          return;
      }
      
      console.log("Onboarding: Rendering", OnboardingManager.catalog.length, "apps");
      
      
      OnboardingManager.catalog.forEach(app => {
          const card = document.createElement("div");
          card.className = "app-card";
          card.onclick = () => OnboardingManager.toggleApp(app, card);
          
          const img = document.createElement("img");
          const iconBase = app.icon || "default";
          
          // Strategy: Try common formats with 'app_' prefix in 'images/' folder
          // We set the first guess. If it fails, the onerror handler tries the next.
          const candidates = [
              `images/app_${iconBase}.png`,
              `images/app_${iconBase}.webp`,
              `images/app_${iconBase}.jpg`,
              `images/app_${iconBase}.svg`,
              `images/${iconBase}.png` // Fallback to non-prefixed
          ];
          
          const tryLoad = (sources) => {
              if (sources.length === 0) {
                  // Final fallback
                  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' fill='rgba(0,0,0,0.2)'/%3E%3C/svg%3E";
                  return;
              }
              const next = sources.shift();
              img.src = next;
              img.onerror = () => tryLoad(sources);
          };
          
          tryLoad(candidates);
          card.appendChild(img);
          
          container.appendChild(card);
      });
      console.log("Onboarding: Rendering complete");
  },

  toggleApp: (app, card) => {
      const idx = OnboardingManager.config.selectedApps.findIndex(a => a.name === app.name);
      if (idx > -1) {
          OnboardingManager.config.selectedApps.splice(idx, 1);
          card.classList.remove("selected");
      } else {
          OnboardingManager.config.selectedApps.push({name: app.name});
          card.classList.add("selected");
      }

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
