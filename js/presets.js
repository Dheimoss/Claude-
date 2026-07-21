// Patrons prêts à l'emploi, générés par formule géométrique (donc redimensionnables à toute taille).
// Chaque fonction reçoit des coordonnées normalisées nx, ny dans [-1, 1] (centre = 0,0)
// et renvoie true si la case doit être remplie.

const PRESETS = [
  {
    id: 'coeur',
    label: 'Cœur',
    defaultColor: 'Rouge',
    test(nx, ny) {
      const x = nx * 1.15;
      const y = -ny * 1.15 - 0.2;
      const v = (x * x + y * y - 1) ** 3 - x * x * y ** 3;
      return v <= 0;
    },
  },
  {
    id: 'rond',
    label: 'Rond',
    defaultColor: 'Bleu ciel',
    test(nx, ny) {
      return nx * nx + ny * ny <= 0.92;
    },
  },
  {
    id: 'etoile',
    label: 'Étoile',
    defaultColor: 'Jaune',
    test(nx, ny) {
      return isInsideStar(nx, ny, 5, 1.0, 0.42);
    },
  },
  {
    id: 'losange',
    label: 'Losange',
    defaultColor: 'Violet',
    test(nx, ny) {
      return Math.abs(nx) + Math.abs(ny) <= 0.95;
    },
  },
  {
    id: 'croix',
    label: 'Croix',
    defaultColor: 'Vert foncé',
    test(nx, ny) {
      const w = 0.38;
      return Math.abs(nx) <= w || Math.abs(ny) <= w;
    },
  },
  {
    id: 'triangle',
    label: 'Triangle',
    defaultColor: 'Orange',
    test(nx, ny) {
      const top = -0.85, bottom = 0.85;
      if (ny < top || ny > bottom) return false;
      const t = (ny - top) / (bottom - top);
      const halfWidth = t * 0.95;
      return Math.abs(nx) <= halfWidth;
    },
  },
  {
    id: 'soleil',
    label: 'Soleil',
    defaultColor: 'Jaune',
    test(nx, ny) {
      const r = Math.sqrt(nx * nx + ny * ny);
      if (r <= 0.5) return true;
      if (r > 0.95) return false;
      const angle = Math.atan2(ny, nx);
      const rayWidth = 0.24;
      const nearestMultiple = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      return Math.abs(angleDiff(angle, nearestMultiple)) <= rayWidth;
    },
  },
  {
    id: 'sapin',
    label: 'Sapin',
    defaultColor: 'Vert foncé',
    test(nx, ny) {
      const y = ny;
      if (y > 0.72 && y <= 0.95 && Math.abs(nx) <= 0.16) return true; // tronc
      if (y < -0.85 || y > 0.72) return false;
      const bands = [
        { top: -0.85, bottom: -0.35, halfWidthAtBottom: 0.5 },
        { top: -0.42, bottom: 0.12, halfWidthAtBottom: 0.7 },
        { top: -0.02, bottom: 0.72, halfWidthAtBottom: 0.95 },
      ];
      for (const band of bands) {
        if (y >= band.top && y <= band.bottom) {
          const t = (y - band.top) / (band.bottom - band.top);
          const halfWidth = t * band.halfWidthAtBottom;
          if (Math.abs(nx) <= halfWidth) return true;
        }
      }
      return false;
    },
  },
  {
    id: 'maison',
    label: 'Maison',
    defaultColor: 'Bleu marine',
    test(nx, ny) {
      if (ny >= 0.05 && ny <= 0.85 && Math.abs(nx) <= 0.65) return true; // murs
      if (ny < 0.05 && ny >= -0.75) {
        const t = (ny + 0.75) / 0.8;
        const halfWidth = t * 0.85;
        return Math.abs(nx) <= halfWidth;
      }
      return false;
    },
  },
  {
    id: 'fleur',
    label: 'Fleur',
    defaultColor: 'Rose',
    test(nx, ny) {
      if (nx * nx + ny * ny <= 0.09) return true; // cœur de la fleur
      const petals = 6;
      const petalDist = 0.52;
      const petalR = 0.34;
      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        const cx = petalDist * Math.cos(angle);
        const cy = petalDist * Math.sin(angle);
        const dx = nx - cx, dy = ny - cy;
        if (dx * dx + dy * dy <= petalR * petalR) return true;
      }
      return false;
    },
  },
  {
    id: 'papillon',
    label: 'Papillon',
    defaultColor: 'Turquoise',
    test(nx, ny) {
      if (Math.abs(nx) <= 0.045) return true; // corps
      for (const side of [-1, 1]) {
        const upperDx = (nx - side * 0.48) / 0.44;
        const upperDy = (ny + 0.32) / 0.4;
        if (upperDx * upperDx + upperDy * upperDy <= 1) return true;
        const lowerDx = (nx - side * 0.36) / 0.3;
        const lowerDy = (ny - 0.34) / 0.42;
        if (lowerDx * lowerDx + lowerDy * lowerDy <= 1) return true;
      }
      return false;
    },
  },
];

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function isInsideStar(nx, ny, points, outerR, innerR) {
  // Test d'appartenance à un polygone en étoile (rayon casting) sur les sommets alternés.
  const vertices = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    vertices.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  return pointInPolygon(nx, ny, vertices);
}

function pointInPolygon(px, py, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [xi, yi] = verts[i];
    const [xj, yj] = verts[j];
    const intersect = (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function generatePresetGrid(presetId, size, colorIndex) {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) throw new Error('Patron inconnu: ' + presetId);
  const cols = size;
  const rows = size;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = (x + 0.5) / cols * 2 - 1;
      const ny = (y + 0.5) / rows * 2 - 1;
      if (preset.test(nx, ny)) {
        grid[y][x] = colorIndex;
      }
    }
  }
  return grid;
}
