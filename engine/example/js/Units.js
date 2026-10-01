// Display units for the editor panels.
// The engine always works in metres. When the editor runs inside ArchCanvas
// (embed mode) the length fields show feet instead: each length input gets a
// `value` property that converts on the way in and out, so the rest of the
// app keeps reading and writing metres.

let useFeet = false;

const M_PER_FT = 0.3048;
const SQFT_PER_SQM = 1 / (M_PER_FT * M_PER_FT);

const LENGTH_INPUT_IDS = new Set([
  'floor-wall-height', 'floor-height',
  'room-width', 'room-depth', 'room-elevation',
  'wall-length', 'wall-baseboard-height', 'wall-wainscot-height',
  'fence-length', 'fence-height', 'fence-yoffset',
  'item-width', 'item-depth', 'item-height', 'item-elevation',
  'opening-width', 'opening-height', 'opening-sill-height',
  'fence-gate-width', 'fence-gate-height', 'fence-gate-thickness', 'fence-gate-yoffset',
  'structure-x', 'structure-z', 'structure-width', 'structure-depth', 'structure-height',
  'structure-top-width', 'structure-top-depth', 'structure-eave-overhang', 'structure-elevation',
  'structure-run-before-corner', 'structure-run-after-corner',
  'structure-u-slot-width', 'structure-u-void-length', 'structure-curve'
]);

let nativeValue = null;

function round(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Area label for a floor or room, from square metres. */
export function formatArea(squareMetres) {
  const value = Number(squareMetres) || 0;
  if (!useFeet) return `${round(value, 2)} ㎡`;
  return `${Math.round(value * SQFT_PER_SQM).toLocaleString('en-US')} sq ft`;
}

// The engine keeps lengths to the centimetre, so one decimal of a foot is as
// precise as the numbers really are (small parts like trims keep two).
function formatFeet(feet) {
  return String(round(feet, Math.abs(feet) >= 1 ? 1 : 2));
}

/** A plan label for a room: its size in feet and inches when it is a plain
 *  rectangle, otherwise its area. */
export function formatRoomSize(room, squareMetres) {
  const square = !room.shape || room.shape === 'square';
  if (!useFeet || !square) return formatArea(squareMetres);
  return `${feetInches(room.width)} × ${feetInches(room.depth)}`;
}

function feetInches(metres) {
  const inches = Math.round((Number(metres) || 0) / M_PER_FT * 12);
  return `${Math.floor(inches / 12)}'-${inches % 12}"`;
}

function feetStep(metreStep) {
  if (!(metreStep > 0)) return 'any';
  if (metreStep >= 0.1) return '0.5';
  if (metreStep >= 0.05) return '0.25';
  return '0.05';
}

function convertInput(input) {
  if (input.dataset.unit === 'ft') return;
  nativeValue ??= Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  input.dataset.unit = 'ft';

  const step = Number(input.getAttribute('step'));
  input.setAttribute('step', feetStep(step));
  for (const attr of ['min', 'max']) {
    if (!input.hasAttribute(attr)) continue;
    const metres = Number(input.getAttribute(attr));
    input.setAttribute(attr, String(round(metres / M_PER_FT, 2)));
  }

  const shown = nativeValue.get.call(input);
  Object.defineProperty(input, 'value', {
    configurable: true,
    get() {
      const raw = nativeValue.get.call(this);
      if (raw === '') return '';
      const feet = Number(raw);
      return Number.isFinite(feet) ? String(round(feet * M_PER_FT, 4)) : raw;
    },
    set(next) {
      if (next === '' || next === null || next === undefined) {
        nativeValue.set.call(this, '');
        return;
      }
      const metres = Number(next);
      nativeValue.set.call(this, Number.isFinite(metres) ? formatFeet(metres / M_PER_FT) : String(next));
    }
  });
  if (shown !== '') input.value = shown;

  const label = input.closest('label, .field');
  const caption = label?.querySelector('span');
  if (caption) caption.textContent = caption.textContent.replace('(m)', '(ft)');
}

function convertWithin(root) {
  if (root.id && LENGTH_INPUT_IDS.has(root.id) && root instanceof HTMLInputElement) convertInput(root);
  root.querySelectorAll?.('input[id]').forEach((input) => {
    if (LENGTH_INPUT_IDS.has(input.id)) convertInput(input);
  });
}

/** Switch the length fields to feet, including fields the panels add later. */
export function initDisplayUnits() {
  if (useFeet) return;
  useFeet = true;
  convertWithin(document.body);
  new MutationObserver((records) => {
    for (const { addedNodes: added } of records) {
      added.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) convertWithin(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
