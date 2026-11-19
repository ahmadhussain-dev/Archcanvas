// Grey structure cost estimate (Pakistan rules of thumb).
//
// Quantities are per square foot of covered area for a typical brick and RCC
// house with a 10.5 ft roof. Walls get taller with the roof height, so bricks
// scale fully with it and cement and sand scale half (the other half goes into
// slabs, floors and plaster that do not change with height). Steel and crush
// are mostly in the roof slab, beams and foundation, so they stay the same.
// These are planning numbers, not a bill of quantities. They follow published
// Pakistani take-offs for double storey houses (see docs/price-sources.md):
//   Zameen 10 Marla A-category (3,300 sq ft): 90,000 bricks, 8,200 cft sand,
//     2,600 cft crush, 800 bags, 5 t steel;
//   Zameen 5 Marla (1,975 sq ft, Oct 2023): 56,000 bricks, 3,052 cft sand,
//     1,721 cft crush, 605 bags, 3 t steel;
//   Glorious Builders 10 Marla (3,400 sq ft, Nov 2026): 88,000 bricks,
//     7,200 cft sand, 3,200 cft crush, 1,200 bags, 6 t steel.
// Per sq ft that is 26-28 bricks, 1.5-2.5 cft sand, 0.8-0.95 cft crush,
// 0.24-0.35 bags and 1.5-1.8 kg steel. We take the upper half so foundations,
// a framed (column and beam) structure and plaster are covered; site wastage
// and transport are separate lines below.
export const BASE_ROOF_HEIGHT_FT = 10.5

export const QUANTITY_PER_SQFT = {
  steel: { quantity: 0.0018, heightShare: 0 }, // ton (1.8 kg per sq ft)
  cement: { quantity: 0.34, heightShare: 0.5 }, // 50 kg bags
  bricks: { quantity: 27, heightShare: 1 }, // bricks (9 in outer walls, 4.5 in some partitions)
  sand: { quantity: 2.2, heightShare: 0.5 }, // cft
  crush: { quantity: 0.9, heightShare: 0 }, // cft
  labour: { quantity: 1, heightShare: 0 }, // rate is per sq ft
  pipes: { quantity: 1, heightShare: 0 } // rate is per sq ft
}

export const ESTIMATE_ORDER = ['steel', 'cement', 'bricks', 'sand', 'crush', 'labour', 'pipes']
// Everything except labour is bought material, for the wastage and transport lines.
const MATERIAL_KEYS = ['steel', 'cement', 'bricks', 'sand', 'crush', 'pipes']

// Costs the per-material lines leave out. All tunable.
export const EXTRAS = {
  // Digging, earth filling under the ground floor and the damp-proof course, per sq ft of footprint.
  groundworkPerFootprintSqft: 150,
  // Door and window frames (chowkat), per sq ft covered.
  framesPerSqft: 60,
  // Underground and overhead water tanks, septic tank and the sewer line, per house.
  tanksPerHouse: 250000,
  // Share of the material cost lost on site (breakage, cutting, spillage).
  wastage: 0.03,
  // Share of the material cost for delivery and loading.
  transport: 0.02,
  // Share of everything above kept aside for surprises.
  contingency: 0.05
}

// The likely figure, and how far a real quote usually lands from it.
export const RANGE = { low: 0.9, high: 1.15 }

const round = (value, places = 0) => {
  const f = 10 ** places
  return Math.round(value * f) / f
}

// rates: { [key]: { name, unit, ratePkr, status, source?, checkedAt? } }
export function calculateEstimate({ widthFt, depthFt, floors, roofHeightFt }, rates) {
  const coveredAreaSqft = widthFt * depthFt * floors
  const heightFactor = roofHeightFt / BASE_ROOF_HEIGHT_FT

  const lines = ESTIMATE_ORDER.filter((key) => rates[key]).map((key) => {
    const { quantity, heightShare } = QUANTITY_PER_SQFT[key]
    const factor = 1 - heightShare + heightShare * heightFactor
    const rate = rates[key]
    const qty = coveredAreaSqft * quantity * factor
    return {
      key,
      name: rate.name,
      unit: rate.unit,
      quantity: round(qty, key === 'steel' ? 2 : 0),
      ratePkr: rate.ratePkr,
      amountPkr: round(qty * rate.ratePkr),
      kind: 'material',
      rateStatus: rate.status,
      rateSource: rate.source ?? null,
      rateCheckedAt: rate.checkedAt ?? null
    }
  })

  const sum = (list) => list.reduce((total, line) => total + line.amountPkr, 0)
  const materialsPkr = sum(lines.filter((l) => MATERIAL_KEYS.includes(l.key)))
  const footprintSqft = widthFt * depthFt
  const extra = (key, name, basis, amountPkr) => ({ key, name, kind: 'extra', basis, amountPkr: round(amountPkr) })
  const pct = (share) => `${round(share * 100, 1)}%`
  const extras = [
    extra('groundwork', 'Excavation, earth filling and DPC', `${round(footprintSqft)} sq ft footprint`, footprintSqft * EXTRAS.groundworkPerFootprintSqft),
    extra('frames', 'Door and window frames', `${round(coveredAreaSqft)} sq ft`, coveredAreaSqft * EXTRAS.framesPerSqft),
    extra('tanks', 'Water tanks, septic tank and sewer line', 'per house', EXTRAS.tanksPerHouse),
    extra('wastage', 'Site wastage', `${pct(EXTRAS.wastage)} of materials`, materialsPkr * EXTRAS.wastage),
    extra('transport', 'Transport and loading', `${pct(EXTRAS.transport)} of materials`, materialsPkr * EXTRAS.transport)
  ]
  const beforeContingency = sum(lines) + sum(extras)
  extras.push(extra('contingency', 'Contingency', `${pct(EXTRAS.contingency)} of the total`, beforeContingency * EXTRAS.contingency))

  const totalPkr = sum(lines) + sum(extras)
  // Money resting on prices read online today (or set by an admin) rather than worked out.
  const checkedPkr = sum(lines.filter((l) => l.rateStatus === 'verified'))
  const perSqft = (v) => (coveredAreaSqft > 0 ? round(v / coveredAreaSqft) : 0)
  return {
    coveredAreaSqft: round(coveredAreaSqft, 2),
    floors,
    roofHeightFt,
    lines,
    extras,
    totalPkr,
    perSqftPkr: perSqft(totalPkr),
    range: {
      lowPkr: round(totalPkr * RANGE.low),
      highPkr: round(totalPkr * RANGE.high),
      lowPerSqftPkr: perSqft(totalPkr * RANGE.low),
      highPerSqftPkr: perSqft(totalPkr * RANGE.high)
    },
    checkedSharePct: sum(lines) > 0 ? round((checkedPkr / sum(lines)) * 100) : 0,
    missingRates: ESTIMATE_ORDER.filter((key) => !rates[key]),
    hasUnverifiedRates: lines.some((line) => !['verified', 'estimated'].includes(line.rateStatus))
  }
}
