const OnboardingManager = {
  // Config state during onboarding
  tempConfig: {
    name: "",
    birthday: "",
    lang: "en",
    selectedApps: [], // [{name: "Gmail"}, ...]
  },
  
  fullCatalog: [],

  start: () => {
    const overlay = document.getElementById("onboarding-overlay");
    overlay.classList.remove("d-none");
    OnboardingManager.goToStep("welcome");
    
    // Load Catalog once
    Promise.all([
        fetch("items.json").then(res => res.json()).catch(() => []),
        fetch("tv-items.json").then(res => res.json()).catch(() => [])
    ]).then(([apps, tv]) => {
        OnboardingManager.fullCatalog = [...apps, ...tv].sort((a,b) => a.name.localeCompare(b.name));
    });
  },

  goToStep: (stepId) => {
    document.querySelectorAll(".step-container").forEach(el => el.classList.remove("active"));
    document.getElementById(`step-${stepId}`).classList.add("active");
  },

  // --- ACTIONS ---

  // STEP 1: Welcome
  confirmStart: () => {
    OnboardingManager.goToStep("profile");
  },

  confirmImport: () => {
    document.getElementById("importInput").click();
  },

  handleImport: (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.stats) localStorage.setItem("clickStats", JSON.stringify(data.stats));
          if (data.config) localStorage.setItem("appConfig", JSON.stringify(data.config));
          if (data.customEvents) localStorage.setItem("customEvents", JSON.stringify(data.customEvents));
          
          // Legacy support (older backups didn't have profile, presumably)
          // Just reload and let it work.
          // IF we define profile as "isSetup" requirement, we might need to mock it if missing?
          // Let's assume user backup implies setup.
          // If the backup doesn't have "userProfile" (new key), we might be stuck looping onboarding?
          // We should create a dummy profile if missing.
          if (!localStorage.getItem("userProfile")) {
              ProfileManager.setProfile("User", "1985-10-17", "en"); // Defaults
          }

          alert("Import successful! Reloading...");
          location.reload();
        } catch (err) {
          alert("Error importing: " + err.message);
        }
      };
      reader.readAsText(file);
  },

  // STEP 2: Profile
  saveProfileStep: () => {
    const name = document.getElementById("ob-name").value.trim();
    const dob = document.getElementById("ob-dob").value;
    const lang = document.getElementById("ob-lang").value;

    if (!name || !dob) {
      alert("Please fill in all fields.");
      return;
    }

    OnboardingManager.tempConfig.name = name;
    OnboardingManager.tempConfig.birthday = dob;
    OnboardingManager.tempConfig.lang = lang;

    // Initialize App Selector
    OnboardingManager.renderAppSelector();
    OnboardingManager.goToStep("apps");
  },

  // STEP 3: Apps
  renderAppSelector: () => {
    OnboardingManager.renderCatalog();
    OnboardingManager.renderMyApps();
  },

  renderCatalog: (filter = "") => {
    const container = document.getElementById("ob-catalog-list");
    container.innerHTML = "";
    
    // Filter
    const filtered = OnboardingManager.fullCatalog.filter(
        app => app.name.toLowerCase().includes(filter.toLowerCase()) && 
        !OnboardingManager.tempConfig.selectedApps.some(s => s.name === app.name)
    );

    filtered.forEach(app => {
        const div = document.createElement("div");
        div.className = "catalog-item";
        div.innerHTML = `
            <div class="app-icon-mini" style="background-image: url('${app.icon ? 'icons/'+app.icon : ''}')"></div>
            <span>${app.name}</span>
            <button class="btn-action" onclick="OnboardingManager.addApp('${app.name}')"><i class="bi bi-plus-lg"></i></button>
        `;
        container.appendChild(div);
    });
  },

  renderMyApps: () => {
    const container = document.getElementById("ob-myapps-list");
    container.innerHTML = "";
    
    OnboardingManager.tempConfig.selectedApps.forEach((appObj, index) => {
        const fullApp = OnboardingManager.fullCatalog.find(a => a.name === appObj.name) || { name: appObj.name };
        
        const div = document.createElement("div");
        div.className = "my-app-item";
        div.draggable = true; // TODO: Implement drag sort?
        div.innerHTML = `
             <div class="app-icon-mini" style="background-image: url('${fullApp.icon ? 'icons/'+fullApp.icon : ''}')"></div>
            <span>${appObj.name}</span>
            <button class="btn-action" onclick="OnboardingManager.removeApp(${index})"><i class="bi bi-dash-lg"></i></button>
        `;
        container.appendChild(div);
    });
  },

  addApp: (appName) => {
    OnboardingManager.tempConfig.selectedApps.push({ name: appName });
    OnboardingManager.renderCatalog(document.getElementById("ob-search").value);
    OnboardingManager.renderMyApps();
  },

  removeApp: (index) => {
    OnboardingManager.tempConfig.selectedApps.splice(index, 1);
    OnboardingManager.renderCatalog(document.getElementById("ob-search").value);
    OnboardingManager.renderMyApps();
  },
  
  filterCatalog: (val) => {
      OnboardingManager.renderCatalog(val);
  },

  finish: () => {
    // Save Everything
    const { name, birthday, lang, selectedApps } = OnboardingManager.tempConfig;
    
    // 1. Save Profile (This triggers reload in ProfileManager implementation... wait)
    // ProfileManager.setProfile triggers location.reload(). We should do that LAST.
    
    // 2. Save Apps
    localStorage.setItem("myApps", JSON.stringify(selectedApps));
    
    // 3. Save Config (default)
    // Ensure "appConfig" exists with the correct order
    const config = {
        order: selectedApps.map(a => a.name),
        hidden: [],
        filters: { hideNeverClicked: false, minClicks: 0 }
    };
    localStorage.setItem("appConfig", JSON.stringify(config));

    // 4. Save Profile & Reload
    ProfileManager.setProfile(name, birthday, lang);
  }
};
