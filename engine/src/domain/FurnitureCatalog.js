const FALLBACK_FURNITURE_DEFINITION = Object.freeze({
  type: 'table',
  name: 'Table',
  defaultSize: Object.freeze({ width: 48, depth: 30, height: 30 }),
  components: Object.freeze([
    Object.freeze({ id: 'top', label: 'Tabletop', defaultColor: '#ffffff' }),
    Object.freeze({ id: 'legs', label: 'Legs', defaultColor: '#c7c1b7' })
  ])
});

// Runtime furniture modules populate this registry without making the domain
// layer import their Babylon-backed builders.
export const FURNITURE_DEFINITIONS = Object.create(null);

export function hasFurnitureDefinition(type) {
  return Object.prototype.hasOwnProperty.call(FURNITURE_DEFINITIONS, type);
}

export function getFurnitureDefinition(type) {
  return FURNITURE_DEFINITIONS[type] || FURNITURE_DEFINITIONS.table || FALLBACK_FURNITURE_DEFINITION;
}
