"""Shared page shell, tokens, logo, icons and small components for the ArchCanvas mockups."""

NAVY = "#13202C"
BRICK = "#B2441C"
BLUE = "#1E5AA8"
BLUE_T = "#E6EEF8"
VIOLET = "#6B4FD8"
VIOLET_T = "#EFEAFD"
AMBER = "#A85F00"
AMBER_T = "#FFF5E6"
GREEN = "#2F7A5B"
GREEN_T = "#E3F1EA"
RED = "#B42318"
RED_T = "#FDECEA"
PAPER = "#F5F6F7"
LINE = "#DDE2E7"
LINE2 = "#C3CCD4"
MUTED = "#55626E"

UI = "font-family: Inter, system-ui, sans-serif"
HEAD = "font-family: Sora, Inter, sans-serif"
MONO = "font-family: 'IBM Plex Mono', monospace"

FONTS = ("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500"
         "&amp;family=Inter:wght@400;500;600;700&amp;family=Sora:wght@600;700&amp;display=swap")


def page(title, body, h):
    from illus import ANIM_CSS
    ANIM = ANIM_CSS
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{FONTS}" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#1E5AA8}}a:hover{{color:#123D75}}
{ANIM}</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""


def logo_a(h=28, col=NAVY, bar=BLUE):
    w = h * 26 / 28
    return (f'<svg width="{w:.0f}" height="{h}" viewBox="0 0 26 28" aria-hidden="true" style="display: block">'
            f'<path d="M2.5 26.5 13 3.2 23.5 26.5" fill="none" stroke="{col}" stroke-width="3.4" stroke-linejoin="miter"></path>'
            f'<path d="M6.4 18.2H25.5" stroke="{bar}" stroke-width="2.6"></path>'
            f'<circle cx="13" cy="3.4" r="2.4" fill="{col}"></circle></svg>')


RATIOS = {"lockup": 886 / 761, "house": 600 / 406, "word": 700 / 82, "tag": 800 / 35}


def brand_img(part, h, dark=False, extra=""):
    """Official ArchCanvas logo parts: lockup, house, word, tag (light or dark version)."""
    ratio = RATIOS[part]
    v = "dark" if dark else "light"
    alt = "ArchCanvas" if part in ("lockup", "word") else ""
    return (f'<img src="./brand/{part}-{v}.png" alt="{alt}" width="{h * ratio:.0f}" height="{h}" '
            f'style="display: block; width: {h * ratio:.0f}px; height: {h}px; flex-shrink: 0; max-width: none; object-fit: contain; {extra}">')


def wordmark(size=24, col=NAVY, accent=BLUE):
    dark = col.upper() == "#FFFFFF"
    return (f'<span style="display: inline-flex; align-items: center; gap: {size * 0.35:.0f}px">'
            f'{brand_img("house", round(size * 1.35), dark)}{brand_img("word", round(size * 0.78), dark)}</span>')


def monogram(px=32):
    return (f'<span style="display: inline-flex; width: {px}px; height: {px}px; border-radius: {max(4, px // 5)}px; background: {NAVY}; '
            f'align-items: center; justify-content: center; flex-shrink: 0">{brand_img("house", round(px * 0.5), True)}</span>')


ICONS = {
    "pointer": '<path d="M5 3l14 8-6 2-2 6z"></path>',
    "hand": '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L3 14.5a1.6 1.6 0 0 1 2.4-2L8 15"></path>',
    "wall": '<rect x="3" y="9" width="18" height="6"></rect><path d="M9 9v6M15 9v6"></path>',
    "room": '<rect x="3" y="3" width="18" height="18"></rect><path d="M3 13h8v8"></path>',
    "door": '<path d="M4 20h16M6 20V5h0"></path><path d="M6 5a15 15 0 0 1 14 15"></path>',
    "window": '<rect x="3" y="8" width="18" height="8"></rect><path d="M3 12h18"></path>',
    "stairs": '<path d="M3 20h5v-5h5v-5h5V5h3"></path>',
    "sofa": '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path><path d="M3 11h18v6H3zM5 17v2M19 17v2"></path>',
    "bed": '<path d="M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3"></path><circle cx="7" cy="10.5" r="1.5"></circle>',
    "ruler": '<path d="M3 17 17 3l4 4L7 21z"></path><path d="m7 13 2 2M10 10l2 2M13 7l2 2"></path>',
    "text": '<path d="M5 6V4h14v2M12 4v16M9 20h6"></path>',
    "paint": '<rect x="4" y="3" width="14" height="6" rx="1"></rect><path d="M18 6h2v5h-8v3"></path><rect x="10" y="14" width="4" height="7" rx="1"></rect>',
    "sparkle": '<path d="M12 3l1.9 5.3L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.7z"></path><path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"></path>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"></path>',
    "check_c": '<circle cx="12" cy="12" r="9"></circle><path d="m8 12.3 2.7 2.7L16 9.5"></path>',
    "warn": '<path d="M12 3.5 2.5 20h19z"></path><path d="M12 10v4.5M12 17.2v.1"></path>',
    "error": '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5M12 16.3v.1"></path>',
    "grid": '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"></path>',
    "magnet": '<path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z"></path><path d="M6 7h4M14 7h4"></path>',
    "zoom": '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4M8 11h6M11 8v6"></path>',
    "undo": '<path d="M9 14 4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 0 10h-3"></path>',
    "redo": '<path d="m15 14 5-5-5-5"></path><path d="M20 9H9a5 5 0 0 0 0 10h3"></path>',
    "chev": '<path d="m6 9 6 6 6-6"></path>',
    "chev_r": '<path d="m9 6 6 6-6 6"></path>',
    "chev_l": '<path d="m15 6-6 6 6 6"></path>',
    "arrow_r": '<path d="M5 12h14M13 6l6 6-6 6"></path>',
    "plus": '<path d="M12 5v14M5 12h14"></path>',
    "minus": '<path d="M5 12h14"></path>',
    "x": '<path d="M6 6l12 12M18 6 6 18"></path>',
    "play": '<circle cx="12" cy="12" r="9"></circle><path d="M10 8.5v7l6-3.5z"></path>',
    "download": '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"></path>',
    "share": '<circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="6" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"></path>',
    "layers": '<path d="m12 3 9 5-9 5-9-5z"></path><path d="m3 13 9 5 9-5"></path>',
    "copy": '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path>',
    "dots": '<circle cx="5" cy="12" r="1.3"></circle><circle cx="12" cy="12" r="1.3"></circle><circle cx="19" cy="12" r="1.3"></circle>',
    "search": '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
    "upload": '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"></path>',
    "template": '<rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="8" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect><rect x="13" y="13" width="8" height="8" rx="1"></rect>',
    "pen": '<path d="M4 20l4-1L19 8l-3-3L5 16z"></path><path d="m14 7 3 3"></path>',
    "users": '<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"></path>',
    "home": '<path d="M3 11 12 3l9 8"></path><path d="M5 9.5V21h14V9.5M10 21v-6h4v6"></path>',
    "doc": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6M8 13h8M8 17h5"></path>',
    "calc": '<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"></path>',
    "folder": '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"></path>',
    "user": '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>',
    "orbit": '<ellipse cx="12" cy="12" rx="9" ry="4"></ellipse><circle cx="12" cy="12" r="2"></circle><path d="M12 3v2M12 19v2"></path>',
    "split": '<rect x="3" y="4" width="18" height="16" rx="1"></rect><path d="M12 4v16"></path>',
    "expand": '<path d="m13 6 6 6-6 6M5 6l6 6-6 6"></path>',
    "clock": '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    "shield": '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"></path><path d="m8.5 12 2.5 2.5 4.5-4.5"></path>',
    "compass": '<circle cx="12" cy="5" r="2"></circle><path d="M11 7 6 21M13 7l5 14M8 15h8"></path>',
    "car": '<path d="M5 16V11l2-5h10l2 5v5"></path><path d="M3 16h18v3H3zM7 11h10"></path>',
    "filter": '<path d="M4 5h16l-6 8v6l-4-2v-4z"></path>',
}


def icon(name, size=20, col="currentColor", sw=1.8):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display: block; flex-shrink: 0">{ICONS[name]}</svg>')


def btn(text, kind="primary", href=None, size="md", ic=None, ic_right=None, extra=""):
    h = {"sm": 32, "md": 40, "lg": 48}[size]
    pad = {"sm": 12, "md": 16, "lg": 22}[size]
    fs = {"sm": 13, "md": 14, "lg": 16}[size]
    styles = {
        "primary": f"background: {BRICK}; color: #FFFFFF; border: 1px solid {BRICK}",
        "secondary": f"background: #FFFFFF; color: {NAVY}; border: 1px solid {LINE2}",
        "ghost": f"background: transparent; color: {NAVY}; border: 1px solid transparent",
        "blue": f"background: {BLUE}; color: #FFFFFF; border: 1px solid {BLUE}",
        "ai": f"background: #FFFFFF; color: {VIOLET}; border: 1px solid #C9BDF5",
        "navy": f"background: {NAVY}; color: #FFFFFF; border: 1px solid {NAVY}",
    }[kind]
    inner = ""
    if ic:
        inner += icon(ic, fs + 3)
    inner += f"<span>{text}</span>"
    if ic_right:
        inner += icon(ic_right, fs + 3)
    st = (f"height: {h}px; padding: 0 {pad}px; border-radius: 8px; {styles}; {UI}; font-weight: 600; font-size: {fs}px; "
          f"display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; box-sizing: border-box; white-space: nowrap; {extra}")
    if href:
        return f'<a href="{href}" style="{st}">{inner}</a>'
    return f'<button type="button" style="{st}">{inner}</button>'


def chip(text, tone="grey", ic=None):
    tones = {
        "grey": ("#EEF0F2", "#3E4A55"), "green": (GREEN_T, "#1F5A41"), "amber": (AMBER_T, "#7A4500"),
        "red": (RED_T, "#8F1C13"), "blue": (BLUE_T, "#123D75"), "violet": (VIOLET_T, "#4A33A8"),
        "navy": (NAVY, "#FFFFFF"),
    }
    bg, fg = tones[tone]
    inner = (icon(ic, 13, fg, 2.2) if ic else "") + f"<span>{text}</span>"
    return (f'<span style="height: 24px; padding: 0 8px; border-radius: 6px; background: {bg}; color: {fg}; {UI}; '
            f'font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap">{inner}</span>')


def grid_bg(size=16, col="#E9EDF1"):
    return (f"background-color: #FBFCFC; background-image: linear-gradient({col} 1px, transparent 1px), "
            f"linear-gradient(90deg, {col} 1px, transparent 1px); background-size: {size}px {size}px")


def card(inner, extra=""):
    return f'<div style="background: #FFFFFF; border: 1px solid {LINE}; border-radius: 12px; {extra}">{inner}</div>'


def label(text):
    return f'<span style="{UI}; font-size: 12px; font-weight: 600; color: {MUTED}; text-transform: uppercase; letter-spacing: 0.6px">{text}</span>'


def field(lbl, value, unit=None, mono=True, w=None, state=None):
    border = LINE2
    if state == "error":
        border = RED
    font = MONO if mono else UI
    width = f"width: {w}px;" if w else ""
    u = f'<span style="color: {MUTED}; font-size: 12px; {UI}">{unit}</span>' if unit else ""
    return (f'<label style="display: flex; flex-direction: column; gap: 4px; {UI}; font-size: 12px; font-weight: 500; color: {MUTED}; {width}">{lbl}'
            f'<span style="display: flex; align-items: center; gap: 6px; height: 36px; border: 1px solid {border}; border-radius: 8px; padding: 0 10px; background: #FFFFFF">'
            f'<input type="text" value="{value}" style="border: 0; outline: 0; width: 100%; min-width: 0; {font}; font-size: 14px; color: {NAVY}; background: transparent">{u}</span></label>')


def stepper(lbl, value):
    b = (f'style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid {LINE2}; background: #FFFFFF; color: {NAVY}; '
         f'display: inline-flex; align-items: center; justify-content: center; padding: 0"')
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #EEF1F3">'
            f'<span style="{UI}; font-size: 14px; font-weight: 500; color: {NAVY}">{lbl}</span>'
            f'<span style="display: flex; align-items: center; gap: 10px">'
            f'<button type="button" aria-label="Fewer {lbl.lower()}" {b}>{icon("minus", 16)}</button>'
            f'<span style="{MONO}; font-size: 15px; min-width: 18px; text-align: center; color: {NAVY}">{value}</span>'
            f'<button type="button" aria-label="More {lbl.lower()}" {b}>{icon("plus", 16)}</button></span></div>')


def app_nav(active):
    items = [("Projects", "Dashboard.dc.html"), ("Editor", "Editor.dc.html"), ("Estimate", "Estimate.dc.html"),
             ("Documents", "#"), ("Profile", "#")]
    links = ""
    for name, href in items:
        on = name == active
        st = (f"height: 56px; display: inline-flex; align-items: center; padding: 0 2px; text-decoration: none; {UI}; font-size: 14px; "
              f"font-weight: {600 if on else 500}; color: {NAVY if on else MUTED}; border-bottom: 2px solid {BLUE if on else 'transparent'}; box-sizing: border-box")
        cur = ' aria-current="page"' if on else ""
        links += f'<a href="{href}"{cur} style="{st}">{name}</a>'
    return (f'<nav style="height: 56px; background: #FFFFFF; border-bottom: 1px solid {LINE}; display: flex; align-items: center; justify-content: space-between; padding: 0 24px">'
            f'<div style="display: flex; align-items: center; gap: 32px"><a href="Landing.dc.html" aria-label="ArchCanvas home" style="text-decoration: none">{wordmark(20)}</a>'
            f'<div style="display: flex; gap: 24px">{links}</div></div>'
            f'<button type="button" aria-label="Account" style="width: 32px; height: 32px; border-radius: 999px; border: 0; background: {BLUE_T}; color: #123D75; {UI}; font-weight: 600; font-size: 13px">AH</button></nav>')
