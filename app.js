/* ------------------------------------------------------------------
   Malette — logique d'application (state, rendu, partage)
------------------------------------------------------------------- */

const STORAGE_KEY = "malette:state:v1";
const THEME_KEY = "malette:theme";

const state = {
  config: {
    destination: "plage",
    season: "ete",
    transport: "avion",
    days: 7,
    adults: 2,
    children: 0,
    hasBaby: false,
    hasPet: false,
    isSport: false,
    isBusiness: false,
  },
  checked: new Set(),
  removed: new Set(),
  custom: [], // { id, category, label }
};

let hasGenerated = false;

// ---------------------------------------------------------------
// Encodage / décodage de l'état pour un lien partageable
// ---------------------------------------------------------------
function b64EncodeUnicode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64DecodeUnicode(b64) {
  const restored = b64.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(restored);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeState() {
  const payload = {
    c: state.config,
    k: Array.from(state.checked),
    r: Array.from(state.removed),
    u: state.custom,
  };
  return b64EncodeUnicode(JSON.stringify(payload));
}

function decodeState(hash) {
  try {
    const payload = JSON.parse(b64DecodeUnicode(hash));
    return {
      config: { ...state.config, ...payload.c },
      checked: new Set(payload.k || []),
      removed: new Set(payload.r || []),
      custom: payload.u || [],
    };
  } catch (e) {
    return null;
  }
}

function persist() {
  const data = encodeState();
  localStorage.setItem(STORAGE_KEY, data);
  history.replaceState(null, "", "#d=" + data);
}

// ---------------------------------------------------------------
// Rendu des sélecteurs (destination / saison / transport)
// ---------------------------------------------------------------
function renderChipGrid(container, options, key) {
  container.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (state.config[key] === opt.id ? " is-active" : "");
    btn.innerHTML = `<span class="chip-icon">${opt.icon}</span><span>${opt.label}</span>`;
    btn.addEventListener("click", () => {
      state.config[key] = opt.id;
      [...container.children].forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
    container.appendChild(btn);
  });
}

function initConfigurator() {
  renderChipGrid(document.getElementById("pick-destination"), DESTINATIONS, "destination");
  renderChipGrid(document.getElementById("pick-season"), SEASONS, "season");
  renderChipGrid(document.getElementById("pick-transport"), TRANSPORTS, "transport");

  const daysRange = document.getElementById("days-range");
  const daysValue = document.getElementById("days-value");
  daysRange.value = state.config.days;
  daysValue.textContent = state.config.days;
  daysRange.addEventListener("input", () => {
    state.config.days = Number(daysRange.value);
    daysValue.textContent = state.config.days;
  });

  document.querySelectorAll("[data-stepper]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.stepper;
      const dir = Number(btn.dataset.dir);
      const min = field === "adults" ? 1 : 0;
      const max = field === "adults" ? 10 : 8;
      state.config[field] = Math.min(max, Math.max(min, state.config[field] + dir));
      document.getElementById(field + "-value").textContent = state.config[field];
    });
  });

  document.getElementById("opt-baby").addEventListener("change", (e) => (state.config.hasBaby = e.target.checked));
  document.getElementById("opt-pet").addEventListener("change", (e) => (state.config.hasPet = e.target.checked));
  document.getElementById("opt-sport").addEventListener("change", (e) => (state.config.isSport = e.target.checked));
  document.getElementById("opt-business").addEventListener("change", (e) => (state.config.isBusiness = e.target.checked));
}

function syncConfiguratorFromState() {
  renderChipGrid(document.getElementById("pick-destination"), DESTINATIONS, "destination");
  renderChipGrid(document.getElementById("pick-season"), SEASONS, "season");
  renderChipGrid(document.getElementById("pick-transport"), TRANSPORTS, "transport");
  document.getElementById("days-range").value = state.config.days;
  document.getElementById("days-value").textContent = state.config.days;
  document.getElementById("adults-value").textContent = state.config.adults;
  document.getElementById("children-value").textContent = state.config.children;
  document.getElementById("opt-baby").checked = state.config.hasBaby;
  document.getElementById("opt-pet").checked = state.config.hasPet;
  document.getElementById("opt-sport").checked = state.config.isSport;
  document.getElementById("opt-business").checked = state.config.isBusiness;
}

// ---------------------------------------------------------------
// Génération + rendu de la checklist
// ---------------------------------------------------------------
function getFullItemList() {
  const base = generateChecklist(state.config);
  const all = [...base, ...state.custom];
  return all.filter((item) => !state.removed.has(item.id));
}

function renderResultHeading() {
  const dest = DESTINATIONS.find((d) => d.id === state.config.destination);
  const season = SEASONS.find((s) => s.id === state.config.season);
  document.getElementById("result-eyebrow").textContent =
    `${dest.icon} ${dest.label} · ${season.icon} ${season.label} · ${state.config.days} j`;
  document.getElementById("result-heading").textContent = "Ta checklist est prête ✅";
}

function updateProgress() {
  const items = getFullItemList();
  const total = items.length;
  const done = items.filter((i) => state.checked.has(i.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("progress-percent").textContent = pct + "%";
  const circle = document.getElementById("progress-circle");
  const circumference = 2 * Math.PI * 38;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference * (1 - pct / 100)}`;

  if (pct === 100 && total > 0) celebrate();
  return { total, done, pct };
}

function renderChecklist() {
  const grid = document.getElementById("checklist-grid");
  grid.innerHTML = "";
  const items = getFullItemList();
  const groups = groupByCategory(items);

  groups.forEach((group) => {
    const card = document.createElement("div");
    card.className = "cat-card";

    const doneCount = group.items.filter((i) => state.checked.has(i.id)).length;

    card.innerHTML = `
      <div class="cat-header">
        <h3><span>${group.meta.icon}</span>${group.meta.label}</h3>
        <span class="cat-count">${doneCount}/${group.items.length}</span>
      </div>
      <ul class="item-list"></ul>
      <form class="add-item-form" data-category="${group.category}">
        <input type="text" placeholder="Ajouter un objet…" maxlength="60" />
        <button type="submit" aria-label="Ajouter">+</button>
      </form>
    `;

    const ul = card.querySelector(".item-list");
    group.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item" + (state.checked.has(item.id) ? " is-checked" : "");
      li.innerHTML = `
        <label class="item-check">
          <input type="checkbox" ${state.checked.has(item.id) ? "checked" : ""} />
          <span class="check-box"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6"/></svg></span>
          <span class="item-label">${item.label}</span>
        </label>
        <button class="item-remove" aria-label="Retirer cet objet">×</button>
      `;
      li.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.checked.add(item.id);
        else state.checked.delete(item.id);
        li.classList.toggle("is-checked", e.target.checked);
        persist();
        updateProgress();
        const count = group.items.filter((i) => state.checked.has(i.id)).length;
        card.querySelector(".cat-count").textContent = `${count}/${group.items.length}`;
      });
      li.querySelector(".item-remove").addEventListener("click", () => {
        state.removed.add(item.id);
        persist();
        renderChecklist();
        updateProgress();
      });
      ul.appendChild(li);
    });

    card.querySelector(".add-item-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = e.target.querySelector("input");
      const label = input.value.trim();
      if (!label) return;
      const id = `custom-${group.category}-${Date.now()}`;
      state.custom.push({ id, category: group.category, label });
      persist();
      renderChecklist();
      updateProgress();
    });

    grid.appendChild(card);
  });

  updateProgress();
}

function showResult() {
  hasGenerated = true;
  document.getElementById("configurator").hidden = true;
  document.getElementById("hero").classList.add("is-compact");
  const result = document.getElementById("result");
  result.hidden = false;
  renderResultHeading();
  renderChecklist();
  persist();
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function celebrate() {
  if (document.querySelector(".confetti-layer")) return;
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  const emojis = ["🎉", "🧳", "✅", "🌴", "☀️", "🎊"];
  for (let i = 0; i < 24; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[i % emojis.length];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 0.4 + "s";
    span.style.fontSize = 14 + Math.random() * 18 + "px";
    layer.appendChild(span);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2600);
  showToast("Valise complète, bon voyage ! 🧳");
}

// ---------------------------------------------------------------
// Toast
// ---------------------------------------------------------------
let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

// ---------------------------------------------------------------
// Thème
// ---------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });
}

// ---------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------
function loadFromHash() {
  const hash = location.hash;
  if (hash.startsWith("#d=")) {
    const decoded = decodeState(hash.slice(3));
    if (decoded) return decoded;
  }
  return null;
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return decodeState(raw);
}

function applyState(loaded) {
  state.config = loaded.config;
  state.checked = loaded.checked;
  state.removed = loaded.removed;
  state.custom = loaded.custom;
}

function init() {
  initTheme();
  initConfigurator();

  document.getElementById("cta-start").addEventListener("click", () => {
    document.getElementById("configurator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("generate-btn").addEventListener("click", () => {
    state.checked = new Set();
    state.removed = new Set();
    state.custom = [];
    showResult();
  });

  document.getElementById("share-btn").addEventListener("click", async () => {
    persist();
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ma checklist de vacances", url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Lien copié dans le presse-papiers ✅");
      }
    } catch (e) {
      showToast("Impossible de copier le lien");
    }
  });

  document.getElementById("edit-config-btn").addEventListener("click", () => {
    document.getElementById("result").hidden = true;
    document.getElementById("configurator").hidden = false;
    document.getElementById("hero").classList.remove("is-compact");
    syncConfiguratorFromState();
    document.getElementById("configurator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Repartir d'une liste vierge ? Les cases cochées seront perdues.")) return;
    state.checked = new Set();
    state.removed = new Set();
    state.custom = [];
    localStorage.removeItem(STORAGE_KEY);
    history.replaceState(null, "", location.pathname);
    document.getElementById("result").hidden = true;
    document.getElementById("configurator").hidden = false;
    document.getElementById("hero").classList.remove("is-compact");
    hasGenerated = false;
    document.getElementById("configurator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const fromHash = loadFromHash();
  const fromStorage = fromHash ? null : loadFromStorage();
  const loaded = fromHash || fromStorage;

  if (loaded) {
    applyState(loaded);
    syncConfiguratorFromState();
    showResult();
  }
}

document.addEventListener("DOMContentLoaded", init);
