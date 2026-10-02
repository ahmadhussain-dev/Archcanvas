// A quick check that the requested rooms can fit on the plot. Not the full plan check:
// it compares minimum room areas (plus walls and circulation) with the covered area.
export const MIN_ROOM = {
  bedroom: { w: 10, d: 11 },
  bathroom: { w: 5, d: 7 },
  kitchen: { w: 8, d: 10 },
  lounge: { w: 12, d: 14 },
  drawingRoom: { w: 12, d: 12 },
  carPorch: { w: 10, d: 18 }
}

const area = (k) => MIN_ROOM[k].w * MIN_ROOM[k].d
const CIRCULATION = 1.35 // walls, passages and stairs on top of room areas
const STAIRS_SQFT = 60

export function checkFit({ widthFt, depthFt, floors, bedrooms, bathrooms, kitchens, drawingRoom, carPorch }) {
  const perFloor = widthFt * depthFt
  const rooms =
    bedrooms * area('bedroom') +
    bathrooms * area('bathroom') +
    kitchens * area('kitchen') +
    area('lounge') +
    (drawingRoom ? area('drawingRoom') : 0)
  const needed = rooms * CIRCULATION + (floors > 1 ? STAIRS_SQFT * floors : 0) + (carPorch ? area('carPorch') : 0)
  const available = perFloor * floors
  const narrow = widthFt < MIN_ROOM.bedroom.w + 3
  const floorsNeeded = Math.ceil(needed / perFloor)

  if (narrow && bedrooms > 0) {
    return { fits: false, message: `A ${Math.round(widthFt)} ft wide plot is too narrow for a 10'-0" bedroom with walls. Try at least 13 ft.` }
  }
  if (needed <= available) {
    const spare = floors > floorsNeeded && floorsNeeded >= 1
    return {
      fits: true,
      message:
        `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'} (min 10'-0" × 11'-0") and ${bathrooms} bath${bathrooms === 1 ? '' : 's'} fit on ${floors} floor${floors === 1 ? '' : 's'}.` +
        (spare ? ` ${floorsNeeded} floor${floorsNeeded === 1 ? ' is' : 's are'} enough.` : '')
    }
  }
  return {
    fits: false,
    message:
      floorsNeeded <= 5
        ? `These rooms need about ${Math.round(needed).toLocaleString('en-US')} sq ft. Add floors (${floorsNeeded} needed) or ask for fewer rooms.`
        : `These rooms need about ${Math.round(needed).toLocaleString('en-US')} sq ft, more than this plot can hold. Ask for fewer rooms or a bigger plot.`
  }
}
