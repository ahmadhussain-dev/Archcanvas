# ArchCanvas UI/UX guideline

Set by Ahmad Hussain on 2026-10-01 as the main guideline for all ArchCanvas screens and redesign work.

**Most important rule:** do not design ArchCanvas like a dashboard that happens to contain a floor plan. Design it like a floor-plan workspace that shows dashboard information only when the user needs it.

**Feel:** precise, calm, architectural, modern and intelligent. It should sit between Figma's simplicity, Planner 5D's visual interaction and CAD precision, with its own identity built on Pakistani residential planning, real plot sizes, AI and cost.

## Workspace
1. **Canvas first.** The floor plan is always the main visual focus. Keep toolbars, sidebars and controls compact, and don't let forms or panels overpower the plan.
2. **Visual, not form-heavy.** Prefer previews, plans, cards, diagrams and direct editing. House-design software should feel spatial.
3. **Progressive complexity.** Beginners see only the essential controls. Advanced tools appear when they're needed.
4. **Contextual properties.** The right sidebar depends on what's selected: room settings for a room, wall settings for a wall, door settings for a door, and project settings when nothing is selected.
5. **Direct manipulation.** Users drag, resize, rotate and move things and see the result immediately. Avoid unnecessary dialogs.
6. **2D and 3D are both core views.** Offer 2D, 3D and Split. 3D is never just a tiny preview card. Selecting something in 2D selects the same thing in 3D.
7. **Architectural plan quality.** Use proper wall thickness, door swings, window symbols, dimension lines, furniture silhouettes, centered room labels and snapping indicators.
17. **Simpler left toolbar.** Group tools into Select, Build, Furnish, Document and Style.
18. **Expandable toolbar labels.** Icon-only by default, with a tooltip on hover. An expanded mode shows labels for beginners.
41. **Bottom status bar for secondary controls:** floor, grid, snap, units, scale and zoom.
42. **Clear empty states.** Never show just a blank screen. Offer Draw, Use template, Upload plan and Start from plot.
43. **Errors explain what to do.** For example: "This wall does not connect to existing geometry. Try snapping to the endpoint."
44. **Animation only when it helps:** room created, saved, AI processing, selection changes. Keep motion subtle.

## Visual system
8. **Subtle room colours.** Room fills are mostly neutral. Blue means selection, violet means AI suggestions, amber means warnings, green means valid or success, and red is only for real errors.
9. **Brick orange `#B2441C` only for major actions,** such as Start designing, Generate layout and Apply AI change.
10. **Blueprint blue `#1E5AA8` for interaction:** selection, links, snapping, geometry highlights and plan tools.
11. **Navy `#13202C` for structure:** main text, architectural geometry, important headings and dark navigation.
12. **Functional type.** Inter or Sora for the UI, IBM Plex Mono for measurements and prices, and a custom ArchCanvas wordmark for the logo.
13. **Architectural logo.** Wordmark first, with a custom `A` that can reference a roof line, floor-plan geometry or a drafting compass. Plus an `AC` monogram for the favicon and app icon.
14. **4px spacing base,** with typical steps of 8, 12, 16, 24 and 32. Keep cards, inputs and panels aligned.
15. **Not overly rounded.** Buttons about 8px radius, cards about 12px, dialogs about 16px.
16. **Subtle shadows,** used only to show hierarchy.
39. **Meaningful status colours.** Grey for unverified, green for verified, amber for stale or needs review, red for error.
45. **Professional, not playful.** No excessive gradients, too many colours, glassmorphism, cartoon icons or gaming-style 3D UI.

## New project and AI
19. **New-project flow.** Popular presets come first (5 Marla, 10 Marla, 1 Kanal), less common sizes go under "Other sizes", and custom width and depth are allowed.
20. **Interactive plot setup.** A live plot preview updates instantly, ideally with drag handles.
21. **Requirements builder.** Plus/minus steppers for bedrooms and bathrooms, plus room-type chips. Less like a traditional form.
22. **AI understands requirements.** A sentence like "3 bedrooms with attached baths and kitchen at back" becomes structured requirements, and the user confirms them before generation.
23. **AI is not a permanent giant prompt.** By default it's a small `✦ Ask ArchCanvas` control that expands when needed and offers actions based on the selection.
24. **AI previews before applying.** Show before, after, the affected rooms and changed dimensions, then Reject or Apply.
25. **AI offers alternatives.** Layouts A, B and C with mini plan thumbnails and short notes on the differences.
26. **Plan Check.** Validates room closure, room size, door clearance, circulation, windows and stairs. Clicking an issue highlights it on the plan.
27. **Actionable room-size rules.** Show Valid, Too small, and a "Fix automatically" option instead of only stating the minimum size.
36. **Link design decisions to cost.** For example: "Bedroom +35 sq ft, estimated cost impact +PKR 97,700."

## Content and pages
28. **Pakistani templates:** 3, 5, 7 and 10 Marla, 1 Kanal, corner plots, double-storey, rental portions and narrow plots.
29. **A curated furniture library.** Don't try to match Planner 5D's catalogue. Focus on useful local items: beds, sofas, wardrobes, kitchens, bath fixtures, cars, gates.
30. **Drag-and-drop furniture.** Drag into a room, rotate, snap, resize where allowed, and edit exact dimensions.
31. **Visual project cards.** Real plan thumbnails, plot size, floors, last edited and save state, with quick actions on hover.
32. **Templates on the dashboard** as suggested starting points instead of large empty areas.
33. **Landing page shows the real product:** 2D plan, 3D house, an AI change and a cost estimate. Avoid generic SaaS heroes.
34. **Clear core promise:** plot, requirements, layout, edit, 3D, validate, estimate, export.
35. **Different from Planner 5D.** Planner 5D's strengths are visualisation, interiors and a huge catalogue. ArchCanvas's strengths are Pakistani plots, Marla and Kanal, real dimensions, plan validation, local cost estimates and AI layout help.
37. **Cost estimate screen.** Keep the table, and add a total cost card, cost per sq ft, a material percentage breakdown and quantity summary cards.
38. **Efficient admin pages.** No flashy visuals. Focus on verification, last updated, price history, bulk actions and change percentages.
40. **Simple navigation.** Marketing: Product, Templates, Learn, Pricing. App: Projects, Editor, Estimate, Documents, Profile.
