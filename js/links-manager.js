// ==========================================================================
// MODULE: LinksManager
// Unified Custom User Links Management
// ==========================================================================
window.LinksManager = (() => {
  const STORAGE_KEY = "userLinks";
  let sortablePromise = null;
  let sortableInstance = null;
  let abortController = null;

  function getLinks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    window.dispatchEvent(new CustomEvent("webdesk:linksUpdated", { detail: links }));
  }

  function addLink(name, url) {
    const links = getLinks();
    links.push({ name, url });
    saveLinks(links);
    if (window.showAlert) {
      const msg = window.I18nManager ? window.I18nManager.getString("alert_link_added") : "Link added successfully!";
      window.showAlert(msg, "success");
    }
  }

  function deleteLink(index) {
    const links = getLinks();
    links.splice(index, 1);
    saveLinks(links);
    if (window.showAlert) {
      const msg = window.I18nManager ? window.I18nManager.getString("alert_link_deleted") : "Link deleted!";
      window.showAlert(msg, "success");
    }
  }

  function moveLinkToTop(index) {
    const links = getLinks();
    if (index > 0 && index < links.length) {
      const [item] = links.splice(index, 1);
      links.unshift(item);
      saveLinks(links);
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

  function renderGrid() {
    const links = getLinks();
    const container = document.getElementById("custom-links-container");
    if (!container) return;

    container.innerHTML = "";
    container.className = "custom-links-container";

    const count = links.length;
    let colClass = "links-cols-1";
    if (count > 21) colClass = "links-cols-4";
    else if (count > 14) colClass = "links-cols-3";
    else if (count > 7) colClass = "links-cols-2";
    container.classList.add(colClass);

    const hr = document.createElement("hr");
    hr.style.columnSpan = "all";
    hr.style.webkitColumnSpan = "all";
    container.appendChild(hr);

    const headerDiv = document.createElement("div");
    headerDiv.className = "d-flex justify-content-between align-items-center mb-3";
    headerDiv.style.columnSpan = "all";
    headerDiv.style.webkitColumnSpan = "all";

    const h2 = document.createElement("h2");
    h2.className = "m-0";
    h2.innerHTML = '<i class="bi bi-link-45deg"></i> ' + (window.I18nManager ? window.I18nManager.getString("tab_links") : "Links");

    const editBtn = document.createElement("a");
    editBtn.href = "#";
    editBtn.className = "edit-links-pencil ms-2";
    editBtn.style.fontSize = "1.5rem";
    editBtn.style.textDecoration = "none";
    editBtn.title = window.I18nManager ? window.I18nManager.getString("header_custom_links") : "Manage Custom Links";
    editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showOverlay();
    });

    headerDiv.appendChild(h2);
    headerDiv.appendChild(editBtn);
    container.appendChild(headerDiv);

    if (count === 0) return;

    const ul = document.createElement("ul");
    // Standard unstyled bullet points list as requested by the user
    links.forEach((link) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.textContent = link.name || link.url;
      li.appendChild(a);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function renderTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";

    const links = getLinks();
    links.forEach((link, index) => {
      const tr = document.createElement("tr");
      tr.dataset.name = link.name || "";
      tr.dataset.url = link.url;

      const upBtn = index > 0
        ? `<button class="btn btn-sm btn-outline-info me-2 btn-move-top" onclick="LinksManager.moveLinkToTop(${index})"><i class="bi bi-arrow-up"></i></button>`
        : "";

      tr.innerHTML = `
        <td><i class="bi bi-list text-secondary sort-handle" style="cursor: move;"></i></td>
        <td>${link.name || '<em class="text-secondary" data-i18n="value_none">No Name</em>'}</td>
        <td><a href="${link.url}" target="_blank" class="text-info text-decoration-none">${link.url}</a></td>
        <td class="text-end">
            ${upBtn}
            <button class="btn btn-sm btn-danger btn-delete-link" onclick="LinksManager.deleteLink(${index})"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (window.I18nManager) window.I18nManager.applyToPage();

    if (typeof Sortable !== 'undefined') {
      new Sortable(tbody, {
        handle: ".sort-handle",
        animation: 150,
        onEnd: () => {
          const newLinks = [];
          tbody.querySelectorAll("tr").forEach((tr) => {
            newLinks.push({
              name: tr.dataset.name,
              url: tr.dataset.url,
            });
          });
          saveLinks(newLinks);
        },
      });
    }
  }

  async function showOverlay() {
    await loadSortable();

    abortController = new AbortController();
    const { signal } = abortController;

    const overlayHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 1055; display: flex; flex-direction: column; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem 0; max-width: 1200px; width: 95%; margin: 0 auto;">
          <h5 class="text-white m-0"><i class="bi bi-link-45deg"></i> <span data-i18n="header_custom_links">Manage Custom Links</span></h5>
          <button type="button" id="closeLinksOverlayBtn" style="background: none; border: none; color: #fff; font-size: 1.75rem; cursor: pointer; padding: 0; line-height: 1;" aria-label="Close">&times;</button>
        </div>
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1;">
          <!-- Form -->
          <div style="max-width: 900px; width: 100%; margin: 0 auto 0.5rem;">
            <form id="overlayLinkForm" class="row g-2 align-items-end bg-dark p-3 rounded border border-secondary">
              <div class="col-md-5">
                <label class="form-label text-light mb-1 small" data-i18n="label_link_name">Name (Optional)</label>
                <input type="text" id="overlayLinkName" class="form-control bg-dark text-white border-secondary" placeholder="My Site">
              </div>
              <div class="col-md-5">
                <label class="form-label text-light mb-1 small" data-i18n="label_url">URL</label>
                <input type="url" id="overlayLinkUrl" class="form-control bg-dark text-white border-secondary" placeholder="https://..." required>
              </div>
              <div class="col-md-2">
                <button type="submit" class="btn btn-success w-100"><i class="bi bi-plus-lg"></i> <span data-i18n="btn_add">Add</span></button>
              </div>
            </form>
          </div>
          
          <!-- Links Grid (Separated in columns, making full horizontal use of screen space) -->
          <div style="max-width: 1200px; width: 95%; margin: 0 auto; flex: 1; padding-bottom: 2rem;">
            <div id="overlayLinksGrid" style="column-width: 280px; column-gap: 16px; width: 100%;"></div>
          </div>
        </div>
      </div>
    `;

    // Dismiss tooltip
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      const tip = bootstrap.Tooltip.getInstance(el);
      if (tip) tip.hide();
    });

    const wrapper = document.createElement('div');
    wrapper.id = "linksOverlayWrapper";
    wrapper.innerHTML = overlayHTML;
    document.body.appendChild(wrapper);

    const grid = document.getElementById('overlayLinksGrid');
    const form = document.getElementById('overlayLinkForm');
    const closeBtn = document.getElementById('closeLinksOverlayBtn');

    function renderOverlayGrid() {
      grid.innerHTML = '';
      const currentLinks = getLinks();

      currentLinks.forEach((link, index) => {
        const item = document.createElement('div');
        item.className = 'overlay-link-card bg-dark text-white p-3 rounded border border-secondary d-flex align-items-center justify-content-between mb-3';
        item.style.breakInside = 'avoid';
        item.style.webkitColumnBreakInside = 'avoid';
        item.style.cursor = 'grab';
        item.dataset.name = link.name || "";
        item.dataset.url = link.url;

        const upBtn = index > 0
          ? `<button type="button" class="btn btn-sm btn-outline-info me-1 btn-move-top" data-index="${index}" title="Push to top"><i class="bi bi-arrow-up"></i></button>`
          : "";

        item.innerHTML = `
          <div class="d-flex align-items-center gap-2 text-truncate" style="flex: 1; min-width: 0;">
            <i class="bi bi-list sort-handle text-secondary" style="cursor: move; font-size: 1.25rem;"></i>
            <div class="text-truncate" style="min-width: 0; flex: 1;">
              <strong class="d-block text-white text-truncate" style="font-size: 0.95rem;">${link.name || link.url}</strong>
              <small class="text-white-50 text-truncate d-block" style="font-size: 0.75rem;">${link.url}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1">
            ${upBtn}
            <button type="button" class="btn btn-sm btn-danger btn-delete-link" data-index="${index}" style="padding: 2px 6px;"><i class="bi bi-trash"></i></button>
          </div>
        `;
        grid.appendChild(item);
      });

      if (sortableInstance) sortableInstance.destroy();
      sortableInstance = new Sortable(grid, {
        handle: ".sort-handle",
        animation: 150,
        onEnd: () => {
          const newOrder = Array.from(grid.children).map(item => ({
            name: item.dataset.name,
            url: item.dataset.url
          }));
          saveLinks(newOrder);
        }
      });

      if (window.I18nManager) window.I18nManager.applyToPage();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('overlayLinkName').value.trim();
      const url = document.getElementById('overlayLinkUrl').value.trim();
      addLink(name, url);
      form.reset();
      renderOverlayGrid();
    }, { signal });

    grid.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-link');
      if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.index, 10);
        deleteLink(index);
        renderOverlayGrid();
      }

      const upBtn = e.target.closest('.btn-move-top');
      if (upBtn) {
        const index = parseInt(upBtn.dataset.index, 10);
        moveLinkToTop(index);
        renderOverlayGrid();
      }
    }, { signal });

    const closeOverlay = () => {
      if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }
      wrapper.remove();
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

    signal.addEventListener('abort', () => {
      document.removeEventListener('keydown', onKeydown);
    });

    renderOverlayGrid();
  }

  // Reactive listeners
  window.addEventListener('webdesk:linksUpdated', () => {
    renderGrid();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      renderGrid();
    }
  });

  function init() {
    renderGrid();
  }

  return {
    getLinks,
    saveLinks,
    addLink,
    deleteLink,
    moveLinkToTop,
    renderGrid,
    renderTable,
    showOverlay,
    init
  };
})();
