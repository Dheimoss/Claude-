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
  // Échantillonne l'image sur une grille fine cols x rows (RGBA bruts, sans
  // encore choisir de pièces) : sert ensuite de base pour moyenner la
  // couleur de chaque pièce plus-plus réelle (qui couvre plusieurs cases).
  function sampleImageColors(img, cols, rows) {
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, cols, rows);
    return ctx.getImageData(0, 0, cols, rows).data;
  }

  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  function buildPiecesFromImage(img, cols, rows, brightness, contrast, ignoreTransparent) {
    const data = sampleImageColors(img, cols, rows);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    const includeTest = ignoreTransparent
      ? (cells) => cells.filter(([x, y]) => data[(y * cols + x) * 4 + 3] >= 96).length >= 5
      : null;

    const pieces = generatePieces(cols, rows, includeTest);

    for (const piece of pieces) {
      const opaqueCells = ignoreTransparent
        ? piece.cells.filter(([x, y]) => data[(y * cols + x) * 4 + 3] >= 96)
        : piece.cells;
      const cells = opaqueCells.length ? opaqueCells : piece.cells;
      let r = 0, g = 0, b = 0;
      for (const [x, y] of cells) {
        const i = (y * cols + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2];
      }
      r /= cells.length; g /= cells.length; b /= cells.length;
      r = clamp(factor * (r - 128) + 128 + brightness);
      g = clamp(factor * (g - 128) + 128 + brightness);
      b = clamp(factor * (b - 128) + 128 + brightness);
      piece.colorIndex = nearestPaletteIndex(r, g, b);
    }
    return pieces;
  }

  generateFromImageBtn.addEventListener('click', () => {
    if (!loadedImage) return;
    const cols = Number(colsRange.value);
    const rows = Number(rowsRange.value);
    const pieces = buildPiecesFromImage(
      loadedImage, cols, rows,
      Number(brightnessRange.value), Number(contrastRange.value),
      transparentBg.checked
    );
    renderPattern(pieces, cols, rows, 'Mon patron plus-plus', 'Créé à partir d\'une image importée');
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

  function buildPiecesFromPreset(presetId, size, colorIndex) {
    const preset = PRESETS.find(p => p.id === presetId);
    const cols = size, rows = size;
    const cellInside = (x, y) => {
      const nx = (x + 0.5) / cols * 2 - 1;
      const ny = (y + 0.5) / rows * 2 - 1;
      return preset.test(nx, ny);
    };
    const includeTest = (cells) => cells.filter(([x, y]) => cellInside(x, y)).length >= 5;
    const pieces = generatePieces(cols, rows, includeTest);
    pieces.forEach(p => p.colorIndex = colorIndex);
    return pieces;
  }

  generatePresetBtn.addEventListener('click', () => {
    if (!selectedPresetId) return;
    const preset = PRESETS.find(p => p.id === selectedPresetId);
    const size = Number(presetSizeRange.value);
    const colorIndex = Number(presetColorSelect.value);
    const pieces = buildPiecesFromPreset(selectedPresetId, size, colorIndex);
    renderPattern(pieces, size, size, `Patron « ${preset.label} »`, 'Patron prêt à l\'emploi');
  });

  // ---------- Rendu du patron ----------
  // Une pièce plus-plus réelle couvre 5x3 (ou 3x5) cases : le rendu est donc
  // un unique SVG où chaque pièce est dessinée à sa vraie position issue du
  // pavage (js/tiling.js), pas une grille de cases indépendantes.
  const UNIT = 2; // échelle des chemins SVG : 2 unités par case
  const SHOW_LABEL_MAX_COLS = 42; // au-delà, les lettres deviennent illisibles

  function renderPattern(pieces, cols, rows, title, subtitle) {
    const showLabels = cols <= SHOW_LABEL_MAX_COLS;
    const svgW = cols * UNIT, svgH = rows * UNIT;

    const counts = new Map();
    const pieceMarkup = pieces.map(piece => {
      const color = PALETTE[piece.colorIndex];
      counts.set(piece.colorIndex, (counts.get(piece.colorIndex) || 0) + 1);
      const bbox = PIECE_BBOX[piece.shape];
      const tx = piece.ox * UNIT, ty = piece.oy * UNIT;
      const cx = tx + (bbox.w * UNIT) / 2;
      const cy = ty + (bbox.h * UNIT) / 2;
      const label = showLabels
        ? `<text x="${cx}" y="${cy}" class="piece-label">${color.code}</text>`
        : '';
      return `<g transform="translate(${tx},${ty})">
        <path d="${PIECE_PATHS[piece.shape]}" fill="${color.hex}" class="piece-shape"/>
      </g>${label}`;
    }).join('');

    patternGridEl.innerHTML = `
      <svg class="pattern-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
        ${pieceMarkup}
      </svg>`;

    const total = pieces.length;
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    legendEl.innerHTML = sorted.map(([idx, count]) => {
      const c = PALETTE[idx];
      return `<div class="legend-item">
        <span class="swatch" style="background:${c.hex}"></span>
        <span class="legend-name">${c.name} (${c.code})</span>
        <span class="legend-count">${count}</span>
      </div>`;
    }).join('');

    gridInfo.textContent = `Grille : ${cols} × ${rows} cases — ${total} pièces plus-plus à assembler`;
    printTitle.textContent = title;
    printSubtitle.textContent = `${subtitle} — ${total} pièces plus-plus au total`;

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
