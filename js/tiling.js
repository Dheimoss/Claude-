// Géométrie réelle d'une pièce plus-plus : deux "+" fusionnés (silhouette de
// 9 carrés unitaires, 5 de large x 3 de haut à l'horizontale). Une seule
// pièce ne peut donc pas se poser sur une simple grille carrée : il faut un
// pavage réel, comme dans le jouet physique.
//
// Ci-dessous, le pavage périodique (motif qui se répète tous les 6x6 cases,
// avec 4 pièces alternant horizontale/verticale) trouvé par recherche
// exhaustive : c'est la seule façon de couvrir le plan sans trou ni
// chevauchement avec cette forme.

const PIECE_CELLS = {
  H: [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [3, 2]], // 5 x 3
  V: [[0, 1], [0, 3], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [2, 1], [2, 3]], // 3 x 5
};

const PIECE_BBOX = { H: { w: 5, h: 3 }, V: { w: 3, h: 5 } };

// Chemins SVG (échelle : 2 unités par case) décrivant le contour exact de la pièce.
const PIECE_PATHS = {
  H: 'M2,0 L4,0 L4,2 L6,2 L6,0 L8,0 L8,2 L10,2 L10,4 L8,4 L8,6 L6,6 L6,4 L4,4 L4,6 L2,6 L2,4 L0,4 L0,2 L2,2 Z',
  V: 'M0,2 L0,4 L2,4 L2,6 L0,6 L0,8 L2,8 L2,10 L4,10 L4,8 L6,8 L6,6 L4,6 L4,4 L6,4 L6,2 L4,2 L4,0 L2,0 L2,2 Z',
};

const TILING_PERIOD = 6;
const TILING_UNIT = [
  { shape: 'H', ox: 5, oy: 0 },
  { shape: 'V', ox: 0, oy: 2 },
  { shape: 'V', ox: 3, oy: 5 },
  { shape: 'H', ox: 2, oy: 3 },
];

/**
 * Calcule la liste des pièces plus-plus (pavage réel, sans trou ni
 * chevauchement) qui recouvrent une grille de `cols` x `rows` cases.
 * `includeTest(cells)` reçoit la liste des 9 cases [x,y] d'une pièce
 * candidate et renvoie true si la pièce doit être conservée (sert à
 * suivre le contour d'une image ou d'un patron prédéfini).
 */
function generatePieces(cols, rows, includeTest) {
  const pieces = [];
  const txMin = -1, txMax = Math.ceil(cols / TILING_PERIOD) + 1;
  const tyMin = -1, tyMax = Math.ceil(rows / TILING_PERIOD) + 1;

  for (let ty = tyMin; ty <= tyMax; ty++) {
    for (let tx = txMin; tx <= txMax; tx++) {
      for (const base of TILING_UNIT) {
        const ox = base.ox + tx * TILING_PERIOD;
        const oy = base.oy + ty * TILING_PERIOD;
        const cells = PIECE_CELLS[base.shape].map(([dx, dy]) => [ox + dx, oy + dy]);
        const fits = cells.every(([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows);
        if (!fits) continue;
        if (includeTest && !includeTest(cells)) continue;
        pieces.push({ shape: base.shape, ox, oy, cells });
      }
    }
  }
  return pieces;
}
