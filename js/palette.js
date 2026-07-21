// Palette de couleurs standard des pièces plus-plus (approximation des teintes officielles).
const PALETTE = [
  { name: 'Blanc',        code: 'Bl', hex: '#FFFFFF' },
  { name: 'Noir',         code: 'N',  hex: '#232323' },
  { name: 'Rouge',        code: 'R',  hex: '#E4312B' },
  { name: 'Orange',       code: 'O',  hex: '#F5821F' },
  { name: 'Jaune',        code: 'J',  hex: '#FFD400' },
  { name: 'Vert clair',   code: 'Vc', hex: '#8DC63F' },
  { name: 'Vert foncé',   code: 'Vf', hex: '#1E7B34' },
  { name: 'Turquoise',    code: 'T',  hex: '#00A99D' },
  { name: 'Bleu ciel',    code: 'Bc', hex: '#29ABE2' },
  { name: 'Bleu marine',  code: 'Bm', hex: '#1B4F9C' },
  { name: 'Violet',       code: 'Vi', hex: '#7B4FA0' },
  { name: 'Rose',         code: 'Ro', hex: '#F06EA9' },
  { name: 'Gris',         code: 'G',  hex: '#939598' },
  { name: 'Marron',       code: 'M',  hex: '#7B4B2A' },
  { name: 'Beige',        code: 'Be', hex: '#F2C9A1' },
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

PALETTE.forEach(c => Object.assign(c, hexToRgb(c.hex)));

// Distance perceptuelle "redmean" — plus fidèle à l'œil qu'une distance RGB brute.
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

function nearestPaletteIndex(r, g, b) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const c = PALETTE[i];
    const d = colorDistance(r, g, b, c.r, c.g, c.b);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
