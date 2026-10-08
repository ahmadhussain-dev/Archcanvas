from common import *
import plan
import illus


def mk_nav():
    items = [("Product", True), ("Templates", False), ("Learn", True), ("Pricing", False)]
    links = "".join(
        f'<a href="#" style="{UI}; font-size: 15px; font-weight: 500; color: {NAVY}; text-decoration: none; display: inline-flex; align-items: center; gap: 4px">{n}{icon("chev", 14, MUTED) if dd else ""}</a>'
        for n, dd in items)
    return (f'<nav style="height: 72px; background: #FFFFFF; border-bottom: 1px solid {LINE}">'
            f'<div style="max-width: 1280px; margin: 0 auto; height: 72px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between">'
            f'<div style="display: flex; align-items: center; gap: 48px"><a href="#" aria-label="ArchCanvas home" style="text-decoration: none">{wordmark(26)}</a><div style="display: flex; gap: 28px">{links}</div></div>'
            f'<div style="display: flex; gap: 12px">{btn("Log in", "secondary", href="Auth.dc.html")}{btn("Start designing free", "primary", href="NewProject.dc.html")}</div></div></nav>')


def laptop(screen, w=640, h=400):
    """A plain laptop frame around a screen of w x h px."""
    return (f'<div style="display: flex; flex-direction: column; align-items: center; width: {w + 150}px">'
            f'<div style="background: #1B2026; border-radius: 18px 18px 0 0; padding: 14px 14px 18px; box-shadow: 0 18px 40px rgba(19,32,44,0.18)">'
            f'<div style="width: {w}px; height: {h}px; background: #FFFFFF; border-radius: 4px; overflow: hidden; position: relative">{screen}</div></div>'
            f'<div style="width: {w + 150}px; height: 16px; background: #C9CFD6; border-radius: 0 0 14px 14px; border-top: 1px solid #E3E7EB; display: flex; justify-content: center">'
            f'<span style="width: 120px; height: 6px; background: #AEB6BF; border-radius: 0 0 8px 8px"></span></div></div>')


def mini_editor(sheet, title="My 5 Marla house"):
    rail = "".join(f'<span style="width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; {"background: #E6EEF8" if i == 1 else ""}">{icon(ic, 14, BLUE if i == 1 else MUTED)}</span>'
                   for i, ic in enumerate(("pointer", "wall", "door", "sofa", "ruler", "text")))
    return (f'<div style="position: absolute; inset: 0; display: flex; flex-direction: column; {UI}; color: {NAVY}">'
            f'<div style="height: 34px; border-bottom: 1px solid {LINE}; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; flex-shrink: 0">'
            f'<span style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 600">{monogram(22)}{title}</span>'
            f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 20px; height: 20px; border-radius: 50%; background: #E6EEF8; color: {BLUE}; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center">AH</span>'
            f'<span style="height: 22px; padding: 0 10px; border-radius: 6px; background: {BLUE}; color: #FFFFFF; font-size: 10.5px; font-weight: 600; display: inline-flex; align-items: center">Share</span></span></div>'
            f'<div style="flex-grow: 1; display: flex; min-height: 0">'
            f'<div style="width: 38px; border-right: 1px solid {LINE}; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; flex-shrink: 0">{rail}'
            f'<span style="margin-top: auto; width: 26px; height: 26px; border-radius: 50%; border: 1px solid #C9BDF5; display: flex; align-items: center; justify-content: center">{icon("sparkle", 13, VIOLET)}</span></div>'
            f'<div style="flex-grow: 1; position: relative; {grid_bg(14, "#EEF1F4")}; display: flex; align-items: center; justify-content: center">{sheet}</div></div></div>')


def pinned_plan(s, pins):
    """The 5 Marla plan with numbered navy name pins at room centres (feet)."""
    tags = "".join(
        f'<span style="position: absolute; left: {6 + x * s:.0f}px; top: {6 + y * s:.0f}px; transform: translate(-50%, -50%); height: 18px; padding: 0 7px 0 3px; border-radius: 9px; background: {NAVY}; color: #FFFFFF; font-size: 9.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap">'
        f'<span style="width: 13px; height: 13px; border-radius: 50%; background: #FFFFFF; color: {NAVY}; font-size: 8.5px; display: flex; align-items: center; justify-content: center">{i + 1}</span>{t}</span>'
        for i, (t, x, y) in enumerate(pins))
    pts = [(6 + x * s + 10, 6 + y * s + 10) for _, x, y in pins] + [(6 + pins[0][1] * s + 10, 6 + pins[0][2] * s + 10)]
    route = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts)
    n = len(pins)
    kt = ";".join(f"{i / n:.3f}" for i in range(n + 1))
    cursor = (f'<svg width="100%" height="100%" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible; pointer-events: none">'
              f'<rect x="{6 + 0.2 * s:.0f}" y="{6 + 5.2 * s:.0f}" width="{10.6 * s:.0f}" height="{11.6 * s:.0f}" fill="{BLUE}" opacity="0.12" class="ac-pulse"></rect>'
              f'<g><path d="M0 0 L0 15 L4 11 L7 18 L10 17 L7 10 L12 10 Z" fill="#FFFFFF" stroke="{NAVY}" stroke-width="1.4" stroke-linejoin="round"></path>'
              f'<animateMotion dur="7s" repeatCount="indefinite" path="{route}"'
              f'></animateMotion></g></svg>')
    return f'<div style="position: relative">{plan.plan2d(s, dims=False, labels=False, handles=False)}{tags}{cursor}</div>'



def landing():
    p2d = plan.plan2d(7.2, dims=False, label_scale=0.85)
    p3d = plan.iso3d(5.6, max_w=300)
    bars = [("Steel", 34, "#13202C"), ("Cement", 21, "#1E5AA8"), ("Bricks", 15, "#B2441C"), ("Labour", 14, "#6E8FB8"),
            ("Sand and crush", 12, "#A9BCD4"), ("Pipes", 4, "#C9B48F")]
    rows = "".join(
        f'<div style="display: grid; grid-template-columns: 10px minmax(0, 1fr) 36px; gap: 8px; align-items: center; font-size: 12.5px">'
        f'<span style="width: 10px; height: 10px; border-radius: 2px; background: {c}"></span><span>{n}</span><span style="{MONO}; text-align: right">{p}%</span></div>'
        for n, p, c in bars)
    stack = "".join(f'<span style="width: {p}%; background: {c}"></span>' for n, p, c in bars)
    costcard = (f'<div style="position: absolute; right: 0; top: 0; width: 236px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; box-shadow: 0 10px 28px rgba(19,32,44,0.10); padding: 16px; display: flex; flex-direction: column; gap: 10px; z-index: 2">'
                f'<span style="font-size: 12px; color: {MUTED}">Estimated grey structure</span>'
                f'<b style="{MONO}; font-size: 24px; font-weight: 500; color: {NAVY}">PKR 55.8 lakh</b>'
                f'<span style="{MONO}; font-size: 12.5px; color: {MUTED}; margin-top: -6px">PKR 2,791 / sq ft</span>'
                f'<div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; gap: 1px">{stack}</div>{rows}</div>')

    def tab(t, on):
        return f'<span style="position: absolute; top: -14px; left: 16px; height: 28px; padding: 0 12px; border-radius: 6px; background: {BLUE if on else "#FFFFFF"}; color: {"#FFFFFF" if on else NAVY}; border: 1px solid {BLUE if on else LINE}; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center">{t}</span>'
    hero_vis = (f'<div style="position: relative; height: 560px">'
                f'<div style="position: absolute; left: 0; top: 40px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; box-shadow: 0 10px 28px rgba(19,32,44,0.08); padding: 18px 14px 10px">{tab("2D plan", True)}{p2d}</div>'
                f'<svg width="72" height="40" viewBox="0 0 72 40" aria-hidden="true" style="position: absolute; left: 228px; top: 168px"><path d="M6 32 C 20 6, 52 6, 66 28" fill="none" stroke="{BLUE}" stroke-width="2"></path><path d="m60 26 6 3 1-7" fill="none" stroke="{BLUE}" stroke-width="2"></path></svg>'
                f'<div style="position: absolute; left: 252px; top: 226px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; box-shadow: 0 10px 28px rgba(19,32,44,0.08); padding: 20px 10px 10px; z-index: 1">{tab("3D view", False)}{p3d}</div>'
                f'{costcard}'
                f'<div style="position: absolute; left: 252px; top: 500px; background: #FFFFFF; border: 1px solid #C9BDF5; border-radius: 10px; box-shadow: 0 10px 28px rgba(19,32,44,0.10); padding: 8px 8px 8px 12px; display: flex; align-items: center; gap: 10px; z-index: 2">'
                f'{icon("sparkle", 17, VIOLET)}<span style="font-size: 13.5px">Make bedroom 1 bigger</span>{chip("+35 sq ft", "violet")}<span style="{MONO}; font-size: 12px; color: {MUTED}">+PKR 97,700</span></div></div>')
    checks = "".join(f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: {MUTED}">{icon("check_c", 16, GREEN, 2)}{t}</span>'
                     for t in ("No credit card needed", "Made for Pakistan", "Real room size rules"))
    # top: one simple line, then illustrated steps
    swash = (f'<svg width="250" height="16" viewBox="0 0 250 16" aria-hidden="true" style="position: absolute; left: 0; bottom: -10px">'
             f'<path d="M4 10 C 60 3, 150 2, 246 7" pathLength="100" class="ac-draw" fill="none" stroke="{BLUE}" stroke-width="6" stroke-linecap="round"></path></svg>')
    top = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 72px 24px 40px; display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center">'
           f'<span style="font-size: 15px; font-weight: 600; color: {BLUE}">Made for Pakistani plots · Marla and Kanal</span>'
           f'<h1 style="margin: 0; {HEAD}; font-size: 60px; line-height: 1.08; letter-spacing: -1.8px; font-weight: 700; color: {NAVY}">Design a house that actually fits <span style="position: relative; display: inline-block">your plot.{swash}</span></h1>'
           f'<p style="margin: 8px 0 0; max-width: 720px; font-size: 19px; line-height: 1.55; color: {MUTED}">Plan in 2D, see it in 3D, check it against real room sizes, and get a grey structure estimate in rupees.</p>'
           f'<div style="display: flex; gap: 12px; margin-top: 4px">{btn("Start a free project", "primary", href="NewProject.dc.html", size="lg", ic_right="arrow_r")}{btn("Watch 1 min demo", "secondary", size="lg", ic="play")}</div>'
           f'<div style="display: flex; gap: 16px">{checks}</div></section>')
    steps_ill = [("Choose your plot", illus.plot_card), ("Draw it in 2D", illus.draw_card), ("See it in 3D", illus.room3d_card),
                 ("Ask ArchCanvas", illus.ai_card), ("Know the cost", illus.cost_card)]
    icards = "".join(
        f'<div style="flex: 0 0 292px; scroll-snap-align: start; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; padding: 24px 16px 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-sizing: border-box">'
        f'<span style="{MONO}; font-size: 12px; color: {BLUE}">0{i + 1}</span><b style="{HEAD}; font-size: 21px; font-weight: 600; color: {NAVY}">{t}</b>'
        f'<div style="height: 250px; width: 100%; display: flex; align-items: center; justify-content: center">{fn(250)}</div></div>'
        for i, (t, fn) in enumerate(steps_ill))
    illrow = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 0 24px 64px; position: relative">'
              f'<div style="display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px">{icards}</div>'
              f'<a href="#" aria-label="Next step" style="position: absolute; right: 8px; top: 140px; width: 52px; height: 52px; border-radius: 50%; background: #FFFFFF; border: 1px solid {LINE2}; box-shadow: 0 6px 18px rgba(19,32,44,0.12); display: flex; align-items: center; justify-content: center">{icon("arrow_r", 22, NAVY)}</a></section>')
    hero = (f'<section style="{grid_bg(24, "#EEF1F4")}; border-top: 1px solid {LINE}; border-bottom: 1px solid {LINE}">'
            f'<div style="max-width: 1280px; margin: 0 auto; padding: 64px 24px 56px; display: grid; grid-template-columns: 440px minmax(0, 1fr); gap: 56px; align-items: center">'
            f'<div style="display: flex; flex-direction: column; gap: 20px">'
            f'<span style="font-size: 14px; font-weight: 600; color: {BLUE}">One workspace</span>'
            f'<h2 style="margin: 0; {HEAD}; font-size: 40px; line-height: 1.1; letter-spacing: -1px; font-weight: 700; color: {NAVY}">2D, 3D and cost, always in step</h2>'
            f'<p style="margin: 0; font-size: 17px; line-height: 1.6; color: {MUTED}">Move a wall in the plan and the 3D view and the estimate change with it. Ask ArchCanvas for an idea and see the cost before you apply it.</p>'
            f'<div>{btn("Start a free project", "primary", href="NewProject.dc.html", size="lg", ic_right="arrow_r")}</div></div>{hero_vis}</div></section>')

    # feature cards
    def fcard(visual, title, text):
        return (f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column">'
                f'<div style="height: 180px; background: {PAPER}; border-bottom: 1px solid {LINE}; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; box-sizing: border-box">{visual}</div>'
                f'<div style="padding: 20px; display: flex; flex-direction: column; gap: 8px"><b style="{HEAD}; font-size: 18px; font-weight: 600">{title}</b><span style="font-size: 14.5px; line-height: 1.55; color: {MUTED}">{text}</span></div></div>')

    def preset(name, area, w, d, on):
        bd = f"2px solid {BLUE}" if on else f"1px solid {LINE}"
        return (f'<div style="background: #FFFFFF; border: {bd}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 84px">'
                f'{plan.thumb(plan.grid_layout(w, d, [(d, [w])]), w, d, 34, max_h=62)}<b style="font-size: 12px">{name}</b><span style="{MONO}; font-size: 10.5px; color: {MUTED}">{area}</span></div>')
    v1 = preset("3 Marla", "675 sq ft", 22.5, 30, False) + preset("5 Marla", "1,125 sq ft", 25, 45, True) + preset("10 Marla", "2,250 sq ft", 30, 75, False)
    v2 = (plan.thumb(plan.ROOMS, 25, 45, 70, lawn_d=5, max_h=150) + plan.iso3d(2.6, max_w=150))
    v3 = (plan.thumb(plan.ROOMS, 25, 45, 60, lawn_d=5, max_h=130, hl=["bed1"]) + icon("arrow_r", 22, VIOLET)
          + plan.thumb(plan.LAYOUT_A_AI, 25, 45, 60, lawn_d=1.83, max_h=130, hl=["bed1"], hl_col=VIOLET))
    qty = "".join(f'<div style="display: flex; justify-content: space-between; font-size: 12.5px; gap: 16px"><span style="color: {MUTED}">{a}</span><span style="{MONO}">{b}</span></div>'
                  for a, b in (("Cement", "800 bags"), ("Bricks", "48,000"), ("Steel", "7.6 tons"), ("Sand", "3,600 cft")))
    v4 = f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 8px; padding: 12px; width: 200px; display: flex; flex-direction: column; gap: 6px">{qty}<div style="border-top: 1px solid {LINE}; padding-top: 6px; display: flex; justify-content: space-between; font-size: 12.5px"><b>Per sq ft</b><span style="{MONO}">PKR 2,791</span></div></div>'
    features = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 56px 24px 24px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px">'
                + fcard(v1, "Plan for your actual plot", "Pick 3, 5, 7 or 10 Marla, 1 Kanal, or type your own width and depth.")
                + fcard(v2, "Design visually", "Draw walls, add doors and windows, and place furniture. See it in 2D and 3D at once.")
                + fcard(v3, "Ask ArchCanvas AI", "Describe a change in plain words. Preview it before anything is applied.")
                + fcard(v4, "Understand build cost", "Material quantities and a grey structure estimate from your design and local rates.")
                + "</section>")

    trust = "".join(
        f'<div style="display: flex; gap: 14px; align-items: flex-start">{icon(ic, 28, NAVY, 1.6)}<div style="display: flex; flex-direction: column; gap: 4px"><b style="font-size: 16px">{t}</b><span style="font-size: 14px; color: {MUTED}">{d}</span></div></div>'
        for ic, t, d in (("users", "Made for Pakistani homes", "Marla, Kanal and local building practice"),
                         ("shield", "Plan with confidence", "Real sizes and a built-in plan check"),
                         ("doc", "From idea to plan", "Design, 3D view, cost estimate and PDF export")))
    trustrow = f'<section style="max-width: 1280px; margin: 0 auto; padding: 32px 24px 56px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; border-bottom: 1px solid {LINE}">{trust}</section>'

    # how it works: laptop + step list (Canva-style)
    pins = [("Bedroom 1", 5.5, 13), ("Kitchen", 18.5, 9), ("Lounge", 8, 22), ("Stairs", 20.5, 26.5), ("Porch", 6, 37)]
    sheet1 = (f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 6px; box-shadow: 0 6px 18px rgba(19,32,44,0.08); padding: 16px 18px; display: flex; gap: 18px; align-items: center">'
              f'<div style="display: flex; flex-direction: column; gap: 10px; width: 200px"><span style="font-size: 11px; font-weight: 600; color: {BLUE}">5 Marla · 25 × 45 ft</span>'
              f'<b style="{HEAD}; font-size: 30px; line-height: 1.02; letter-spacing: -0.8px; font-weight: 700">Ground floor plan</b>'
              f'{plan.iso3d(2.5, max_w=196)}</div>{pinned_plan(6.2, pins)}</div>')
    steps = [("Choose your plot size", "Pick a Marla or Kanal preset, or type your own width and depth in feet."),
             ("Pick a template or describe your house", "Start from a Pakistani layout, or tell ArchCanvas how many bedrooms and floors you need."),
             ("Customise walls, doors and furniture", "Drag walls, drop in doors and windows, and furnish each room in 2D or 3D."),
             ("Check the plan and the cost", "Plan check flags tight rooms and blocked doors. The estimate updates as you edit."),
             ("Save, share or download a PDF", "Every version is saved. Share a view-only link or download a sheet for your builder.")]
    items = "".join(
        f'<details name="howto"{" open" if i == 0 else ""} style="border-left: 3px solid {BLUE if i == 0 else LINE}; padding: 4px 0 4px 24px">'
        f'<summary style="list-style: none; cursor: pointer; {HEAD}; font-size: 21px; font-weight: 600; color: {NAVY}; display: flex; gap: 12px; align-items: baseline">'
        f'<span style="{MONO}; font-size: 13px; color: {BLUE}">0{i + 1}</span>{t}</summary>'
        f'<p style="margin: 10px 0 4px 34px; font-size: 16px; line-height: 1.6; color: {MUTED}">{d}</p></details>'
        for i, (t, d) in enumerate(steps))
    flowsec = (f'<section style="background: {PAPER}; border-bottom: 1px solid {LINE}"><div style="max-width: 1280px; margin: 0 auto; padding: 72px 24px; display: grid; grid-template-columns: 790px minmax(0, 1fr); gap: 48px; align-items: center">'
               f'{laptop(mini_editor(sheet1))}'
               f'<div style="display: flex; flex-direction: column; gap: 28px"><h2 style="margin: 0; {HEAD}; font-size: 40px; line-height: 1.1; letter-spacing: -1px; font-weight: 700">How to plan your house in ArchCanvas</h2>'
               f'<div style="display: flex; flex-direction: column; gap: 22px">{items}</div>'
               f'<div>{btn("Create a floor plan", "primary", href="NewProject.dc.html", size="lg")}</div></div></div></section>')

    pcheck = plan.plan2d(9, dims=False, warn="bathdoor", label_scale=0.9)
    checkrows = "".join(
        f'<div style="display: flex; gap: 10px; align-items: center; font-size: 14px">{icon(ic, 18, col, 2)}<span>{t}</span></div>'
        for ic, col, t in (("check_c", GREEN, "Rooms closed and within real sizes"), ("check_c", GREEN, "Every room reachable"),
                           ("warn", AMBER, "Bath door swings into the basin"), ("check_c", GREEN, "Stairs and windows checked")))
    checksec = (f'<section style="background: {PAPER}; border-top: 1px solid {LINE}; border-bottom: 1px solid {LINE}">'
                f'<div style="max-width: 1280px; margin: 0 auto; padding: 64px 24px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 56px; align-items: center">'
                f'<div style="display: flex; flex-direction: column; gap: 18px"><span style="font-size: 14px; font-weight: 600; color: {BLUE}">Plan check</span>'
                f'<h2 style="margin: 0; {HEAD}; font-size: 36px; letter-spacing: -0.8px; line-height: 1.15; font-weight: 700">Catch problems before your builder does</h2>'
                f'<p style="margin: 0; font-size: 17px; line-height: 1.6; color: {MUTED}">ArchCanvas checks room sizes, door clearance, circulation, windows and stairs. Click an issue to see it on the plan, or let it fix the problem for you.</p>'
                f'<div style="display: flex; flex-direction: column; gap: 10px">{checkrows}</div></div>'
                f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; padding: 20px; display: flex; justify-content: center">{pcheck}</div></div></section>')

    # present: laptop on a desk showing a plan sheet
    sheet2 = (f'<div style="display: flex; height: 300px; box-shadow: 0 6px 18px rgba(19,32,44,0.10)">'
              f'<div style="width: 200px; background: {NAVY}; padding: 22px 20px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box">'
              f'<b style="{HEAD}; font-size: 30px; line-height: 1.02; color: #FFFFFF; letter-spacing: -0.6px; font-weight: 700">5 MARLA<br>HOUSE<br>PLAN</b>'
              f'<div style="display: flex; flex-direction: column; gap: 8px">{brand_img("house", 64, True)}{brand_img("word", 13, True)}</div></div>'
              f'<div style="width: 300px; background: #FFFFFF; {grid_bg(12, "#EEF1F4")}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">'
              f'{plan.plan2d(5.3, dims=False, handles=False, label_scale=0.7)}'
              f'<span style="height: 20px; padding: 0 10px; border-radius: 10px; background: #E6EEF8; color: {BLUE}; {MONO}; font-size: 10.5px; display: inline-flex; align-items: center">Ground floor · 1,000 sq ft</span></div></div>')
    scene = (f'<div style="position: relative; background: #ECE7E1; border-radius: 16px; overflow: hidden; height: 560px; display: flex; align-items: flex-end; justify-content: center">'
             f'<span style="position: absolute; left: 0; right: 0; bottom: 0; height: 110px; background: #C9A27E"></span>'
             f'<span style="position: absolute; left: 48px; top: 0; width: 140px; height: 450px; background: #F6F2EC; border-radius: 0 0 6px 6px"></span>'
             f'<div style="position: relative; margin-bottom: 70px">{laptop(mini_editor(sheet2, "5 Marla house plan · sheet"), 560, 360)}</div></div>')
    pts = "".join(f'<div style="display: flex; gap: 12px; align-items: flex-start">{icon(ic, 20, BLUE)}<div style="display: flex; flex-direction: column; gap: 4px"><b style="font-size: 16px">{t}</b><span style="font-size: 14.5px; color: {MUTED}; line-height: 1.5">{d}</span></div></div>'
                  for ic, t, d in (("doc", "A sheet for every floor", "Title, plan, room sizes and covered area, laid out and ready to print."),
                                   ("download", "PDF for your builder", "Plan, material quantities and the grey structure estimate in one file."),
                                   ("users", "Show your family", "Share a view-only link, or present it full screen.")))
    presentsec = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 72px 24px; display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 56px; align-items: center">'
                  f'{scene}<div style="display: flex; flex-direction: column; gap: 22px"><span style="font-size: 14px; font-weight: 600; color: {BLUE}">Documents</span>'
                  f'<h2 style="margin: 0; {HEAD}; font-size: 36px; letter-spacing: -0.8px; line-height: 1.15; font-weight: 700">Turn your plan into a sheet you can present</h2>'
                  f'<div style="display: flex; flex-direction: column; gap: 18px">{pts}</div><div>{btn("Create a floor plan", "secondary", href="NewProject.dc.html", size="lg", ic_right="arrow_r")}</div></div></section>')

    tpls = [("3 Marla", 22.5, 30, [(10, [12, 10.5]), (9, [14, 8.5]), (11, [10, 12.5])]),
            ("5 Marla", 25, 45, None), ("7 Marla", 35, 45, [(5, [35]), (12, [12, 11, 12]), (13, [16, 9, 10]), (15, [14, 21])]),
            ("10 Marla", 30, 75, [(8, [30]), (14, [14, 16]), (16, [18, 12]), (15, [10, 10, 10]), (22, [14, 16])]),
            ("Corner plot", 30, 50, [(12, [14, 16]), (14, [10, 20]), (12, [18, 12]), (12, [12, 18])]),
            ("Narrow plot", 18, 50, [(12, [18]), (10, [10, 8]), (12, [18]), (16, [9, 9])])]
    tcards = ""
    for name, w, d, rows in tpls:
        th = plan.thumb(plan.ROOMS, 25, 45, 60, lawn_d=5, max_h=110) if rows is None else plan.thumb(plan.grid_layout(w, d, rows), w, d, 60, max_h=110)
        tcards += (f'<a href="NewProject.dc.html" style="text-decoration: none; color: {NAVY}; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; align-items: center">'
                   f'<div style="height: 120px; display: flex; align-items: center">{th}</div><b style="font-size: 14px">{name}</b><span style="{MONO}; font-size: 11.5px; color: {MUTED}">{plan.ftin(w)} × {plan.ftin(d)}</span></a>')
    tplsec = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 64px 24px; display: flex; flex-direction: column; gap: 24px">'
              f'<div style="display: flex; justify-content: space-between; align-items: flex-end"><h2 style="margin: 0; {HEAD}; font-size: 36px; letter-spacing: -0.8px; font-weight: 700">Start from a Pakistani template</h2><a href="#" style="font-weight: 600; text-decoration: none; display: inline-flex; gap: 4px; align-items: center">All templates {icon("arrow_r", 16)}</a></div>'
              f'<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px">{tcards}</div></section>')

    strengths = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border: 1px solid {LINE}; border-radius: 12px; background: #FFFFFF">{icon(ic, 22, BLUE)}<b style="font-size: 16px">{t}</b><span style="font-size: 14px; color: {MUTED}; line-height: 1.5">{d}</span></div>'
        for ic, t, d in (("grid", "Marla and Kanal", "Presets at the government standard of 225 sq ft per Marla."),
                         ("ruler", "Real dimensions", "Feet and inches everywhere, with proper dimension lines."),
                         ("shield", "Plan validation", "Room sizes, doors, circulation and stairs checked as you work."),
                         ("calc", "Local cost estimate", "Grey structure cost from local material rates, per sq ft."),
                         ("sparkle", "AI layout help", "Layouts and edits that respect real-world room sizes."),
                         ("download", "PDF for your builder", "Plan, quantities and estimate in one report.")))
    strsec = (f'<section style="max-width: 1280px; margin: 0 auto; padding: 0 24px 64px; display: flex; flex-direction: column; gap: 24px">'
              f'<h2 style="margin: 0; {HEAD}; font-size: 36px; letter-spacing: -0.8px; font-weight: 700">Built for planning a home in Pakistan</h2>'
              f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{strengths}</div></section>')

    cta = (f'<section style="background: {NAVY}"><div style="max-width: 1280px; margin: 0 auto; padding: 56px 24px; display: flex; justify-content: space-between; align-items: center; gap: 24px">'
           f'<div style="display: flex; align-items: center; gap: 28px">{brand_img("house", 72, True)}<div style="display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; {HEAD}; font-size: 34px; color: #FFFFFF; letter-spacing: -0.6px; font-weight: 700">Start with your plot size</h2>'
           f'<span style="font-size: 16px; color: #B8C4CF">Free to use in your browser. Nothing to install.</span></div></div>{btn("Start designing free", "primary", href="NewProject.dc.html", size="lg")}</div></section>')
    cols = [("Product", ["Editor", "Plan check", "Cost estimate", "AI assistant"]), ("Templates", ["3 Marla", "5 Marla", "10 Marla", "1 Kanal"]),
            ("Learn", ["Guides", "Marla and Kanal sizes", "Grey structure costs"]), ("Pricing", ["Free plan"])]
    fcols = "".join(f'<div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 13px">{h}</b>' + "".join(f'<a href="#" style="font-size: 13px; color: {MUTED}; text-decoration: none">{l}</a>' for l in ls) + "</div>" for h, ls in cols)
    footer = (f'<footer style="max-width: 1280px; margin: 0 auto; padding: 40px 24px; display: grid; grid-template-columns: 2fr repeat(4, minmax(0, 1fr)); gap: 24px">'
              f'<div style="display: flex; flex-direction: column; gap: 10px">{wordmark(22)}<span style="font-size: 13px; color: {MUTED}; line-height: 1.5">Final Year Project, NUML Faisalabad.<br>An early planning aid, not a structural engineering tool.</span></div>{fcols}</footer>')
    body = (f'<div style="width: 100%; min-height: 5280px; background: #FFFFFF; color: {NAVY}; {UI}">'
            + mk_nav() + top + illrow + hero + features + trustrow + flowsec + checksec + presentsec + tplsec + strsec + cta + footer + "</div>")
    return body


def auth(mode="login"):
    inp = f'height: 40px; border: 1px solid {LINE2}; border-radius: 8px; padding: 0 12px; {UI}; font-size: 15px; color: {NAVY}'
    lab = 'display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 500'
    scenes = [("Choose your plot", "Pick a Marla size or type your own width and depth.", illus.plot_card),
              ("Draw it in 2D", "Walls snap together with real feet and inches.", illus.draw_card),
              ("See it in 3D", "Walk around the rooms and place furniture.", illus.room3d_card),
              ("Know the cost", "A grey structure estimate in rupees, per sq ft.", illus.cost_card)]
    stage = "".join(
        f'<div class="ac-scene" style="position: absolute; inset: 0; animation-delay: {i * 4}s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px">'
        f'<div style="height: 300px; display: flex; align-items: center">{fn(360)}</div>'
        f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center"><span style="{MONO}; font-size: 12px; color: {BLUE}">Step {i + 1} of 4</span>'
        f'<b style="{HEAD}; font-size: 22px; font-weight: 600">{t}</b><span style="font-size: 14.5px; color: {MUTED}">{d}</span></div></div>'
        for i, (t, d, fn) in enumerate(scenes))
    video = (f'<div style="width: 100%; max-width: 560px; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 16px; box-shadow: 0 10px 28px rgba(19,32,44,0.06); overflow: hidden">'
             f'<div role="img" aria-label="Animated video showing how ArchCanvas works in four steps" style="position: relative; height: 440px; {grid_bg(20, "#F0F2F5")}">{stage}</div>'
             f'<div style="height: 48px; border-top: 1px solid {LINE}; display: flex; align-items: center; gap: 12px; padding: 0 16px">'
             f'<span style="width: 28px; height: 28px; border-radius: 50%; background: {NAVY}; display: flex; align-items: center; justify-content: center">'
             f'<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M1 1h3v10H1zM6 1h3v10H6z" fill="#FFFFFF"></path></svg></span>'
             f'<span style="flex-grow: 1; height: 4px; border-radius: 2px; background: {LINE}; overflow: hidden"><span class="ac-prog" style="display: block; height: 100%; background: {BLUE}"></span></span>'
             f'<span style="{MONO}; font-size: 12px; color: {MUTED}">0:16</span>{icon("mute", 18, MUTED) if "mute" in ICONS else ""}</div></div>')
    left = (f'<div style="background: {PAPER}; border-right: 1px solid {LINE}; padding: 40px 48px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px">'
            f'<a href="Landing.dc.html" style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: {NAVY}; text-decoration: none">{icon("chev_l", 16, NAVY)}Back to home</a>'
            f'<div style="display: flex; justify-content: center">{video}</div>'
            f'<div style="display: flex; flex-direction: column; gap: 6px; max-width: 460px"><b style="{HEAD}; font-size: 22px; line-height: 1.25">From plot to estimate in 4 steps.</b>'
            f'<span style="font-size: 15px; color: {MUTED}; line-height: 1.5">Your plans are saved with every version, so you can always go back.</span></div></div>')
    logo = f'<div style="display: flex; justify-content: center; padding-bottom: 8px">{brand_img("lockup", 150)}</div>'
    if mode == "login":
        form = (logo + f'<div style="display: flex; flex-direction: column; gap: 6px"><h1 style="margin: 0; {HEAD}; font-size: 28px; font-weight: 700">Log in</h1><span style="font-size: 14px; color: {MUTED}">New to ArchCanvas? <a href="Signup.dc.html" style="font-weight: 600; text-decoration: none">Create an account</a></span></div>'
                f'<label style="{lab}">Email<input type="email" placeholder="you@example.com" style="{inp}"></label>'
                f'<label style="{lab}"><span style="display: flex; justify-content: space-between">Password<a href="#" style="font-weight: 500; text-decoration: none">Forgot password?</a></span><input type="password" value="password1" style="{inp}"></label>'
                f'<label style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: {MUTED}"><input type="checkbox" checked style="width: 16px; height: 16px; accent-color: {BLUE}">Keep me logged in for 7 days</label>'
                f'{btn("Log in", "primary", href="Dashboard.dc.html", size="lg", extra="width: 100%")}'
                f'<span style="font-size: 12.5px; color: {MUTED}; line-height: 1.5">After 5 failed tries, the account locks for 15 minutes.</span>')
    else:
        bars = "".join(f'<span style="flex-grow: 1; height: 4px; border-radius: 2px; background: {GREEN if i < 3 else LINE}"></span>' for i in range(4))
        form = (logo + f'<div style="display: flex; flex-direction: column; gap: 6px"><h1 style="margin: 0; {HEAD}; font-size: 28px; font-weight: 700">Create your account</h1><span style="font-size: 14px; color: {MUTED}">Already have one? <a href="Auth.dc.html" style="font-weight: 600; text-decoration: none">Log in</a></span></div>'
                f'<label style="{lab}">Full name<input type="text" value="Ahmad Hussain" style="{inp}"></label>'
                f'<label style="{lab}">Email<input type="email" placeholder="you@example.com" style="{inp}"></label>'
                f'<label style="{lab}">Password<input type="password" value="plotfits25x45" style="{inp}">'
                f'<span style="display: flex; gap: 4px; margin-top: 2px">{bars}</span><span style="font-size: 12.5px; color: {MUTED}; font-weight: 400">Strong. Use at least 8 characters with a number.</span></label>'
                f'<label style="display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: {MUTED}; line-height: 1.45"><input type="checkbox" checked style="width: 16px; height: 16px; margin-top: 1px; accent-color: {BLUE}">I understand ArchCanvas is a planning aid, not a structural engineering tool.</label>'
                f'{btn("Create account", "primary", href="NewProject.dc.html", size="lg", extra="width: 100%")}'
                f'<span style="font-size: 12.5px; color: {MUTED}; line-height: 1.5">New accounts are regular users. Admin access is given by an existing admin.</span>')
    return (f'<div style="width: 100%; min-height: 860px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); color: {NAVY}; {UI}">'
            f'{left}<div style="background: #FFFFFF; display: flex; align-items: center; justify-content: center; padding: 48px 24px">'
            f'<form style="width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 18px">{form}</form></div></div>')


def signup():
    return auth("signup")
