# Where the estimate's prices come from

Last calibrated: **19 November 2026**. Code: `api/src/lib/localPrices.js` (prices and city factors) and `api/src/lib/estimate.js` (quantities and extra lines). Check: `api/tests/calibration.test.js`.

The estimate is a planning figure for a grey structure, not a contractor's quote. It is calibrated so that a typical 10 Marla double storey house lands inside the range that published Pakistani market sources give for each city. No source publishes an official grey structure rate, and the sources disagree with each other, so the ranges below are wide. The estimate cannot honestly promise a fixed accuracy percentage; the app shows a likely figure with a range of -10% / +15%.

## How the price of each material is found

| Material | Daily source | Fallback |
|---|---|---|
| Cement | ICONS cement price list, read every day | Faisalabad reference x city factor |
| Steel | ICONS steel price list, read every day | Faisalabad reference x city factor |
| Bricks, sand, crush, labour, pipes | none publishes these daily per city | Faisalabad reference x city factor x market nudge (half of the live cement move, limited to -20% / +25%) |

An admin can still set a price for a city; it overrides the automatic one for 30 days.

## Reference prices (Faisalabad)

| Item | Value | Basis | Checked |
|---|---|---|---|
| Steel, Grade 60 | Rs 257,000 / ton | ICONS brands Rs 256-261/kg (19 Nov 2026); PBS SPI Rs 254-263/kg (17 Nov 2026) | 2026-11-19 |
| Cement | Rs 1,560 / bag | PBS SPI Faisalabad Rs 1,580 (17 Nov 2026, reported by Daily Qudrat); ICONS brands Rs 1,505-1,610 | 2026-11-17 |
| Bricks, first class | Rs 17 each | Faisalabad A-class Rs 14,000-19,000 per 1,000 (Wooden Box Trading Sep 2026, Civil Construction Guide Sep 2026) | 2026-11-19 |
| Sand | Rs 65 / cft | Chenab Rs 50-65, Ravi Rs 42-55 in Faisalabad (Civil Construction Guide); Glorious Builders Lahore Rs 65-66 | 2026-11-19 |
| Crush | Rs 145 / cft | Sargodha crush: Glorious Builders Lahore Rs 130-137 (Nov 2026); Zameen 5 Marla Rs 146 (Oct 2023) | 2026-11-19 |
| Labour (theka) | Rs 480 / sq ft | Zameen 10 Marla labour Rs 481 Lahore, Rs 502 Karachi, Rs 501 Islamabad per sq ft (Oct-Nov 2026); Lahore labour-only Rs 450-850 (which.pk, Nov 2026) | 2026-11-16 |
| Pipes and electric | Rs 170 / sq ft | Zameen 10 Marla plumbing and electrical material without pumps, about Rs 170 per sq ft (Oct 2026) | 2026-11-16 |

## City factors

Factors compare a region with Faisalabad (1 = same). They follow the government's (PBS) city price data:

- **PBS urban construction input prices, January 2026** (The News, 3 Feb 2026): bricks per 1,000 Islamabad 24,732, Peshawar 18,331, Karachi 18,000, Lahore 17,463, Quetta 14,742; sand per truck Islamabad 11,773, Lahore 7,573, Karachi 6,811, Peshawar 6,208, Quetta 6,199; steel per ton Quetta 227,994, Islamabad 222,583, Lahore 212,333, Karachi 211,331, Peshawar 208,162, Hyderabad 204,750; mason per day Karachi 2,478, Islamabad 2,404, Lahore 2,260, Quetta 2,194, Peshawar 2,000.
- **PBS SPI cement, 17 Nov 2026**: Karachi 1,486, Rawalpindi 1,497, Islamabad 1,523, Quetta 1,570, Faisalabad 1,580, Peshawar 1,591, Hyderabad 1,607, Lahore 1,653, Multan 1,657.
- **PBS-based bulk material cost per sq ft, Sep 2026** (which.pk): Islamabad and Rawalpindi highest, then Gujranwala, Lahore, Peshawar, Faisalabad, Karachi, Multan, Quetta, Hyderabad lowest.
- **PBS mason wage, Sep 2026**: Lahore 2,461, Karachi 2,482, Peshawar 2,421, Multan 1,909.

Regions: Lahore (Lahore, Gujranwala, Sialkot, Sheikhupura, Kasur, Gujrat, Kamoke, Hafizabad), central Punjab (Faisalabad and the rest), Potohar (Islamabad, Rawalpindi, Wah, Abbottabad, Jhelum), south Punjab, Karachi, rest of Sindh, Khyber Pakhtunkhwa, Balochistan.

## Quantities per sq ft of covered area

| Item | Used | Published take-offs |
|---|---|---|
| Steel | 1.8 kg | Zameen 10 Marla A (3,300 sq ft) 5 t = 1.5 kg; Zameen 5 Marla (1,975 sq ft) 3 t = 1.5 kg; Glorious 10 Marla (3,400 sq ft) 6 t = 1.8 kg |
| Cement | 0.34 bag | 0.24, 0.31, 0.35 |
| Bricks | 27 | 27, 28, 26 |
| Sand | 2.2 cft | 2.5, 1.5, 2.1 |
| Crush | 0.9 cft | 0.8, 0.9, 0.9 |

The previous version used 3.5 kg steel and 0.44 bags per sq ft, about double the published take-offs, which pushed every city about Rs 400-500 per sq ft above the market.

## Result: 10 Marla, two floors (about 3,360 sq ft), no online prices yet

| City | ArchCanvas likely | ArchCanvas range | Market sources |
|---|---|---|---|
| Lahore | Rs 2,937 | 2,643-3,378 | Zameen 2,874 (16 Oct 2026); Glorious 3,000-3,250 (Nov 2026); ACCO 2,800-3,500; Avenir 3,300 |
| Karachi | Rs 2,858 | 2,572-3,287 | Zameen 2,921 (16 Oct 2026); Zell standard 2,700-3,100 (Oct 2026); DBL 2,500-3,200 (Jun 2026) |
| Islamabad / Rawalpindi | Rs 3,161 | 2,845-3,635 | Zameen Islamabad 3,119 (11 Nov 2026); Avenir 3,500; DBL 2,800-3,500 |
| Faisalabad | Rs 2,814 | 2,533-3,236 | DBL 2,400-2,900 (Jun 2026) |
| Multan | Rs 2,745 | 2,471-3,157 | DBL 2,300-2,800 (Jun 2026) |
| Peshawar | Rs 2,784 | 2,506-3,202 | no published grey structure rate found; PBS materials close to Faisalabad |
| Quetta | Rs 2,753 | 2,478-3,166 | none found; PBS materials below Faisalabad, steel dearer |
| Hyderabad | Rs 2,575 | 2,318-2,961 | none found; PBS materials lowest of the big cities |

A 5 Marla house comes out about Rs 70 per sq ft higher and a 1 Kanal house about Rs 40 lower, because the fixed tank and sewer cost is spread over less or more area. Zameen shows the opposite for 1 Kanal (about Rs 105 higher), because bigger houses are usually built to a higher spec; the estimate does not model spec.

Once the daily check reads live cement and steel prices, the figures move with them: cement at Rs 1,400 lowers Lahore to about Rs 2,854, cement at Rs 1,700 raises it to about Rs 3,000.

## What is still an estimate

- Bricks, sand, crush, labour and pipes are not read from any daily source; they are the reference price times a city factor, nudged by the cement price.
- Peshawar, Quetta, Hyderabad and the smaller cities have no published grey structure rate to check against; their factors rest on PBS material prices only.
- Gujranwala: the DBL guide (Jun 2026) puts it at Rs 2,300-2,700, but PBS material prices put it above Lahore. The code follows PBS, so Gujranwala shows Lahore's figure.
- Many rate sites are updated irregularly and contradict themselves. Values were cross-checked across at least two sources where possible.

## How to update

1. Change `ratePkr` and `checked` in `REFERENCE_RATES` (or a factor in `REGION_FACTORS`) in `api/src/lib/localPrices.js`.
2. If the market moved, update `MARKET_RANGES` in `api/tests/calibration.test.js` with the new source figures and dates.
3. Run `npm test` in `api/`. The next daily price check rewrites every automatic city price with the new numbers.

## Sources

- Zameen construction cost calculator, 10 Marla grey structure: [Lahore](https://www.zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-lahore-1), [Karachi](https://www.zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-karachi-2/), [Islamabad](https://zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-islamabad-3)
- [Zameen: 10 Marla A-category grey structure take-off](https://www.zameen.com/blog/construction-cost-of-a-10-marla-house-grey-structure.html), [5 Marla take-off](https://www.zameen.com/blog/grey-structure-cost-5-marla-house.html)
- [Glorious Builders: grey structure rate in Lahore 2026](https://gloriousbuilders.com/grey-structure-construction-cost-in-lahore-with-materials-and-labour/)
- [which.pk: grey structure cost per sq ft, Nov 2026](https://which.pk/property/guides/grey-structure-cost/)
- [DBL: grey structure cost per sq ft, June 2026](https://d-b-l.com/grey-structure-cost-per-square-foot-pakistan/)
- [Zell.pk: house construction cost in Karachi 2026](https://www.zell.pk/guides/house-construction-cost-karachi)
- [The News: construction costs soar, show regional gaps (PBS, Jan 2026)](https://www.thenews.pk/print/1396954-construction-costs-soar-show-regional-gaps)
- [Daily Qudrat: cement and steel prices, 17 Nov 2026](https://en.dailyqudrat.pk/112813/)
- ICONS [cement](https://icons.com.pk/cement-rate-today) and [steel](https://icons.com.pk/steel-rate-today) price lists
- [Wooden Box Trading: bricks price in Pakistan 2026](https://woodenboxtrading.com/bricks-price-in-pakistan-2026/)
- [Civil Construction Guide: grey structure material rates 2026](https://civilconstructionguide.com/grey-structure-material-rates-in-pakistan/)
