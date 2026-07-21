(() => {
  'use strict';

  // ---------- Éléments DOM ----------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = {
    image: document.getElementById('tab-image'),
    presets: document.getElementById('tab-presets'),
  };

  const dropzone = document.getElementById('dropzone');
  const imageInput = document.getElementById('imageInput');
  const dropzoneText = document.getElementById('dropzoneText');
  const imagePreview = document.getElementById('imagePreview');

  const colsRange = document.getElementById('colsRange');
  const colsValue = document.getElementById('colsValue');
  const rowsRange = document.getElementById('rowsRange');
  const rowsValue = document.getElementById('rowsValue');
  const rowsField = document.getElementById('rowsField');
  const lockRatio = document.getElementById('lockRatio');
  const brightnessRange = document.getElementById('brightnessRange');
  const brightnessValue = document.getElementById('brightnessValue');
  const contrastRange = document.getElementById('contrastRange');
  const contrastValue = document.getElementById('contrastValue');
  const transparentBg = document.getElementById('transparentBg');
  const generateFromImageBtn = document.getElementById('generateFromImageBtn');

  const presetGallery = document.getElementById('presetGallery');
  const presetColorSelect = document.getElementById('presetColor');
  const presetSizeRange = document.getElementById('presetSizeRange');
  const presetSizeValue = document.getElementById('presetSizeValue');
  const generatePresetBtn = document.getElementById('generatePresetBtn');

  const gridInfo = document.getElementById('gridInfo');
  const printBtn = document.getElementById('printBtn');
  const resetBtn = document.getElementById('resetBtn');
  const patternGridEl = document.getElementById('patternGrid');
  const legendEl = document.getElementById('legend');
  const emptyState = document.getElementById('emptyState');
  const printTitle = document.getElementById('printTitle');
  const printSubtitle = document.getElementById('printSubtitle');

  let loadedImage = null;
  let imageAspectRatio = 1;
  let selectedPresetId = null;

  // ---------- Onglets ----------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      Object.entries(tabPanels).forEach(([key, panel]) => {
        panel.hidden = key !== btn.dataset.tab;
      });
    });
  });

  // ---------- Import d'image ----------
  dropzone.addEventListener('click', () => imageInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageInput.click(); }
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove('dragover'); });
  });
  dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) handleImageFile(file);
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      imageAspectRatio = img.naturalWidth / img.naturalHeight;
      imagePreview.src = url;
      imagePreview.hidden = false;
      dropzoneText.hidden = true;
      generateFromImageBtn.disabled = false;
      syncRowsFromRatio();
    };
    img.src = url;
  }

  // ---------- Sliders image ----------
  function syncRowsFromRatio() {
    if (!lockRatio.checked) return;
    const cols = Number(colsRange.value);
    const rows = Math.max(4, Math.round(cols / imageAspectRatio));
    rowsRange.value = Math.min(Number(rowsRange.max), rows);
    rowsValue.textContent = rowsRange.value;
  }

  colsRange.addEventListener('input', () => {
    colsValue.textContent = colsRange.value;
    syncRowsFromRatio();
  });
  rowsRange.addEventListener('input', () => {
    rowsValue.textContent = rowsRange.value;
  });
  lockRatio.addEventListener('change', () => {
    rowsField.hidden = lockRatio.checked;
    if (lockRatio.checked) syncRowsFromRatio();
  });
  brightnessRange.addEventListener('input', () => brightnessValue.textContent = brightnessRange.value);
  contrastRange.addEventListener('input', () => contrastValue.textContent = contrastRange.value);

  // ---------- Conversion image -> patron ----------
  function generateGridFromImage(img, cols, rows, brightness, contrast, ignoreTransparent) {
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, cols, rows).data;

    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const a = data[i + 3];
        if (ignoreTransparent && a < 96) continue;
        let r = data[i], g = data[i + 1], b = data[i + 2];
        r = clamp(factor * (r - 128) + 128 + brightness);
        g = clamp(factor * (g - 128) + 128 + brightness);
        b = clamp(factor * (b - 128) + 128 + brightness);
        grid[y][x] = nearestPaletteIndex(r, g, b);
      }
    }
    return grid;
  }

  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  generateFromImageBtn.addEventListener('click', () => {
    if (!loadedImage) return;
    const cols = Number(colsRange.value);
    const rows = lockRatio.checked ? Number(rowsRange.value) : Number(rowsRange.value);
    const grid = generateGridFromImage(
      loadedImage, cols, rows,
      Number(brightnessRange.value), Number(contrastRange.value),
      transparentBg.checked
    );
    renderPattern(grid, 'Mon patron plus-plus', 'Créé à partir d\'une image importée');
  });

  // ---------- Galerie de patrons ----------
  presetColorSelect.innerHTML = PALETTE.map((c, i) =>
    `<option value="${i}">${c.name}</option>`).join('');

  function drawPresetThumbnail(canvas, preset, colorHex) {
    const size = 40;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = colorHex;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5) / size * 2 - 1;
        const ny = (y + 0.5) / size * 2 - 1;
        if (preset.test(nx, ny)) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  PRESETS.forEach(preset => {
    const card = document.createElement('button');
    card.className = 'preset-card';
    card.type = 'button';
    card.dataset.presetId = preset.id;
    card.setAttribute('aria-pressed', 'false');
    const defaultColorObj = PALETTE.find(c => c.name === preset.defaultColor) || PALETTE[0];
    card.innerHTML = `<canvas></canvas><span>${preset.label}</span>`;
    drawPresetThumbnail(card.querySelector('canvas'), preset, defaultColorObj.hex);
    card.addEventListener('click', () => {
      selectedPresetId = preset.id;
      document.querySelectorAll('.preset-card').forEach(c => {
        c.classList.toggle('selected', c === card);
        c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
      });
      const idx = PALETTE.indexOf(defaultColorObj);
      presetColorSelect.value = String(idx);
      generatePresetBtn.disabled = false;
    });
    presetGallery.appendChild(card);
  });

  presetSizeRange.addEventListener('input', () => presetSizeValue.textContent = presetSizeRange.value);

  generatePresetBtn.addEventListener('click', () => {
    if (!selectedPresetId) return;
    const preset = PRESETS.find(p => p.id === selectedPresetId);
    const size = Number(presetSizeRange.value);
    const colorIndex = Number(presetColorSelect.value);
    const grid = generatePresetGrid(selectedPresetId, size, colorIndex);
    renderPattern(grid, `Patron « ${preset.label} »`, 'Patron prêt à l\'emploi');
  });

  // ---------- Rendu du patron ----------
  function renderPattern(grid, title, subtitle) {
    const rows = grid.length;
    const cols = grid[0].length;

    patternGridEl.innerHTML = '';
    patternGridEl.style.setProperty('--cols', cols);
    patternGridEl.style.setProperty('--rows', rows);

    const counts = new Map();
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = grid[y][x];
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (idx === null || idx === undefined) {
          cell.classList.add('empty');
        } else {
          const color = PALETTE[idx];
          counts.set(idx, (counts.get(idx) || 0) + 1);
          cell.innerHTML = `
            <svg viewBox="0 0 10 10" class="plus-icon" style="fill:${color.hex}">
              <path d="M3.4 0H6.6V3.4H10V6.6H6.6V10H3.4V6.6H0V3.4H3.4Z"/>
            </svg>
            <span class="cell-code">${color.code}</span>`;
        }
        fragment.appendChild(cell);
      }
    }
    patternGridEl.appendChild(fragment);
    patternGridEl.classList.toggle('dense', cols > 40);

    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    legendEl.innerHTML = sorted.map(([idx, count]) => {
      const c = PALETTE[idx];
      return `<div class="legend-item">
        <span class="swatch" style="background:${c.hex}"></span>
        <span class="legend-name">${c.name} (${c.code})</span>
        <span class="legend-count">${count}</span>
      </div>`;
    }).join('');

    gridInfo.textContent = `Grille : ${cols} × ${rows} = ${total} pièces à placer`;
    printTitle.textContent = title;
    printSubtitle.textContent = `${subtitle} — ${cols} × ${rows} pièces (${total} au total)`;

    printBtn.disabled = false;
    resetBtn.disabled = false;
    emptyState.hidden = true;
    document.getElementById('printArea').classList.add('has-pattern');
  }

  printBtn.addEventListener('click', () => window.print());

  resetBtn.addEventListener('click', () => {
    patternGridEl.innerHTML = '';
    legendEl.innerHTML = '';
    gridInfo.textContent = 'Aucun patron généré pour l\'instant.';
    printBtn.disabled = true;
    resetBtn.disabled = true;
    emptyState.hidden = false;
    document.getElementById('printArea').classList.remove('has-pattern');
  });
})();
