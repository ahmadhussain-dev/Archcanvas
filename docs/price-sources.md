# Where the estimate's prices come from

Last calibrated: **20 November 2026**. Code: `api/src/lib/localPrices.js` (national prices), `api/src/lib/cityAdjustments.js` (region percentages) and `api/src/lib/estimate.js` (quantities, extra lines and the range). Check: `api/tests/calibration.test.js`.

## What the estimate is, and is not

The estimate is a planning **range** for a grey structure, not a contractor's quote. Pinpoint accuracy is not honestly possible before a structural design and a bill of quantities: published 2026 figures for the same plot size overlap a lot. Milkiyat's 2026 cost guide gives, for double storey grey structures:

| House | Covered area | Grey structure (2026) |
|---|---|---|
| 5 Marla | 1,900-2,200 sq ft | PKR 56-90 lakh |
| 8 Marla | not given (2,500-2,900 sq ft is typical) | PKR 76-98 lakh |
| 10 Marla | 3,200-4,000 sq ft | PKR 95 lakh-1.2 crore |

The ranges overlap because covered area, steel grade, brick quality and design complexity differ from house to house. A simple rectangular design with few beams lands at the bottom; double-height lounges, large spans and heavy elevations land at the top. Soil, location, labour and timing move it further.

So the app shows:

- a **likely** figure, and a **range** from 12% below (simple design, standard materials) to 25% above (complex design, A+ materials);
- a "Your real cost depends on many things" panel listing those factors, with a link to the [Milkiyat article](https://milkiyat.com/articles/house-construction-cost-in-pakistan-2026-per-sq-ft-rates-per-marla-cost-full-budget-2);
- no accuracy percentage.

## One national rate set, plus a percentage per region

Earlier versions priced each of 40 cities separately. The differences between cities (a few percent) are smaller than the differences between two contractors in the same city (20% or more), so city-wise prices looked precise without being more accurate. Now:

1. Every estimate uses **one national price list** (below).
2. The whole estimate, before the contingency, moves by **one percentage for the project's region**. It shows as a "Location adjustment" line.

| Region | Cities | Default |
|---|---|---|
| Islamabad, Rawalpindi and nearby | Islamabad, Rawalpindi, Wah Cantonment, Abbottabad, Jhelum | +8% |
| Lahore, Gujranwala, Sialkot and nearby | Lahore, Gujranwala, Sialkot, Sheikhupura, Gujrat, Kasur, Okara, Kamoke, Hafizabad | +2% |
| Karachi | Karachi | 0% |
| Faisalabad and central Punjab | Faisalabad, Sargodha, Jhang, Sahiwal, Chiniot and any city not listed | -3% |
| Peshawar and Khyber Pakhtunkhwa | Peshawar, Mardan, Mingora, Kohat, Dera Ismail Khan | -4% |
| Quetta and Balochistan | Quetta, Turbat | -4% |
| Multan and south Punjab | Multan, Bahawalpur, Rahim Yar Khan, Dera Ghazi Khan, Sadiqabad, Burewala, Khanewal, Muzaffargarh | -5% |
| Hyderabad, Sukkur and the rest of Sindh | Hyderabad, Sukkur, Larkana, Nawabshah, Mirpur Khas | -10% |

**To change a percentage:** an admin edits it under "City and region adjustments" on `/admin/prices` (saved in the database; "Default" puts it back), or a developer changes `pct` in `REGIONS` in `api/src/lib/cityAdjustments.js`. To move a city to another region, edit `REGION_BY_CITY` in the same file.

The defaults are rounded from the PBS city construction input prices (January and September 2026: bricks, sand, steel, mason wages; Islamabad dearest, Hyderabad cheapest) and the published 10 Marla grey structure rates per city in the table at the end.

## How each national price is found

| Material | Daily source | Fallback |
|---|---|---|
| Cement | ICONS cement price list, read every day: the Pakistan average (middle of the cities listed) | national reference |
| Steel | ICONS steel price list, read every day: the Pakistan average | national reference |
| Bricks, sand, crush, labour, pipes | none publishes these daily | national reference x market nudge (half of the live cement move, limited to -20% / +25%) |

A price jump of more than 30% from yesterday waits for the next check to confirm it. An admin can still type a national price; it overrides the automatic one for 30 days.

## National reference prices

| Item | Value | Basis | Checked |
|---|---|---|---|
| Steel, Grade 60 | Rs 257,000 / ton | contractor Rs 255/kg (Oct 2026); ICONS brands Rs 256-261/kg (19 Nov 2026); PBS SPI Rs 254-263/kg | 2026-11-19 |
| Cement | Rs 1,600 / bag | contractor Rs 1,650 (Bestway/DG); PBS SPI 17 Nov 2026 Rs 1,486 (Karachi) to Rs 1,657 (Multan); ICONS Rs 1,505-1,610 | 2026-11-20 |
| Bricks, first class | Rs 20 each | dealers Rs 15,000-19,000 per 1,000; PBS Islamabad Rs 24,700 per 1,000; contractor A+ awwal Rs 25 | 2026-11-20 |
| Sand | Rs 62 / cft | contractor Ravi Rs 60; dealers Rs 50-66 | 2026-11-20 |
| Crush | Rs 150 / cft | contractor Sargodha A-plant Rs 165; Lahore dealers Rs 130-137 | 2026-11-20 |
| Labour (theka) | Rs 580 / sq ft | Zameen Rs 481-502 (Oct-Nov 2026); contractor Rs 700; Lahore labour-only Rs 450-850 | 2026-11-20 |
| Pipes and fittings | Rs 150 / sq ft | contractor electrical + sanitary Rs 265,000 for 2,000 sq ft (~Rs 133); Zameen ~Rs 170 | 2026-11-20 |

Where the contractor's A+ quote is above the market middle, the national price sits between the two; the top of the range covers A+ materials.

## Quantities per sq ft of covered area

| Item | Used | Published take-offs and the contractor quote |
|---|---|---|
| Steel | 1.5 kg | Zameen 10 Marla 1.5; Zameen 5 Marla 1.5; Glorious 10 Marla 1.8; contractor 1.25 |
| Cement | 0.28 bag | 0.24, 0.31, 0.35; contractor 0.225 |
| Bricks | 28 | 27, 28, 26; contractor 30 |
| Sand | 1.8 cft | 2.5, 1.5, 2.1; contractor 1.0 |
| Crush | 0.85 cft | 0.8, 0.9, 0.9; contractor 0.75 |

Extra lines: groundwork (excavation, termite spray, brick aggregate, back filling, DPC) Rs 220 per sq ft of footprint; door and window frames Rs 70 per sq ft; water tanks, septic tank and sewer Rs 250,000; main gate, safety grills and roof-top finish Rs 225,000; wastage 3% and transport 2% of materials; contingency 5%.

## Check against a real contractor quote

A contractor's 5 Marla grey structure estimate (25 x 45 plot, 2,000 sq ft covered, double storey, A+ materials, 20 Oct 2026) totals **Rs 5,554,200** (about Rs 2,777 per sq ft): bricks 60,000 x Rs 25, cement 450 bags x Rs 1,650, steel 2,500 kg x Rs 255, crush 1,500 cft x Rs 165, sand 2,000 cft x Rs 60, labour 2,000 sq ft x Rs 700, excavation, termite spray, brick aggregate, back filling, DPC, 15 door frames, electrical and sanitary fittings, grills, main gate and roof-top marble.

ArchCanvas for the same 2,000 sq ft, national rates: likely **Rs 60.3 lakh**, range Rs 53.0-75.3 lakh. Without the lines the quote leaves out (tanks, wastage, transport, contingency: Rs 7.2 lakh) it is **Rs 53.1 lakh, 4% below the quote**. The differences: we use more steel and cement (3.0 t and 560 bags against 2.5 t and 450) but cheaper bricks and labour (Rs 20 and Rs 580 against A+ Rs 25 and Rs 700). The test fails if the like-for-like gap goes over 10%.

## Results: national rates and Milkiyat

| House (double storey) | Covered area | ArchCanvas likely | ArchCanvas range | Milkiyat |
|---|---|---|---|---|
| 5 Marla | 2,050 sq ft | Rs 61.6 lakh | 54.2-77.0 lakh | 56-90 lakh |
| 8 Marla | 2,700 sq ft | Rs 79.6 lakh | 70.0-99.5 lakh | 76-98 lakh |
| 10 Marla | 3,600 sq ft | Rs 1.045 crore | 0.92-1.31 crore | 95 lakh-1.2 crore |

Milkiyat's top for 5 Marla (90 lakh, about Rs 4,700 per sq ft) is a premium build above our high end.

## Results: 10 Marla, two floors (about 3,360 sq ft) per city

| City | Region % | ArchCanvas likely | Market sources |
|---|---|---|---|
| Lahore | +2% | Rs 2,970 / sq ft | Zameen 2,874 (16 Oct 2026); Glorious 3,000-3,250 (Nov 2026); ACCO 2,800-3,500 |
| Karachi | 0% | Rs 2,912 | Zameen 2,921 (16 Oct 2026); Zell standard 2,700-3,100 (Oct 2026); DBL 2,500-3,200 |
| Islamabad / Rawalpindi | +8% | Rs 3,145 | Zameen Islamabad 3,119 (11 Nov 2026); Avenir 3,500; DBL 2,800-3,500 |
| Faisalabad | -3% | Rs 2,824 | DBL 2,400-2,900 (Jun 2026) |
| Multan | -5% | Rs 2,766 | DBL 2,300-2,800 (Jun 2026) |
| Peshawar, Quetta | -4% | Rs 2,795 | no published grey structure rate found |
| Hyderabad | -10% | Rs 2,621 | none found; PBS materials lowest of the big cities |

Covered area is the plot times the number of floors, so a 25 x 45 plot counts 2,250 sq ft over two floors, where a real house with setbacks often covers about 2,000. Draw the house smaller than the plot, or read the per sq ft figure, when comparing with a quote.

## How to update

1. Change `ratePkr` and `checked` in `REFERENCE_RATES` in `api/src/lib/localPrices.js`, or a quantity or extra in `api/src/lib/estimate.js`, or a region `pct` in `api/src/lib/cityAdjustments.js` (or on `/admin/prices`).
2. If the market moved, update `MILKIYAT` and `CITY_RANGES` in `api/tests/calibration.test.js` with the new source figures and dates.
3. Run `npm test` in `api/`. The next daily price check rewrites the automatic national prices.

## Sources

- [Milkiyat: House construction cost in Pakistan 2026, per sq ft rates and per marla cost](https://milkiyat.com/articles/house-construction-cost-in-pakistan-2026-per-sq-ft-rates-per-marla-cost-full-budget-2) (grey structure ranges and cost factors)
- A contractor's 5 Marla grey structure estimate, 20 Oct 2026 (shared by the project team)
- Zameen construction cost calculator, 10 Marla grey structure: [Lahore](https://www.zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-lahore-1), [Karachi](https://www.zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-karachi-2/), [Islamabad](https://zameen.com/tools/construction-cost-calculator/10-marla-grey-construction-cost-islamabad-3)
- [Zameen: 10 Marla A-category grey structure take-off](https://www.zameen.com/blog/construction-cost-of-a-10-marla-house-grey-structure.html), [5 Marla take-off](https://www.zameen.com/blog/grey-structure-cost-5-marla-house.html)
- [Glorious Builders: grey structure rate in Lahore 2026](https://gloriousbuilders.com/grey-structure-construction-cost-in-lahore-with-materials-and-labour/)
- [which.pk: grey structure cost per sq ft, Nov 2026](https://which.pk/property/guides/grey-structure-cost/)
- [DBL: grey structure cost per sq ft, June 2026](https://d-b-l.com/grey-structure-cost-per-square-foot-pakistan/)
- [Zell.pk: house construction cost in Karachi 2026](https://www.zell.pk/guides/house-construction-cost-karachi)
- [The News: construction costs soar, show regional gaps (PBS, Jan 2026)](https://www.thenews.pk/print/1396954-construction-costs-soar-show-regional-gaps)
- [Daily Qudrat: cement and steel prices, 17 Nov 2026](https://en.dailyqudrat.pk/112813/)
- ICONS [cement](https://icons.com.pk/cement-rate-today) and [steel](https://icons.com.pk/steel-rate-today) price lists
