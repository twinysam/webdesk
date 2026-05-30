window.AppManager = (() => {
  const MYAPPS_KEY = "myApps";
  let _catalog = null;
  let sortablePromise = null;
  let sortableInstance = null;
  let abortController = null;

  // Cache catalog on first load
  async function getCatalog() {
    if (_catalog) return _catalog;
    try {
      const res = await fetch("items.json");
      const apps = await res.json();
      _catalog = apps.sort((a, b) => a.name.localeCompare(b.name));
      return _catalog;
    } catch (e) {
      console.error("Failed to load items.json", e);
      return [];
    }
  }

  // Get raw sparse array from localStorage
  function getRawApps() {
    return JSON.parse(localStorage.getItem(MYAPPS_KEY)) || [];
  }

  // Save sparse array and dispatch events
  function saveRawApps(apps) {
    localStorage.setItem(MYAPPS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent("webdesk:appsUpdated", { detail: apps }));
  }

  // Hydrate sparse array with catalog data
  async function getApps() {
    const rawApps = getRawApps();
    const catalog = await getCatalog();
    const catalogMap = new Map(catalog.map(app => [app.name, app]));

    return rawApps
      .map(raw => catalogMap.get(raw.name))
      .filter(Boolean); // remove any that no longer exist in catalog
  }

  function saveOrder(newArray) {
    const raw = newArray.map(item => ({ name: item.name }));
    saveRawApps(raw);
  }

  function addApp(name) {
    const apps = getRawApps();
    if (!apps.some(app => app.name === name)) {
      apps.push({ name });
      saveRawApps(apps);
    }
  }

  function deleteApp(name) {
    let apps = getRawApps();
    const index = apps.findIndex(app => app.name === name);
    if (index !== -1) {
      apps.splice(index, 1);
      saveRawApps(apps);
    }
  }

  function loadSortable() {
    if (typeof Sortable !== 'undefined') return Promise.resolve();
    if (sortablePromise) return sortablePromise;

    sortablePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SortableJS'));
      document.head.appendChild(script);
    });

    return sortablePromise;
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function showOverlay() {
    await loadSortable();
    const catalog = await getCatalog();
    let userApps = await getApps();

    abortController = new AbortController();
    const { signal } = abortController;

    const overlayHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 1055; display: flex; flex-direction: column; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem 0;">
          <h5 class="text-white m-0"><i class="bi bi-grid-3x3-gap"></i> <span data-i18n="label_edit_apps">Manage Apps</span></h5>
          <button type="button" id="closeOverlayBtn" style="background: none; border: none; color: #fff; font-size: 1.75rem; cursor: pointer; padding: 0; line-height: 1;" aria-label="Close">&times;</button>
        </div>
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1;">
          <!-- Search -->
          <div style="max-width: 600px; width: 100%; margin: 0 auto;">
            <p class="mb-1 text-light" data-i18n="label_search_add">Search to add:</p>
            <input type="text" id="appSearchInput" class="form-control bg-dark text-white border-secondary" data-i18n="[placeholder]placeholder_search" placeholder="Search...">
            <div id="searchResults" class="list-group mt-2" style="max-height: 200px; overflow-y: auto;"></div>
          </div>
          
          <!-- Grid -->
          <div style="flex: 1; width: 100%; margin: 0 auto;">
            <div id="overlayAppGrid" style="display: grid; grid-template-columns: repeat(10, 85px); gap: 12px; justify-content: center;"></div>
          </div>
        </div>
      </div>
    `;

    // Dismiss every open Bootstrap tooltip before mounting the overlay
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      const tip = bootstrap.Tooltip.getInstance(el);
      if (tip) tip.hide();
    });

    const wrapper = document.createElement('div');
    wrapper.id = "appOverlayWrapper";
    wrapper.innerHTML = overlayHTML;
    document.body.appendChild(wrapper);

    const gridContainer = document.getElementById('overlayAppGrid');
    const searchInput = document.getElementById('appSearchInput');
    const searchResults = document.getElementById('searchResults');
    const closeBtn = document.getElementById('closeOverlayBtn');



    function renderGrid() {
      gridContainer.innerHTML = '';
      userApps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'overlay-app-item position-relative text-center';
        item.style.cursor = 'grab';
        item.dataset.name = app.name;
        
        item.innerHTML = `
          <div class="item mx-auto" style="width: 75px; height: 75px; position: relative;">
            <a class="${app.icon}" style="width: 75px !important; height: 75px !important; margin: 0 !important; pointer-events: none;"></a>
            <button class="btn btn-danger rounded-circle btn-delete-app" style="position: absolute; top: -6px; right: -6px; z-index: 2; width: 20px; height: 20px; padding: 0; line-height: 1; font-size: 13px; border: 2px solid rgba(0,0,0,0.8);">&times;</button>
          </div>
          <div class="app-name text-truncate text-white-50" style="font-size: 0.65rem; margin-top: 2px;">${app.name}</div>
        `;
        gridContainer.appendChild(item);
      });

      if (sortableInstance) sortableInstance.destroy();
      sortableInstance = new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'bg-secondary',
        onEnd: () => {
          const newOrder = Array.from(gridContainer.children).map(el => ({ name: el.dataset.name }));
          saveOrder(newOrder);
          // Re-sync local state
          userApps = newOrder.map(o => catalog.find(c => c.name === o.name));
        }
      });
    }

    function renderSearch(query = '') {
      searchResults.innerHTML = '';
      if (!query.trim()) return;

      const userAppNames = new Set(userApps.map(a => a.name));
      const filtered = catalog.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase()) && 
        !userAppNames.has(app.name)
      ).slice(0, 5); // Limit results

      filtered.forEach(app => {
        const a = document.createElement('a');
        a.href = "#";
        a.className = "list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center gap-2";
        a.innerHTML = `<i class="${app.icon}"></i> ${app.name}`;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          addApp(app.name);
          userApps.push(app);
          searchInput.value = '';
          renderSearch();
          renderGrid();
        }, { signal });
        searchResults.appendChild(a);
      });
    }

    renderGrid();
    if (window.I18nManager) window.I18nManager.applyToPage();

    // Event Listeners
    searchInput.addEventListener('input', debounce((e) => {
      renderSearch(e.target.value);
    }, 300), { signal });

    gridContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-app')) {
        const item = e.target.closest('.overlay-app-item');
        if (item) {
          const name = item.dataset.name;
          deleteApp(name);
          userApps = userApps.filter(a => a.name !== name);
          renderGrid();
        }
      }
    }, { signal });

    // Close handler — NOT using { signal } so abort() can't kill it mid-execution
    const closeOverlay = () => {

      if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }
      wrapper.remove();
      // Abort remaining listeners last
      abortController.abort();
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOverlay();
    });
    
    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        closeOverlay();
      }
    };
    document.addEventListener('keydown', onKeydown);
    
    // Store keydown ref so we can clean it up when aborting
    signal.addEventListener('abort', () => {
      document.removeEventListener('keydown', onKeydown);
    });
    
    // Auto-sync if changed externally while open
    window.addEventListener('webdesk:appsUpdated', async () => {
        userApps = await getApps();
        renderGrid();
        renderSearch(searchInput.value);
    }, { signal });
  }

  // Pre-fetch catalog in background
  getCatalog();

  return {
    getApps,
    saveOrder,
    addApp,
    deleteApp,
    loadSortable,
    showOverlay,
    getCatalog // exposed for settings.html
  };
})();
