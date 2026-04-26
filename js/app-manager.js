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
      <div class="modal modal-fullscreen" tabindex="-1" style="display: block; background: rgba(0,0,0,0.9); z-index: 1050;">
        <div class="modal-dialog modal-fullscreen m-0">
          <div class="modal-content bg-transparent border-0 text-white">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title ms-3 mt-3"><i class="bi bi-grid-3x3-gap"></i> Manage Apps</h5>
              <button type="button" class="btn-close btn-close-white me-3 mt-3" aria-label="Close" id="closeOverlayBtn"></button>
            </div>
            <div class="modal-body p-4 d-flex flex-column gap-4">
              <!-- Search -->
              <div class="search-container mx-auto" style="max-width: 600px; width: 100%;">
                <input type="text" id="appSearchInput" class="form-control bg-dark text-white border-secondary" placeholder="Search to add apps...">
                <div id="searchResults" class="list-group mt-2" style="max-height: 200px; overflow-y: auto;"></div>
              </div>
              
              <!-- Grid -->
              <div class="apps-grid-container mx-auto w-100" style="flex: 1; max-width: 1200px;">
                <div id="overlayAppGrid" class="d-flex flex-wrap gap-3 justify-content-center"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

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
        item.className = 'overlay-app-item position-relative p-2 bg-dark rounded border border-secondary text-center';
        item.style.width = '100px';
        item.style.cursor = 'grab';
        item.dataset.name = app.name;
        
        item.innerHTML = `
          <button class="btn btn-sm btn-danger rounded-circle position-absolute btn-delete-app" style="top: -10px; right: -10px; z-index: 2; width: 24px; height: 24px; padding: 0; line-height: 1;">&times;</button>
          <div class="app-icon mx-auto mb-2 ${app.icon}" style="font-size: 2rem;"></div>
          <div class="app-name small text-truncate">${app.name}</div>
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

    const closeOverlay = () => {
      abortController.abort();
      if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }
      wrapper.remove();
    };

    closeBtn.addEventListener('click', closeOverlay, { signal });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    }, { signal });
    
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
