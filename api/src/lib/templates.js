// Ready-made house templates, one for each common plot size (2 Marla to
// 2 Kanal). Each one is a double-storey house drawn the way Pakistani houses
// are usually planned: bedrooms with attached baths at the back, the lounge,
// kitchen and stairs in the middle, and the car porch and drawing room at the
// front (the road is at the bottom of the plan).
//
// Only the rooms and where their doors and windows go are written here, in
// plan feet (planSummary.js: origin at the plot's top-left, y down towards the
// road, rooms measured on wall centre lines so neighbours share an edge). The
// engine builds the rest exactly as it does for an AI change: shared walls,
// openings, stairs over the stairs below and a full set of furniture for each
// room (engine/src/ai/applyAiPlan.js, roomKits.js). So a template is always in
// the editor's current plan format.
import 'blueprint3d-babylon/furniture'
import { applyAiOperations, createBuildingFile, FloorplanDocument, SHARED_WALLS, BRICK_THICKNESS } from 'blueprint3d-babylon'
import { FT, planFrame, toWorld, roomKind } from './planSummary.js'
import { PLOT_PRESETS } from './units.js'
import { planPreview } from './planPreview.js'

const WALL_HEIGHT_FT = 10.5
const DOOR_FT = 3
const ARCH_FT = 4
const GATE_FT = 10

const room = (name, x, y, width, depth) => ({ name, x, y, width, depth })
// A door on one side of a room. `at` is where along that wall, in plan feet:
// an x on a top or bottom wall, a y on a left or right wall.
const door = (name, side, at, width = DOOR_FT) => ({ kind: 'door', room: name, side, at, width })
const arch = (name, side, at, width = ARCH_FT) => ({ kind: 'door', room: name, side, at, width, open: true })
const gate = (name, at, width = GATE_FT) => ({ kind: 'door', room: name, side: 'bottom', at, width })
const win = (name, side, at, width) => ({ kind: 'window', room: name, side, at, ...(width ? { width } : {}) })
// A walk-in dressing between a bedroom and its bath.
const DRESSING = [['wardrobe', 2], ['vanity', 1]]

/** The templates, smallest plot first. */
export const TEMPLATE_DESIGNS = [
  {
    key: '2-marla',
    plot: '2-marla',
    name: '2 Marla family house',
    summary: 'A compact double-storey house: lounge in the middle with an open kitchen and bath at the back, a front bedroom, and a second bedroom, study and terrace upstairs.',
    floors: [
      {
        rooms: [
          room('Bath', 0, 0, 5.75, 8.5),
          room('Kitchen', 5.75, 0, 9.25, 8.5),
          room('TV Lounge', 0, 8.5, 10.5, 11),
          room('Staircase', 10.5, 8.5, 4.5, 11),
          room('Master Bedroom', 0, 19.5, 10.5, 10.5),
          room('Entrance', 10.5, 19.5, 4.5, 10.5)
        ],
        openings: [
          door('Bath', 'bottom', 2.9),
          door('Kitchen', 'bottom', 8.2),
          arch('Staircase', 'left', 17.2, 3),
          door('Staircase', 'bottom', 12.75, 2.25),
          door('Master Bedroom', 'top', 8),
          door('Entrance', 'bottom', 12.75, 2.5),
          win('Bath', 'top', 3.2, 2),
          win('Kitchen', 'top', 10.4),
          win('Master Bedroom', 'bottom', 5.25)
        ]
      },
      {
        rooms: [
          room('Bath 2', 0, 0, 5.75, 8.5),
          room('Study', 5.75, 0, 9.25, 8.5),
          room('Family Lounge', 0, 8.5, 10.5, 11),
          room('Staircase', 10.5, 8.5, 4.5, 11),
          room('Bedroom 2', 0, 19.5, 10.5, 10.5),
          room('Terrace', 10.5, 19.5, 4.5, 10.5)
        ],
        openings: [
          door('Bath 2', 'bottom', 2.9),
          door('Study', 'bottom', 8.2),
          arch('Staircase', 'left', 17.2, 3),
          door('Staircase', 'bottom', 12.75, 2.25),
          door('Bedroom 2', 'top', 8),
          win('Bath 2', 'top', 3.2, 2),
          win('Study', 'top', 10.4),
          win('Bedroom 2', 'bottom', 5.25)
        ]
      }
    ]
  },
  {
    key: '3-marla',
    plot: '3-marla',
    name: '3 Marla family house',
    summary: 'A large master suite at the back, kitchen and lounge in the middle, stairs and an entrance at the front, with two bedrooms, a family lounge and a front terrace upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 0, 16.5, 11.5),
          room('Master Bath', 16.5, 0, 6, 11.5),
          room('Kitchen', 0, 11.5, 9.5, 11.5),
          room('TV Lounge', 9.5, 11.5, 13, 11.5),
          room('Staircase', 0, 23, 13, 7),
          room('Entrance', 13, 23, 9.5, 7)
        ],
        openings: [
          door('Master Bedroom', 'bottom', 14),
          door('Master Bath', 'left', 9),
          door('Kitchen', 'right', 14.5),
          arch('Staircase', 'top', 11.25, 3),
          arch('Entrance', 'top', 18, 5),
          door('Entrance', 'bottom', 18),
          win('Master Bedroom', 'top', 8.25),
          win('Master Bath', 'top', 19.5)
        ]
      },
      {
        rooms: [
          room('Bedroom 2', 0, 0, 16.5, 11.5),
          room('Bath 2', 16.5, 0, 6, 11.5),
          room('Kids Room', 0, 11.5, 9.5, 11.5),
          room('Family Lounge', 9.5, 11.5, 13, 11.5),
          room('Staircase', 0, 23, 13, 7),
          room('Terrace', 13, 23, 9.5, 7)
        ],
        openings: [
          door('Bedroom 2', 'bottom', 14),
          door('Bath 2', 'left', 9),
          door('Kids Room', 'right', 14.5),
          arch('Staircase', 'top', 11.25, 3),
          door('Terrace', 'top', 18),
          win('Bedroom 2', 'top', 8.25),
          win('Bath 2', 'top', 19.5)
        ]
      }
    ]
  },
  {
    key: '5-marla',
    plot: '5-marla',
    name: '5 Marla family house',
    summary: 'Master suite with a dressing at the back, lounge between the kitchen and stairs, a car porch and drawing room at the front, and two more bedroom suites and a kitchen upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 0, 17.5, 12.5),
          room('Master Bath', 17.5, 0, 7.5, 7.5),
          room('Dressing', 17.5, 7.5, 7.5, 5),
          room('Kitchen', 0, 12.5, 8, 13),
          room('TV Lounge', 8, 12.5, 12.5, 13),
          room('Staircase', 20.5, 12.5, 4.5, 13),
          room('Car Porch', 0, 25.5, 13, 19.5),
          room('Drawing Room', 13, 25.5, 12, 13),
          room('Lawn', 13, 38.5, 12, 6.5)
        ],
        openings: [
          door('Master Bedroom', 'bottom', 15),
          door('Dressing', 'left', 10),
          door('Master Bath', 'bottom', 21.25),
          door('Kitchen', 'right', 16),
          arch('Staircase', 'left', 23.5, 3),
          gate('Car Porch', 6, 8),
          door('Car Porch', 'top', 10.5),
          door('Car Porch', 'top', 4),
          door('Drawing Room', 'left', 30),
          door('Drawing Room', 'top', 15.5),
          arch('Lawn', 'left', 41.75, 4),
          win('Master Bedroom', 'top', 8.75),
          win('Master Bath', 'top', 21.25),
          win('Drawing Room', 'bottom', 18.5)
        ]
      },
      {
        rooms: [
          room('Bedroom 2', 0, 0, 17.5, 12.5),
          room('Bath 2', 17.5, 0, 7.5, 7.5),
          room('Dressing 2', 17.5, 7.5, 7.5, 5),
          room('Kitchen 2', 0, 12.5, 8, 13),
          room('Family Lounge', 8, 12.5, 12.5, 13),
          room('Staircase', 20.5, 12.5, 4.5, 13),
          room('Laundry', 0, 25.5, 6, 8),
          room('Bath 3', 6, 25.5, 6, 8),
          room('Terrace', 0, 33.5, 12, 11.5),
          room('Bedroom 3', 12, 25.5, 13, 13)
        ],
        openings: [
          door('Bedroom 2', 'bottom', 15),
          door('Dressing 2', 'left', 10),
          door('Bath 2', 'bottom', 21.25),
          door('Kitchen 2', 'right', 16),
          arch('Staircase', 'left', 23.5, 3),
          door('Laundry', 'top', 3),
          door('Bath 3', 'right', 29.5),
          door('Bedroom 3', 'top', 15.5),
          door('Terrace', 'right', 36),
          win('Bedroom 2', 'top', 8.75),
          win('Bath 2', 'top', 21.25),
          win('Bedroom 3', 'bottom', 18.5)
        ]
      }
    ]
  },
  {
    key: '7-marla',
    plot: '7-marla',
    name: '7 Marla family house',
    summary: 'Two bedroom suites at the back off a small lobby, kitchen, dining and lounge across the middle, a car porch, drawing room and guest bath at the front, and three bedrooms upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 0, 11.5, 12.5),
          room('Master Bath', 11.5, 0, 6, 8),
          room('Lobby', 11.5, 8, 12, 4.5),
          room('Bath 2', 17.5, 0, 6, 8),
          room('Bedroom 2', 23.5, 0, 11.5, 12.5),
          room('Kitchen', 0, 12.5, 9.5, 13),
          room('Dining', 9.5, 12.5, 9, 13),
          room('TV Lounge', 18.5, 12.5, 12, 13),
          room('Staircase', 30.5, 12.5, 4.5, 13),
          room('Car Porch', 0, 25.5, 14, 19.5),
          room('Drawing Room', 14, 25.5, 13.5, 13),
          room('Guest Bath', 27.5, 25.5, 7.5, 7),
          room('Store', 27.5, 32.5, 7.5, 6),
          room('Lawn', 14, 38.5, 21, 6.5)
        ],
        openings: [
          door('Master Bath', 'left', 4),
          door('Master Bedroom', 'right', 10.25),
          door('Bath 2', 'right', 4),
          door('Bedroom 2', 'left', 10.25),
          arch('Lobby', 'bottom', 21, 4),
          door('Kitchen', 'right', 19),
          arch('Dining', 'right', 19, 6),
          arch('Staircase', 'left', 23.5, 3),
          gate('Car Porch', 7),
          door('Car Porch', 'top', 11.75),
          door('Car Porch', 'top', 4),
          door('Drawing Room', 'left', 30),
          door('Drawing Room', 'top', 23),
          door('Guest Bath', 'left', 29),
          door('Store', 'bottom', 31.25),
          arch('Lawn', 'left', 41.75, 4),
          win('Master Bedroom', 'top', 5.75),
          win('Bedroom 2', 'top', 29.25),
          win('Master Bath', 'top', 14.5),
          win('Bath 2', 'top', 20.5),
          win('Drawing Room', 'bottom', 20.75)
        ]
      },
      {
        rooms: [
          room('Bedroom 3', 0, 0, 11.5, 12.5),
          room('Bath 3', 11.5, 0, 6, 8),
          room('Lobby', 11.5, 8, 12, 4.5),
          room('Bath 4', 17.5, 0, 6, 8),
          room('Bedroom 4', 23.5, 0, 11.5, 12.5),
          room('Kitchen 2', 0, 12.5, 9.5, 13),
          room('Family Lounge', 9.5, 12.5, 21, 13),
          room('Staircase', 30.5, 12.5, 4.5, 13),
          room('Terrace', 0, 25.5, 14, 19.5),
          room('Bedroom 5', 14, 25.5, 13.5, 13),
          room('Bath 5', 27.5, 25.5, 7.5, 7),
          room('Dressing 5', 27.5, 32.5, 7.5, 6)
        ],
        openings: [
          door('Bath 3', 'left', 4),
          door('Bedroom 3', 'right', 10.25),
          door('Bath 4', 'right', 4),
          door('Bedroom 4', 'left', 10.25),
          arch('Lobby', 'bottom', 17.5, 6),
          door('Kitchen 2', 'right', 19),
          arch('Staircase', 'left', 23.5, 3),
          door('Terrace', 'top', 11.75),
          door('Bedroom 5', 'top', 23),
          door('Bath 5', 'left', 29),
          door('Dressing 5', 'left', 35.5),
          win('Bedroom 3', 'top', 5.75),
          win('Bedroom 4', 'top', 29.25),
          win('Bath 3', 'top', 14.5),
          win('Bath 4', 'top', 20.5),
          win('Bedroom 5', 'bottom', 20.75)
        ],
        furniture: [['Dressing 5', DRESSING]]
      }
    ]
  },
  {
    key: '10-marla',
    plot: '10-marla',
    name: '10 Marla family house',
    summary: 'Master suite with dressing and a second bedroom suite at the back, a large lounge, dining and kitchen in the middle, a two-car porch and drawing room at the front, and three bedroom suites and a terrace upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 8, 13, 13),
          room('Master Bath', 13, 8, 6, 8),
          room('Dressing', 13, 16, 6, 5),
          room('Bedroom 2', 19, 8, 11, 13),
          room('Staircase', 0, 21, 4.5, 14),
          room('TV Lounge', 4.5, 21, 19.5, 14),
          room('Bath 2', 24, 21, 6, 7),
          room('Laundry', 24, 28, 6, 7),
          room('Kitchen', 0, 35, 10, 13),
          room('Dining', 10, 35, 11, 13),
          room('Store', 21, 35, 9, 6.5),
          room('Guest Bath', 21, 41.5, 9, 6.5),
          room('Car Porch', 0, 48, 14, 27),
          room('Drawing Room', 14, 48, 16, 14),
          room('Lawn', 14, 62, 16, 13)
        ],
        openings: [
          door('Master Bedroom', 'bottom', 10),
          door('Dressing', 'left', 18.5),
          door('Master Bath', 'bottom', 16),
          door('Bedroom 2', 'bottom', 21.5),
          door('Bath 2', 'top', 27),
          arch('Staircase', 'right', 33),
          door('Laundry', 'left', 31.5),
          door('Kitchen', 'top', 7.5),
          door('Kitchen', 'right', 45),
          arch('Dining', 'top', 15.5, 8),
          door('Store', 'left', 38),
          door('Guest Bath', 'bottom', 25.5),
          gate('Car Porch', 7),
          door('Car Porch', 'top', 12),
          door('Car Porch', 'top', 4),
          door('Drawing Room', 'left', 55),
          arch('Lawn', 'left', 68.5),
          win('Master Bedroom', 'top', 6.5),
          win('Bedroom 2', 'top', 24.5),
          win('Master Bath', 'top', 16),
          win('Drawing Room', 'bottom', 22)
        ]
      },
      {
        rooms: [
          room('Bedroom 3', 0, 8, 13, 13),
          room('Bath 3', 13, 8, 6, 8),
          room('Dressing 3', 13, 16, 6, 5),
          room('Bedroom 4', 19, 8, 11, 13),
          room('Staircase', 0, 21, 4.5, 14),
          room('Family Lounge', 4.5, 21, 19.5, 14),
          room('Bath 4', 24, 21, 6, 7),
          room('Store', 24, 28, 6, 7),
          room('Kitchen 2', 0, 35, 10, 13),
          room('Bedroom 5', 10, 35, 13, 13),
          room('Bath 5', 23, 35, 7, 7),
          room('Dressing 5', 23, 42, 7, 6),
          room('Terrace', 0, 48, 30, 14)
        ],
        openings: [
          door('Bedroom 3', 'bottom', 10),
          door('Dressing 3', 'left', 18.5),
          door('Bath 3', 'bottom', 16),
          door('Bedroom 4', 'bottom', 21.5),
          door('Bath 4', 'top', 27),
          arch('Staircase', 'right', 33),
          door('Store', 'left', 31.5),
          door('Kitchen 2', 'top', 7.5),
          door('Bedroom 5', 'top', 16.5),
          door('Bath 5', 'left', 38.5),
          door('Dressing 5', 'left', 45),
          door('Terrace', 'top', 5),
          win('Bedroom 3', 'top', 6.5),
          win('Bedroom 4', 'top', 24.5),
          win('Bath 3', 'top', 16)
        ],
        furniture: [['Dressing 3', DRESSING], ['Dressing 5', DRESSING]]
      }
    ]
  },
  {
    key: '1-kanal',
    plot: '1-kanal',
    name: '1 Kanal family house',
    summary: 'Two bedroom suites with dressings at the back, a large lounge, dining and kitchen in the middle, a guest suite, drawing room and servant room at the front, a two-car porch and front lawn, and three more suites upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 22, 15, 15),
          room('Master Bath', 15, 22, 7, 8.5),
          room('Dressing', 15, 30.5, 7, 6.5),
          room('Bedroom 2', 22, 22, 14.5, 15),
          room('Bath 2', 36.5, 22, 7, 8.5),
          room('Dressing 2', 36.5, 30.5, 7, 6.5),
          room('Store', 43.5, 22, 6.5, 15),
          room('Staircase', 0, 37, 4.5, 16),
          room('TV Lounge', 4.5, 37, 27, 16),
          room('Dining', 31.5, 37, 10, 16),
          room('Kitchen', 41.5, 37, 8.5, 16),
          room('Guest Bedroom', 0, 53, 15, 15),
          room('Guest Bath', 15, 53, 7, 7.5),
          room('Guest Dressing', 15, 60.5, 7, 7.5),
          room('Drawing Room', 22, 53, 13.5, 15),
          room('Entrance', 35.5, 53, 5.5, 15),
          room('Servant Room', 41, 53, 9, 15),
          room('Car Porch', 28, 68, 22, 22),
          room('Front Lawn', 0, 68, 28, 22)
        ],
        openings: [
          door('Master Bedroom', 'bottom', 12),
          door('Dressing', 'left', 33.75),
          door('Master Bath', 'bottom', 18.5),
          door('Bedroom 2', 'bottom', 27),
          door('Dressing 2', 'left', 33.75),
          door('Bath 2', 'bottom', 40),
          door('Store', 'bottom', 46.75),
          arch('Staircase', 'right', 51),
          arch('Dining', 'left', 45, 8),
          door('Kitchen', 'left', 41),
          door('Guest Bedroom', 'top', 12),
          door('Guest Bath', 'left', 56.75),
          door('Guest Dressing', 'left', 64.25),
          door('Drawing Room', 'top', 28),
          door('Drawing Room', 'bottom', 31.5),
          arch('Entrance', 'top', 38.25),
          door('Entrance', 'bottom', 38.25),
          door('Servant Room', 'top', 46),
          door('Servant Room', 'bottom', 46),
          gate('Car Porch', 39),
          arch('Front Lawn', 'right', 85, 4),
          win('Master Bedroom', 'top', 7.5),
          win('Bedroom 2', 'top', 29.25),
          win('Master Bath', 'top', 18.5),
          win('Bath 2', 'top', 40),
          win('Guest Bedroom', 'bottom', 7.5),
          win('Drawing Room', 'bottom', 25)
        ]
      },
      {
        rooms: [
          room('Bedroom 3', 0, 22, 15, 15),
          room('Bath 3', 15, 22, 7, 8.5),
          room('Dressing 3', 15, 30.5, 7, 6.5),
          room('Bedroom 4', 22, 22, 14.5, 15),
          room('Bath 4', 36.5, 22, 7, 8.5),
          room('Dressing 4', 36.5, 30.5, 7, 6.5),
          room('Store', 43.5, 22, 6.5, 15),
          room('Staircase', 0, 37, 4.5, 16),
          room('Family Lounge', 4.5, 37, 27, 16),
          room('Kitchen 2', 31.5, 37, 10, 16),
          room('Laundry', 41.5, 37, 8.5, 16),
          room('Bedroom 5', 0, 53, 15, 15),
          room('Bath 5', 15, 53, 7, 7.5),
          room('Dressing 5', 15, 60.5, 7, 7.5),
          room('Terrace', 22, 53, 28, 15)
        ],
        openings: [
          door('Bedroom 3', 'bottom', 12),
          door('Dressing 3', 'left', 33.75),
          door('Bath 3', 'bottom', 18.5),
          door('Bedroom 4', 'bottom', 27),
          door('Dressing 4', 'left', 33.75),
          door('Bath 4', 'bottom', 40),
          door('Store', 'bottom', 46.75),
          arch('Staircase', 'right', 51),
          door('Kitchen 2', 'left', 45),
          door('Laundry', 'left', 41),
          door('Bedroom 5', 'top', 12),
          door('Bath 5', 'left', 56.75),
          door('Dressing 5', 'left', 64.25),
          door('Terrace', 'top', 27),
          win('Bedroom 3', 'top', 7.5),
          win('Bedroom 4', 'top', 29.25),
          win('Bath 3', 'top', 18.5),
          win('Bath 4', 'top', 40),
          win('Bedroom 5', 'bottom', 7.5)
        ]
      }
    ]
  },
  {
    key: '2-kanal',
    plot: '2-kanal',
    name: '2 Kanal family house',
    summary: 'A wide house with open garden on one side: two suites, a study and store at the back, a very large lounge, dining and kitchen in the middle, a guest suite, drawing room, servant room and laundry at the front, a two-car porch, and three suites and a big terrace upstairs.',
    floors: [
      {
        rooms: [
          room('Master Bedroom', 0, 12, 16, 16),
          room('Master Bath', 16, 12, 8, 9),
          room('Dressing', 16, 21, 8, 7),
          room('Bedroom 2', 24, 12, 15, 16),
          room('Bath 2', 39, 12, 7, 9),
          room('Dressing 2', 39, 21, 7, 7),
          room('Study', 46, 12, 10, 16),
          room('Store', 56, 12, 10, 16),
          room('Staircase', 0, 28, 5, 18),
          room('TV Lounge', 5, 28, 34, 18),
          room('Dining', 39, 28, 14, 18),
          room('Kitchen', 53, 28, 13, 18),
          room('Guest Bedroom', 0, 46, 16, 16),
          room('Guest Bath', 16, 46, 8, 8),
          room('Guest Dressing', 16, 54, 8, 8),
          room('Drawing Room', 24, 46, 20, 16),
          room('Entrance', 44, 46, 6, 16),
          room('Servant Room', 50, 46, 9, 16),
          room('Laundry', 59, 46, 7, 16),
          room('Car Porch', 24, 62, 26, 28),
          room('Front Lawn', 0, 62, 24, 28)
        ],
        openings: [
          door('Master Bedroom', 'bottom', 13),
          door('Dressing', 'left', 24.5),
          door('Master Bath', 'bottom', 20),
          door('Bedroom 2', 'bottom', 30),
          door('Dressing 2', 'left', 24.5),
          door('Bath 2', 'bottom', 42.5),
          door('Study', 'bottom', 49.5),
          door('Store', 'bottom', 61),
          arch('Staircase', 'right', 44),
          arch('Dining', 'left', 37, 8),
          door('Kitchen', 'left', 33),
          door('Guest Bedroom', 'top', 13),
          door('Guest Bath', 'left', 50),
          door('Guest Dressing', 'left', 58),
          door('Drawing Room', 'top', 31),
          door('Drawing Room', 'bottom', 30),
          arch('Entrance', 'top', 47),
          door('Entrance', 'bottom', 47),
          door('Servant Room', 'top', 56),
          door('Laundry', 'top', 62.5),
          door('Laundry', 'right', 54),
          gate('Car Porch', 37),
          arch('Front Lawn', 'right', 84, 4),
          win('Master Bedroom', 'top', 8),
          win('Bedroom 2', 'top', 31.5),
          win('Study', 'top', 51),
          win('Master Bath', 'top', 20),
          win('Bath 2', 'top', 42.5),
          win('Guest Bedroom', 'bottom', 8),
          win('Drawing Room', 'bottom', 38)
        ]
      },
      {
        rooms: [
          room('Bedroom 3', 0, 12, 16, 16),
          room('Bath 3', 16, 12, 8, 9),
          room('Dressing 3', 16, 21, 8, 7),
          room('Bedroom 4', 24, 12, 15, 16),
          room('Bath 4', 39, 12, 7, 9),
          room('Dressing 4', 39, 21, 7, 7),
          room('Study 2', 46, 12, 10, 16),
          room('Store', 56, 12, 10, 16),
          room('Staircase', 0, 28, 5, 18),
          room('Family Lounge', 5, 28, 34, 18),
          room('Dining 2', 39, 28, 14, 18),
          room('Kitchen 2', 53, 28, 13, 18),
          room('Bedroom 5', 0, 46, 16, 16),
          room('Bath 5', 16, 46, 8, 8),
          room('Dressing 5', 16, 54, 8, 8),
          room('Terrace', 24, 46, 42, 16)
        ],
        openings: [
          door('Bedroom 3', 'bottom', 13),
          door('Dressing 3', 'left', 24.5),
          door('Bath 3', 'bottom', 20),
          door('Bedroom 4', 'bottom', 30),
          door('Dressing 4', 'left', 24.5),
          door('Bath 4', 'bottom', 42.5),
          door('Study 2', 'bottom', 49.5),
          door('Store', 'bottom', 61),
          arch('Staircase', 'right', 44),
          arch('Dining 2', 'left', 37, 8),
          door('Kitchen 2', 'left', 33),
          door('Bedroom 5', 'top', 13),
          door('Bath 5', 'left', 50),
          door('Dressing 5', 'left', 58),
          door('Terrace', 'top', 31),
          win('Bedroom 3', 'top', 8),
          win('Bedroom 4', 'top', 31.5),
          win('Study 2', 'top', 51),
          win('Bath 3', 'top', 20),
          win('Bath 4', 'top', 42.5),
          win('Bedroom 5', 'bottom', 8)
        ],
        furniture: [['Dressing 3', DRESSING], ['Dressing 4', DRESSING], ['Dressing 5', DRESSING]]
      }
    ]
  }
]

// Dressings on the ground floor get wardrobes too.
for (const design of TEMPLATE_DESIGNS) {
  for (const floor of design.floors) {
    const listed = new Set((floor.furniture ?? []).map(([name]) => name))
    for (const r of floor.rooms) {
      if (/dressing/i.test(r.name) && !listed.has(r.name)) (floor.furniture ??= []).push([r.name, DRESSING])
    }
  }
}

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function emptyPlan(design, preset) {
  const wallHeight = Math.round(WALL_HEIGHT_FT * FT * 100) / 100
  const doc = new FloorplanDocument({
    name: design.name,
    unit: 'm',
    wallHeight,
    wallThickness: 0.23,
    wallModel: SHARED_WALLS,
    outsideWallThickness: BRICK_THICKNESS.double,
    insideWallThickness: BRICK_THICKNESS.single,
    floorHeight: 0.15,
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    floors: design.floors.map((_, i) => ({
      id: `floor_${i + 1}`,
      name: i === 0 ? 'Ground' : i === 1 ? 'First' : `Floor ${i + 1}`,
      level: i,
      wallHeight,
      floorHeight: 0.15
    })),
    currentFloorId: 'floor_1'
  })
  // The plot, centred on the origin like a new project's (engine/example/js/Embed.js).
  doc.addRoom({
    id: 'plot',
    name: 'Plot',
    x: 0,
    z: 0,
    width: Math.round(preset.widthFt * FT * 1000) / 1000,
    depth: Math.round(preset.depthFt * FT * 1000) / 1000,
    shape: 'square',
    floorId: 'floor_1'
  })
  return doc.floorplan
}

// Plan feet to the editor's world x (top/bottom walls) or z (left/right walls).
const along = (frame, side, at) => Math.round((['top', 'bottom'].includes(side) ? frame.minX + at * FT : frame.maxZ - at * FT) * 1000) / 1000

/** The operations that build one floor of a design (applyAiPlan.js format). */
export function floorOperations(design, floorIndex, frame) {
  const floor = design.floors[floorIndex]
  const floorId = `floor_${floorIndex + 1}`
  const idOf = (name) => `${floorId}_${slug(name)}`
  const ops = []
  for (const r of floor.rooms) ops.push({ op: 'add_room', id: idOf(r.name), name: r.name, ...toWorld(frame, r), floorId, label: `Add ${r.name}` })
  for (const o of floor.openings) {
    ops.push({
      op: 'add_opening',
      room: idOf(o.room),
      kind: o.kind,
      side: o.side,
      ...(o.at !== undefined ? { at: along(frame, o.side, o.at) } : {}),
      ...(o.width ? { width: Math.round(o.width * FT * 1000) / 1000 } : {}),
      ...(o.open ? { open: true } : {}),
      label: `${o.open ? 'Archway' : o.kind === 'door' ? 'Door' : 'Window'} on the ${o.side} wall of ${o.room}`
    })
  }
  for (const r of floor.rooms) {
    const kind = /dressing/i.test(r.name) ? null : roomKind(r.name)
    if (kind) ops.push({ op: 'furnish_room', room: idOf(r.name), kind, label: `Furnish ${r.name}` })
  }
  for (const [name, items] of floor.furniture ?? []) {
    for (const [type, count] of items) ops.push({ op: 'add_furniture', room: idOf(name), type, count, label: `${type} in ${name}` })
  }
  return ops
}

/**
 * Builds a template's building file. Returns { building, skipped }: skipped
 * lists anything the engine could not place (empty for a good design).
 */
export function buildTemplate(design) {
  const preset = PLOT_PRESETS.find((p) => p.key === design.plot)
  let floorplan = emptyPlan(design, preset)
  const frame = planFrame(floorplan)
  const skipped = []
  design.floors.forEach((_, i) => {
    floorplan = { ...floorplan, currentFloorId: `floor_${i + 1}` }
    const result = applyAiOperations(floorplan, floorOperations(design, i, frame))
    floorplan = result.floorplan
    skipped.push(...result.skipped.map((s) => ({ floor: i + 1, label: s.label, reason: s.reason })))
  })
  floorplan.currentFloorId = 'floor_1'
  return { building: createBuildingFile(floorplan, { name: design.name, createdAt: '2026-11-18T00:00:00.000Z' }), skipped }
}

function describe(design) {
  const preset = PLOT_PRESETS.find((p) => p.key === design.plot)
  const names = design.floors.flatMap((f) => f.rooms.map((r) => r.name))
  const count = (kind) => names.filter((n) => roomKind(n) === kind).length
  return {
    key: design.key,
    name: design.name,
    summary: design.summary,
    plot: { preset: preset.key, label: preset.label, marla: preset.marla, widthFt: preset.widthFt, depthFt: preset.depthFt },
    floors: design.floors.length,
    bedrooms: count('bedroom'),
    bathrooms: count('bathroom'),
    rooms: design.floors.map((f, i) => ({ floor: i === 0 ? 'Ground' : 'First', names: f.rooms.map((r) => r.name) }))
  }
}

// Built once, on first use: the engine's furniture placement is quick, but
// there is no need to repeat it on every request.
let cache = null
function all() {
  if (!cache) {
    cache = TEMPLATE_DESIGNS.map((design) => {
      const { building } = buildTemplate(design)
      return { ...describe(design), building, preview: planPreview(building) }
    })
  }
  return cache
}

/** Cards for the gallery: details and a light plan drawing, without the building file. */
export function listTemplates() {
  return all().map(({ building, ...card }) => card)
}

/** One template with its building file, or null. */
export function getTemplate(key) {
  return all().find((t) => t.key === key) ?? null
}
