// Grey structure cost estimate (Pakistan rules of thumb).
//
// Quantities are per square foot of covered area for a typical brick and RCC
// house with a 10.5 ft roof. Walls get taller with the roof height, so bricks
// scale fully with it and cement and sand scale half (the other half goes into
// slabs, floors and plaster that do not change with height). Steel and crush
// are mostly in the roof slab, beams and foundation, so they stay the same.
// These are planning numbers, not a bill of quantities.
export const BASE_ROOF_HEIGHT_FT = 10.5

export const QUANTITY_PER_SQFT = {
  steel: { quantity: 0.0035, heightShare: 0 }, // ton (3.5 kg per sq ft)
  cement: { quantity: 0.4, heightShare: 0.5 }, // 50 kg bags
  bricks: { quantity: 22, heightShare: 1 }, // bricks
  sand: { quantity: 1.8, heightShare: 0.5 }, // cft
  crush: { quantity: 0.9, heightShare: 0 }, // cft
  labour: { quantity: 1, heightShare: 0 }, // rate is per sq ft
  pipes: { quantity: 1, heightShare: 0 } // rate is per sq ft
}

export const ESTIMATE_ORDER = ['steel', 'cement', 'bricks', 'sand', 'crush', 'labour', 'pipes']

const round = (value, places = 0) => {
  const f = 10 ** places
  return Math.round(value * f) / f
}

// rates: { [key]: { name, unit, ratePkr, status } }
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
      rateStatus: rate.status
    }
  })

  const totalPkr = lines.reduce((sum, line) => sum + line.amountPkr, 0)
  return {
    coveredAreaSqft: round(coveredAreaSqft, 2),
    floors,
    roofHeightFt,
    lines,
    totalPkr,
    perSqftPkr: coveredAreaSqft > 0 ? round(totalPkr / coveredAreaSqft) : 0,
    missingRates: ESTIMATE_ORDER.filter((key) => !rates[key]),
    hasUnverifiedRates: lines.some((line) => line.rateStatus !== 'verified')
  }
}
