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
    
    // Initial Ghost Mask setup
    const mask = l === "es" ? "DD/MM/AAAA" : "MM/DD/YYYY";
    // We don't set placeholder anymore, we update ghost
    OnboardingManager._dobMask = mask;
    OnboardingManager.updateDobGhost("");
  },

  updateDobGhost: (val) => {
      const ghost = document.getElementById("dob-ghost");
      const mask = OnboardingManager._dobMask; // "MM/DD/YYYY"
      
      if (!ghost) return;

      // Construct HTML: <span class="ghost-hidden">VAL</span>REST_OF_MASK
      // Note: We assume font is monospaced or consistent width. 
      // If variable width (Exo), perfect overlap is hard unless we mirror exactly.
      // Strategy: The Ghost contains the FULL string (Val + RemainingMask).
      // But the 'Val' part is transparent.
      
      const len = val.length;
      const remainingMask = mask.substring(len);
      
      ghost.innerHTML = `<span class="ghost-hidden">${val}</span>${remainingMask}`;
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

  // --- STEP 2: DOB ---
  goToStep2: () => {
    // Transition
    document.getElementById("step-name").classList.remove("active");
    document.getElementById("step-name").classList.add("prev");
    const step2 = document.getElementById("step-dob");
    step2.classList.add("active");
    
    // Update Name in title
    const l = OnboardingManager.config.lang;
    const txt = OnboardingManager.strings[l];
    document.getElementById("lbl-dob-title").innerHTML = txt.dob_title.replace("{name}", OnboardingManager.config.name);

    const input = document.getElementById("ob-dob-input");
    input.value = "";
    OnboardingManager.updateDobGhost("");
    input.focus();
    
    const hint = document.getElementById("hint-dob");
    
    let hintTimeout = setTimeout(() => {
        hint.classList.remove("hidden");
        hint.classList.add("visible");
    }, 10000);

    // Auto-formatting logic
    input.addEventListener("input", (e) => {
        let val = input.value.replace(/\D/g, ''); // keep only nums
        
        // Masking MM/DD/YYYY or DD/MM/AAAA
        if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2);
        if (val.length > 5) val = val.substring(0,5) + '/' + val.substring(5);
        if (val.length > 10) val = val.substring(0,10);
        
        input.value = val;
        
        // Update Ghost
        OnboardingManager.updateDobGhost(val);

        if (input.value.length >= 2) {
             hint.classList.remove("hidden");
             hint.classList.add("visible");
        }
    });
    
    // Handle backspace to update ghost correctly
    input.addEventListener("keyup", (e) => {
        OnboardingManager.updateDobGhost(input.value);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
             if (OnboardingManager.validateDate(input.value)) {
                 clearTimeout(hintTimeout);
                 OnboardingManager.goToStep3();
             } else {
                 input.style.color = "#ff6b6b"; 
                 setTimeout(() => input.style.color = "white", 500);
             }
        }
    });
  },

  validateDate: (dateStr) => {
      // Very basic validation, ensure it has 10 chars
      if (dateStr.length !== 10) return false;
      // Convert to standard YYYY-MM-DD for saving
      const parts = dateStr.split("/");
      const isEs = OnboardingManager.config.lang === "es";
      
      let day, month, year;
      if (isEs) {
          day = parts[0]; month = parts[1]; year = parts[2];
      } else {
          month = parts[0]; day = parts[1]; year = parts[2];
      }
      
      const iso = `${year}-${month}-${day}`;
      // Basic check
      const d = new Date(iso);
      if (isNaN(d.getTime())) return false;
      
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
    
    // Listen for Enter globally on this step
    document.addEventListener("keydown", OnboardingManager._appsKeyHandler);
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
          // Assuming icons path
          const iconSrc = app.icon ? `icons/${app.icon}` : "icons/default.png";
          console.log(`Onboarding: App ${app.name} icon: ${iconSrc}`);
          img.src = iconSrc;
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
