window.OnboardingManager = {
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
    
    // Load Catalog (Ignore TV for now per user request)
    fetch("items.json")
      .then(res => res.json())
      .then(apps => {
        OnboardingManager.fullCatalog = apps.sort((a,b) => a.name.localeCompare(b.name));
      })
      .catch(err => console.error("Error loading items.json", err));
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
          if (data.myApps) localStorage.setItem("myApps", JSON.stringify(data.myApps)); // Fix: Ensure myApps is imported
          
          // Legacy support (older backups didn't have profile, presumably)
          if (data.profile) {
              localStorage.setItem("userProfile", JSON.stringify(data.profile));
          } else if (!localStorage.getItem("userProfile")) {
              ProfileManager.setProfile("User", "1985-10-17", "en"); // Defaults
          }

          Utils.showAlert("Import successful! Reloading...", "success");
          setTimeout(() => location.reload(), 2000);
        } catch (err) {
          Utils.showAlert("Error importing: " + err.message, "danger");
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
      Utils.showAlert("Please fill in all fields.", "warning");
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
        div.dataset.name = appObj.name; // For Sortable
        div.innerHTML = `
             <div class="d-flex align-items-center gap-2">
                 <i class="bi bi-list sort-handle text-secondary me-2"></i>
                 <div class="app-icon-mini" style="background-image: url('${fullApp.icon ? 'icons/'+fullApp.icon : ''}')"></div>
                 <span>${appObj.name}</span>
             </div>
            <button class="btn-action" onclick="OnboardingManager.removeApp(${index})"><i class="bi bi-dash-lg"></i></button>
        `;
        container.appendChild(div);
    });

    // Destroy old sortable if exists (not critical as we clear innerHTML but good practice)
    // Re-init Sortable (Sortable is loaded in index.html)
    if(window.Sortable) {
        new Sortable(container, {
            handle: '.sort-handle',
            animation: 150,
            ghostClass: 'ghost-class',
            onEnd: (evt) => {
               // Update state based on DOM order
               const newOrder = [];
               container.querySelectorAll(".my-app-item").forEach(el => {
                   newOrder.push({ name: el.dataset.name });
               });
               OnboardingManager.tempConfig.selectedApps = newOrder;
            }
        });
    }
  },

  addApp: (appName) => {
    OnboardingManager.tempConfig.selectedApps.push({ name: appName });
    const searchVal = document.getElementById("ob-search").value;
    OnboardingManager.renderCatalog(searchVal);
    OnboardingManager.renderMyApps();
  },

  removeApp: (index) => {
    OnboardingManager.tempConfig.selectedApps.splice(index, 1);
    const searchVal = document.getElementById("ob-search").value;
    OnboardingManager.renderCatalog(searchVal);
    OnboardingManager.renderMyApps();
  },
  
  filterCatalog: (val) => {
      OnboardingManager.renderCatalog(val);
  },

  finish: () => {
    // Save Everything
    const { name, birthday, lang, selectedApps } = OnboardingManager.tempConfig;
    
    // 1. Save Config (Order & Default Filters)
    // We map only names for the order array in config (legacy support + syncing)
    const config = {
        order: selectedApps.map(a => a.name),
        hidden: [],
        filters: { hideNeverClicked: false, minClicks: 0 }
    };
    
    try {
        localStorage.setItem("myApps", JSON.stringify(selectedApps));
        localStorage.setItem("appConfig", JSON.stringify(config));
        
        // 2. Save Profile (Triggers Reload internally? NO, ProfileManager.setProfile calls location.reload())
        // But we want to ensure everything is saved BEFORE reloading.
        // ProfileManager.setProfile logic:
        // localStorage.setItem(ProfileManager.STORAGE_KEY, JSON.stringify(profile));
        // I18nManager.setLang(lang);
        // location.reload();
        
        ProfileManager.setProfile(name, birthday, lang);
        
    } catch(e) {
        Utils.showAlert("Error saving setup: " + e.message, "danger");
    }
  }
};
