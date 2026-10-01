"""Writes the illustrations and plan drawings used by the website into web/src/art/.

These generators drew the approved UI preview. The React pages import the
output with Vite's ?raw suffix, so the website shows exactly the approved art.
Run from this folder:  python3 export_art.py
"""
import os
import plan
import illus
import marketing
from common import LINE

OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'web', 'src', 'art')


def write(name, markup):
    markup = markup.replace('./brand/', '/brand/')
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(markup + '\n')


# Step illustrations (landing, login and sign-up video)
for key in ('plot', 'draw', 'room3d', 'ai', 'cost'):
    write(f'step-{key}.svg', getattr(illus, f'{key}_card')(360))

# Error and empty state illustrations
write('not-found.svg', illus.not_found(600))
for key in ('error', 'offline', 'ai', 'lock', 'empty', 'denied'):
    write(f'state-{key}.svg', getattr(illus, f'st_{key}')(230))

# Plan drawings
write('plan-hero.svg', plan.plan2d(7.2, dims=False, label_scale=0.85))
write('plan-check.svg', plan.plan2d(9, dims=False, warn='bathdoor', label_scale=0.9))
write('iso-house.svg', plan.iso3d(5.6, max_w=300))
write('thumb-house.svg', plan.thumb(plan.ROOMS, 25, 45, 70, lawn_d=5, max_h=150))
write('thumb-ai-before.svg', plan.thumb(plan.ROOMS, 25, 45, 60, lawn_d=5, max_h=130, hl=['bed1']))
write('thumb-ai-after.svg', plan.thumb(plan.LAYOUT_A_AI, 25, 45, 60, lawn_d=1.83, max_h=130, hl=['bed1'], hl_col=plan.VIOLET))
for name, w, d in (('3-marla', 22.5, 30), ('5-marla', 25, 45), ('10-marla', 30, 75)):
    write(f'preset-{name}.svg', plan.thumb(plan.grid_layout(w, d, [(d, [w])]), w, d, 34, max_h=62))

TEMPLATES = {
    '3-marla': (22.5, 30, [(10, [12, 10.5]), (9, [14, 8.5]), (11, [10, 12.5])]),
    '7-marla': (35, 45, [(5, [35]), (12, [12, 11, 12]), (13, [16, 9, 10]), (15, [14, 21])]),
    '10-marla': (30, 75, [(8, [30]), (14, [14, 16]), (16, [18, 12]), (15, [10, 10, 10]), (22, [14, 16])]),
    'corner': (30, 50, [(12, [14, 16]), (14, [10, 20]), (12, [18, 12]), (12, [12, 18])]),
    'narrow': (18, 50, [(12, [18]), (10, [10, 8]), (12, [18]), (16, [9, 9])]),
}
write('template-5-marla.svg', plan.thumb(plan.ROOMS, 25, 45, 60, lawn_d=5, max_h=110))
for key, (w, d, rows) in TEMPLATES.items():
    write(f'template-{key}.svg', plan.thumb(plan.grid_layout(w, d, rows), w, d, 60, max_h=110))

# Laptop screens (the frame is drawn in React)
pins = [('Bedroom 1', 5.5, 13), ('Kitchen', 18.5, 9), ('Lounge', 8, 22), ('Stairs', 20.5, 26.5), ('Porch', 6, 37)]
sheet1 = (f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 6px; box-shadow: 0 6px 18px rgba(19,32,44,0.08); padding: 16px 18px; display: flex; gap: 18px; align-items: center">'
          f'<div style="display: flex; flex-direction: column; gap: 10px; width: 200px"><span style="font-size: 11px; font-weight: 600; color: {plan.BLUE}">5 Marla · 25 × 45 ft</span>'
          f'<b style="font-family: Sora, Inter, sans-serif; font-size: 30px; line-height: 1.02; letter-spacing: -0.8px; font-weight: 700">Ground floor plan</b>'
          f'{plan.iso3d(2.5, max_w=196)}</div>{marketing.pinned_plan(6.2, pins)}</div>')
write('screen-howto.html', marketing.mini_editor(sheet1))

sheet2 = (f'<div style="display: flex; height: 300px; box-shadow: 0 6px 18px rgba(19,32,44,0.10)">'
          f'<div style="width: 200px; background: {plan.NAVY}; padding: 22px 20px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box">'
          f'<b style="font-family: Sora, Inter, sans-serif; font-size: 30px; line-height: 1.02; color: #FFFFFF; letter-spacing: -0.6px; font-weight: 700">5 MARLA<br>HOUSE<br>PLAN</b>'
          f'<div style="display: flex; flex-direction: column; gap: 8px">{marketing.brand_img("house", 64, True)}{marketing.brand_img("word", 13, True)}</div></div>'
          f'<div style="width: 300px; background: #FFFFFF; {marketing.grid_bg(12, "#EEF1F4")}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">'
          f'{plan.plan2d(5.3, dims=False, handles=False, label_scale=0.7)}'
          f'<span style="height: 20px; padding: 0 10px; border-radius: 10px; background: #E6EEF8; color: {plan.BLUE}; font-family: \'IBM Plex Mono\', monospace; font-size: 10.5px; display: inline-flex; align-items: center">Ground floor · 1,000 sq ft</span></div></div>')
write('screen-sheet.html', marketing.mini_editor(sheet2, '5 Marla house plan · sheet'))
