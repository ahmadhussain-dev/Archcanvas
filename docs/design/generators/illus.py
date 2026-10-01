"""Isometric line illustrations for ArchCanvas, in the product palette, with gentle CSS/SMIL motion."""
import math
from common import NAVY, BLUE, BLUE_T, BRICK, VIOLET, VIOLET_T, LINE, LINE2, MUTED, PAPER

C = math.cos(math.radians(30))
INK = NAVY
TREE = "#2C3F63"          # the logo's tree navy
WHITE = ("#FFFFFF", "#EEF1F4", "#DCE2E8")
GROUND = ("#F5F6F7", "#E3E8ED", "#D2D9E0")
BLUEF = ("#4F7FC4", BLUE, "#174784")
LBLUE = (BLUE_T, "#C9D8EE", "#AFC4E3")
BRICKF = ("#C9582E", BRICK, "#8F3616")
NAVYF = ("#2C3F63", "#1D2C3E", NAVY)

ANIM_CSS = """
.ac-bob{animation:ac-bob 2.6s ease-in-out infinite}
@keyframes ac-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.ac-float{animation:ac-float 5s ease-in-out infinite}
@keyframes ac-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.ac-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:ac-draw 5s linear infinite}
@keyframes ac-draw{0%{stroke-dashoffset:100;opacity:1}50%{stroke-dashoffset:0}88%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.ac-drop{animation:ac-drop 5s ease-out infinite}
@keyframes ac-drop{0%{transform:translateY(-26px);opacity:0}18%,86%{transform:translateY(0);opacity:1}100%{transform:translateY(0);opacity:0}}
.ac-tw{transform-box:fill-box;transform-origin:center;animation:ac-tw 1.8s ease-in-out infinite}
@keyframes ac-tw{0%,100%{transform:scale(.55);opacity:.35}50%{transform:scale(1);opacity:1}}
.ac-slide{animation:ac-slide 5s ease-in-out infinite}
@keyframes ac-slide{0%,15%{transform:translate(0,0)}45%,85%{transform:translate(var(--dx),var(--dy))}100%{transform:translate(0,0)}}
.ac-pulse{animation:ac-pulse 2.4s ease-in-out infinite}
@keyframes ac-pulse{0%,100%{opacity:.25}50%{opacity:1}}
.ac-grow{transform-box:fill-box;transform-origin:bottom;animation:ac-grow 3.6s ease-in-out infinite}
@keyframes ac-grow{0%{transform:scaleY(.15)}45%,85%{transform:scaleY(1)}100%{transform:scaleY(.15)}}
.ac-swing{transform-box:fill-box;transform-origin:left bottom;animation:ac-swing 4s ease-in-out infinite}
@keyframes ac-swing{0%,100%{transform:skewY(0)}50%{transform:skewY(-14deg)}}
.ac-blink{animation:ac-blink 1.2s steps(2,start) infinite}
@keyframes ac-blink{to{visibility:hidden}}
.ac-scene{opacity:0;animation:ac-scene 16s linear infinite}
@keyframes ac-scene{0%{opacity:0}3%,22%{opacity:1}25%,100%{opacity:0}}
.ac-prog{transform-origin:left;animation:ac-prog 16s linear infinite}
@keyframes ac-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion: reduce){[class*="ac-"]{animation:none!important}.ac-draw{stroke-dashoffset:0}.ac-scene:first-child{opacity:1}}
"""


class Scene:
    def __init__(self, s=14):
        self.s = s
        self.o = []
        self.xs, self.ys = [], []

    def P(self, x, y, z=0):
        px, py = (x - y) * C * self.s, (x + y) * 0.5 * self.s - z * self.s
        self.xs.append(px)
        self.ys.append(py)
        return px, py

    def mark(self, x0, y0, x1, y1):
        self.xs += [x0, x1]
        self.ys += [y0, y1]

    def add(self, svg):
        self.o.append(svg)

    @staticmethod
    def pts(ps):
        return " ".join(f"{x:.1f},{y:.1f}" for x, y in ps)

    def poly(self, ps, fill, stroke=INK, sw=1.3, extra=""):
        return f'<polygon points="{self.pts(ps)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" {extra}></polygon>'

    def box(self, x, y, z, w, d, h, shades=WHITE, stroke=INK, sw=1.3, ret=False):
        P = self.P
        top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]
        left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]
        right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]
        svg = self.poly(left, shades[1], stroke, sw) + self.poly(right, shades[2], stroke, sw) + self.poly(top, shades[0], stroke, sw)
        if ret:
            return svg
        self.add(svg)

    def flat(self, x, y, z, w, d, fill, stroke=INK, sw=1.3, extra="", ret=False):
        P = self.P
        svg = self.poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill, stroke, sw, extra)
        if ret:
            return svg
        self.add(svg)

    def line(self, a, b, stroke=INK, sw=1.3, extra=""):
        (x0, y0), (x1, y1) = self.P(*a), self.P(*b)
        return f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" {extra}></line>'

    def path(self, pts3, closed=False):
        ps = [self.P(*p) for p in pts3]
        d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in ps)
        return d + (" Z" if closed else "")

    def tree(self, x, y, r=1.0, h=1.6):
        bx, by = self.P(x, y, 0)
        tx, ty = self.P(x, y, h)
        R = r * self.s
        self.mark(tx - R, ty - 2 * R, tx + R, by)
        self.add(f'<ellipse cx="{bx:.1f}" cy="{by:.1f}" rx="{R * 0.8:.1f}" ry="{R * 0.4:.1f}" fill="{NAVY}" opacity="0.10"></ellipse>'
                 f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{tx:.1f}" y2="{ty - R:.1f}" stroke="{INK}" stroke-width="1.6"></line>'
                 f'<circle cx="{tx:.1f}" cy="{ty - R:.1f}" r="{R:.1f}" fill="{TREE}" stroke="{INK}" stroke-width="1.3"></circle>'
                 f'<path d="M{tx:.1f} {ty - R * 0.2:.1f} l{R * 0.35:.1f} {-R * 0.45:.1f}" stroke="#FFFFFF" stroke-width="1.3" fill="none" opacity="0.8"></path>')

    def label(self, x, y, z, text, fill=INK, size=11, mono=True, anchor="middle", weight=500, dx=0, dy=0):
        px, py = self.P(x, y, z)
        fam = "IBM Plex Mono, monospace" if mono else "Inter, sans-serif"
        self.mark(px + dx - len(text) * size * 0.32, py + dy - size, px + dx + len(text) * size * 0.32, py + dy + 2)
        return f'<text x="{px + dx:.1f}" y="{py + dy:.1f}" text-anchor="{anchor}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}">{text}</text>'

    def render(self, w=None, h=None, pad=10, label="Illustration"):
        x0, x1 = min(self.xs) - pad, max(self.xs) + pad
        y0, y1 = min(self.ys) - pad, max(self.ys) + pad
        vw, vh = x1 - x0, y1 - y0
        if w and not h:
            h = w * vh / vw
        elif h and not w:
            w = h * vw / vh
        return (f'<svg width="{w:.0f}" height="{h:.0f}" viewBox="{x0:.1f} {y0:.1f} {vw:.1f} {vh:.1f}" role="img" aria-label="{label}" '
                f'style="display: block; overflow: visible">' + "".join(self.o) + "</svg>")


def sparkle(cx, cy, r, fill=VIOLET, cls="ac-tw", delay=0):
    d = (f"M{cx} {cy - r} C{cx + r * 0.12} {cy - r * 0.12} {cx + r * 0.12} {cy - r * 0.12} {cx + r} {cy} "
         f"C{cx + r * 0.12} {cy + r * 0.12} {cx + r * 0.12} {cy + r * 0.12} {cx} {cy + r} "
         f"C{cx - r * 0.12} {cy + r * 0.12} {cx - r * 0.12} {cy + r * 0.12} {cx - r} {cy} "
         f"C{cx - r * 0.12} {cy - r * 0.12} {cx - r * 0.12} {cy - r * 0.12} {cx} {cy - r} Z")
    return f'<path class="{cls}" style="animation-delay: {delay}s" d="{d}" fill="{fill}"></path>'


def bubble(x, y, w, h, inner, sc=None, fill="#FFFFFF", stroke=LINE2, cls=""):
    if sc:
        sc.mark(x, y, x + w, y + h)
    return (f'<g class="{cls}"><rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{stroke}" stroke-width="1.2"></rect>{inner}</g>')


def txt(x, y, t, size=11, fill=INK, weight=500, mono=False, anchor="start"):
    fam = "IBM Plex Mono, monospace" if mono else "Inter, sans-serif"
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}">{t}</text>'


def slab(sc, w, d, shades=GROUND, grid=0):
    sc.box(0, 0, -0.5, w, d, 0.5, shades)
    if grid:
        g = "".join(sc.line((i, 0, 0), (i, d, 0), LINE, 0.8) for i in range(grid, int(w), grid))
        g += "".join(sc.line((0, j, 0), (w, j, 0), LINE, 0.8) for j in range(grid, int(d), grid))
        sc.add(g)


# ----------------------------------------------------------------- how it works
def plot_card(w=260):
    sc = Scene(13)
    slab(sc, 12, 17, grid=2)
    sc.add(f'<path d="{sc.path([(0.6, 0.6, 0), (11.4, 0.6, 0), (11.4, 16.4, 0), (0.6, 16.4, 0)], True)}" fill="none" stroke="{BLUE}" stroke-width="1.6" stroke-dasharray="6 4"></path>')
    for cx, cy in ((0.6, 0.6), (11.4, 0.6), (11.4, 16.4), (0.6, 16.4)):
        sc.box(cx - 0.25, cy - 0.25, 0, 0.5, 0.5, 0.7, NAVYF, sw=1)
    # dimension lines
    sc.add(sc.line((0.6, -1.4, 0), (11.4, -1.4, 0), INK, 1) + sc.line((0.6, -1.0, 0), (0.6, -1.8, 0), INK, 1) + sc.line((11.4, -1.0, 0), (11.4, -1.8, 0), INK, 1))
    sc.add(sc.line((12.9, 0.6, 0), (12.9, 16.4, 0), INK, 1) + sc.line((12.5, 0.6, 0), (13.3, 0.6, 0), INK, 1) + sc.line((12.5, 16.4, 0), (13.3, 16.4, 0), INK, 1))
    sc.add(sc.label(6, -2.6, 0, "25'-0\"", size=11, dx=-6) + sc.label(14.6, 8.5, 0, "45'-0\"", size=11, dx=14))
    sc.tree(1.9, 13.6, 0.9, 1.7)
    sc.tree(1.9, 10.8, 0.75, 1.4)
    px, py = sc.P(6, 8.5, 0)
    sc.mark(px - 14, py - 64, px + 14, py)
    sc.add(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="10" ry="4.5" fill="{NAVY}" opacity="0.15"></ellipse>'
           f'<g class="ac-bob"><path d="M{px:.1f} {py - 4:.1f} C{px - 4:.1f} {py - 16:.1f} {px - 14:.1f} {py - 24:.1f} {px - 14:.1f} {py - 36:.1f} '
           f'A14 14 0 1 1 {px + 14:.1f} {py - 36:.1f} C{px + 14:.1f} {py - 24:.1f} {px + 4:.1f} {py - 16:.1f} {px:.1f} {py - 4:.1f} Z" fill="{BRICK}" stroke="{INK}" stroke-width="1.3"></path>'
           f'<circle cx="{px:.1f}" cy="{py - 37:.1f}" r="5.5" fill="#FFFFFF" stroke="{INK}" stroke-width="1.2"></circle></g>')
    bx, by = sc.P(10, 14, 0)
    sc.add(bubble(bx - 6, by + 2, 98, 26, txt(bx + 43, by + 19, "5 Marla", 12, INK, 700, anchor="middle"), sc))
    return sc.render(w, label="A 5 Marla plot with its width and depth marked")


def draw_card(w=260):
    sc = Scene(13)
    slab(sc, 12, 17, grid=1)
    route = [(0.5, 0.5, 0.05), (11.5, 0.5, 0.05), (11.5, 16.5, 0.05), (0.5, 16.5, 0.05), (0.5, 7, 0.05), (11.5, 7, 0.05), (11.5, 0.5, 0.05)]
    d = sc.path(route)
    d2 = sc.path([(6, 0.5, 0.05), (6, 7, 0.05)])
    sc.add(f'<path d="{d}" fill="none" stroke="{LINE2}" stroke-width="1.4" stroke-dasharray="4 4"></path>')
    sc.add(f'<path d="{d}" pathLength="100" class="ac-draw" fill="none" stroke="{INK}" stroke-width="4" stroke-linejoin="miter"></path>')
    sc.add(f'<path d="{d2}" fill="none" stroke="{INK}" stroke-width="4" class="ac-pulse"></path>')
    for p in route[:4]:
        x, y = sc.P(*p)
        sc.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.6" fill="#FFFFFF" stroke="{BLUE}" stroke-width="1.8"></circle>')
    # pencil follows the path
    sc.add(f'<g><g transform="rotate(-35)"><rect x="0" y="-34" width="9" height="28" rx="1.5" fill="{BLUE}" stroke="{INK}" stroke-width="1.2"></rect>'
           f'<rect x="0" y="-38" width="9" height="5" rx="1" fill="{BRICK}" stroke="{INK}" stroke-width="1.2"></rect>'
           f'<path d="M0 -6 L9 -6 L4.5 2 Z" fill="#F3E3C8" stroke="{INK}" stroke-width="1.2"></path></g>'
           f'<animateMotion dur="5s" repeatCount="indefinite" path="{d}" keyPoints="0;1;1" keyTimes="0;0.5;1" calcMode="linear"></animateMotion></g>')
    bx, by = sc.P(3, 2, 0)
    sc.add(bubble(bx - 52, by - 2, 104, 24, txt(bx, by + 14, "11'-0\" × 12'-0\"", 11, BLUE, 500, True, "middle"), sc, BLUE_T, "#AFC4E3"))
    return sc.render(w, label="Walls being drawn on a plan with a pencil")


def room3d_card(w=260):
    sc = Scene(15)
    slab(sc, 11, 11, WHITE)
    sc.flat(3.2, 2.6, 0.01, 6, 5.6, BLUE_T, "#AFC4E3", 1)
    sc.box(0, 0, 0, 0.4, 11, 4.2, WHITE)
    sc.box(0.4, 0, 0, 10.6, 0.4, 4.2, WHITE)
    # window on back wall
    sc.add(sc.poly([sc.P(5, 0.4, 1.6), sc.P(8.5, 0.4, 1.6), sc.P(8.5, 0.4, 3.4), sc.P(5, 0.4, 3.4)], "#DCE7F5"))
    sc.add(sc.line((6.75, 0.4, 1.6), (6.75, 0.4, 3.4), INK, 1.1))
    # sofa drops in
    sofa = sc.box(0.6, 3, 0, 2.4, 5, 1.0, BLUEF, ret=True) + sc.box(0.6, 3, 1.0, 0.7, 5, 1.0, BLUEF, ret=True)
    sofa += sc.box(0.6, 2.4, 0, 2.4, 0.6, 1.5, BLUEF, ret=True) + sc.box(0.6, 8, 0, 2.4, 0.6, 1.5, BLUEF, ret=True)
    sc.add(f'<g class="ac-drop">{sofa}</g>')
    table = sc.box(4.4, 4.4, 0, 2.6, 2, 0.8, WHITE, ret=True)
    sc.add(f'<g class="ac-drop" style="animation-delay: .35s">{table}</g>')
    sc.box(8.6, 1.2, 0, 1.1, 1.1, 1.0, BRICKF)
    lx, ly = sc.P(9.15, 1.75, 1.0)
    sc.add(f'<circle cx="{lx:.1f}" cy="{ly - 16:.1f}" r="13" fill="{TREE}" stroke="{INK}" stroke-width="1.3"></circle>'
           f'<path d="M{lx:.1f} {ly:.1f} V{ly - 10:.1f}" stroke="{INK}" stroke-width="1.4"></path>')
    sc.mark(lx - 14, ly - 30, lx + 14, ly)
    # orbit ring
    ox, oy = sc.P(5.5, 5.5, 6.2)
    ring = f"M{ox - 44:.1f} {oy:.1f} A44 13 0 1 0 {ox + 44:.1f} {oy:.1f} A44 13 0 1 0 {ox - 44:.1f} {oy:.1f}"
    sc.mark(ox - 46, oy - 15, ox + 46, oy + 15)
    sc.add(f'<path d="{ring}" fill="none" stroke="{BLUE}" stroke-width="1.4" stroke-dasharray="5 4"></path>'
           f'<circle r="5" fill="{BLUE}" stroke="#FFFFFF" stroke-width="1.5"><animateMotion dur="4s" repeatCount="indefinite" path="{ring}"></animateMotion></circle>'
           + txt(ox, oy + 4, "3D", 12, BLUE, 700, anchor="middle"))
    return sc.render(w, label="A furnished room in 3D")


def ai_card(w=260):
    sc = Scene(13)
    slab(sc, 12, 17, grid=0)
    sc.flat(0.4, 7.2, 0.02, 11.2, 1.8, VIOLET_T, VIOLET, 1.2, 'stroke-dasharray="5 3" class="ac-pulse"')
    sc.box(0, 0, 0, 0.35, 17, 1.4, WHITE)
    sc.box(0.35, 0, 0, 11.65, 0.35, 1.4, WHITE)
    sc.box(5.8, 0.35, 0, 0.35, 6.85, 1.4, WHITE)
    dx, dy = (-1.8 * C * 13), (0.9 * 13)
    wall = sc.box(0.35, 7.0, 0, 11.3, 0.35, 1.4, LBLUE, BLUE, ret=True)
    sc.add(f'<g class="ac-slide" style="--dx: {dx:.1f}px; --dy: {dy:.1f}px">{wall}</g>')
    sc.box(11.65, 0.35, 0, 0.35, 16.65, 1.4, WHITE)
    sc.box(0.35, 16.65, 0, 11.3, 0.35, 1.4, WHITE)
    sc.add(sc.label(3, 3.6, 0, "Bedroom 1", INK, 10, False, weight=600) + sc.label(9, 3.6, 0, "Kitchen", INK, 10, False, weight=600)
           + sc.label(6, 12.5, 0, "Lounge", INK, 10, False, weight=600))
    tx, ty = sc.P(2, 0, 3)
    sc.mark(tx - 20, ty - 40, tx + 160, ty + 10)
    sc.add(sparkle(tx - 6, ty - 22, 9) + sparkle(tx + 8, ty - 36, 5, delay=.5) + sparkle(tx - 18, ty - 34, 4, delay=1))
    bx, by = sc.P(9, 12, 0)
    inner = (txt(bx + 12, by + 17, "Make bedroom 1 bigger", 11, INK, 500)
             + f'<rect x="{bx + 10:.1f}" y="{by + 25:.1f}" width="62" height="18" rx="5" fill="{VIOLET_T}"></rect>'
             + txt(bx + 41, by + 38, "+35 sq ft", 10.5, VIOLET, 700, anchor="middle"))
    sc.add(bubble(bx, by, 148, 52, inner, sc, "#FFFFFF", "#C9BDF5", "ac-float"))
    return sc.render(w, label="ArchCanvas AI moving a wall to make a bedroom bigger")


def cost_card(w=260):
    sc = Scene(14)
    slab(sc, 13, 11)
    for k in range(3):
        for i in range(3):
            for j in range(2):
                sc.box(0.8 + i * 1.7, 0.8 + j * 0.9, k * 0.6, 1.6, 0.8, 0.6, BRICKF, sw=1)
    for k in range(3):
        sc.box(7.4, 0.8 + (k % 2) * 0.15, k * 0.95, 2.6, 1.7, 0.95, WHITE, sw=1.2)
    for i in range(4):
        sc.box(1.0, 5.2 + i * 0.45, 0, 10.5, 0.3, 0.3, NAVYF, sw=0.8)
    sc.box(1.6, 8.0, 0, 2.2, 2.0, 1.4, WHITE)
    cx, cy = sc.P(10.5, 6.5, 4.5)
    bars = "".join(f'<rect class="ac-grow" style="animation-delay: {i * 0.25}s" x="{cx + 14 + i * 16:.1f}" y="{cy + 44 - hh:.1f}" width="10" height="{hh}" rx="2" fill="{c}"></rect>'
                   for i, (hh, c) in enumerate(((30, NAVY), (20, BLUE), (14, BRICK), (24, "#9DB5D8"))))
    inner = (txt(cx + 10, cy + 16, "PKR / sq ft", 10, MUTED, 500) + txt(cx + 10, cy + 31, "2,791", 15, INK, 500, True)
             + f'<g transform="translate(70 -10)">{bars}</g>')
    sc.add(bubble(cx, cy, 150, 52, inner, sc, "#FFFFFF", LINE2, "ac-float"))
    return sc.render(w, label="Bricks, cement and steel with a cost per square foot")


# ----------------------------------------------------------------- 404 and states
def not_found(w=520):
    sc = Scene(16)
    slab(sc, 16, 14, grid=2)
    sc.flat(8, 2, 0.02, 6.5, 6, "none", BLUE, 1.6, 'stroke-dasharray="7 5"')
    sc.add(sc.label(11.2, 5, 0.1, "?", BLUE, 30, False, weight=700, dy=10))
    # lone door frame
    sc.box(3, 7, 0, 0.4, 0.4, 5.2, WHITE)
    sc.box(3, 9.6, 0, 0.4, 0.4, 5.2, WHITE)
    sc.box(3, 7, 5.2, 0.4, 3.0, 0.4, WHITE)
    leaf = sc.poly([sc.P(3.4, 7.4, 0), sc.P(3.4, 9.6, 0), sc.P(3.4, 9.6, 5.1), sc.P(3.4, 7.4, 5.1)], BRICK)
    kx, ky = sc.P(3.4, 9.1, 2.6)
    sc.add(f'<g class="ac-swing">{leaf}<circle cx="{kx:.1f}" cy="{ky:.1f}" r="2.4" fill="#FFFFFF" stroke="{INK}"></circle></g>')
    # tape measure
    sc.box(10.5, 10.5, 0, 1.6, 1.6, 1.2, NAVYF)
    tp = sc.path([(10.5, 11.3, 0.3), (5.2, 11.3, 0.3)])
    sc.add(f'<path d="{tp}" pathLength="100" class="ac-draw" stroke="{BRICK}" stroke-width="4" fill="none"></path>')
    hx, hy = sc.P(11.3, 11.3, 1.2)
    sc.add(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="5" fill="#FFFFFF" stroke="{INK}" stroke-width="1.2"></circle>')
    sc.tree(15, 1, 1.2, 2.2)
    sc.tree(1.4, 12.4, 0.9, 1.7)
    return sc.render(w, label="A door standing alone on an empty plot, and a missing room")


def st_error(w=200):
    sc = Scene(13)
    slab(sc, 9, 7)
    sc.box(1, 1, 0, 7, 0.6, 4.2, WHITE)
    crack = sc.path([(3.2, 1.6, 4.2), (3.8, 1.6, 3.2), (3.0, 1.6, 2.4), (4.0, 1.6, 1.4), (3.4, 1.6, 0.4)])
    sc.add(f'<path d="{crack}" pathLength="100" class="ac-draw" fill="none" stroke="{INK}" stroke-width="2"></path>')
    cx, cy = sc.P(6.5, 4.6, 0)
    sc.mark(cx - 18, cy - 40, cx + 18, cy + 4)
    sc.add(f'<g class="ac-bob"><path d="M{cx - 14:.1f} {cy:.1f} L{cx:.1f} {cy - 38:.1f} L{cx + 14:.1f} {cy:.1f} Z" fill="{BRICK}" stroke="{INK}" stroke-width="1.3"></path>'
           f'<path d="M{cx - 8:.1f} {cy - 15:.1f} H{cx + 8:.1f}" stroke="#FFFFFF" stroke-width="4"></path>'
           f'<rect x="{cx - 18:.1f}" y="{cy - 2:.1f}" width="36" height="5" rx="1.5" fill="{NAVY}"></rect></g>')
    return sc.render(w, label="A cracked wall with a traffic cone")


def st_offline(w=200):
    sc = Scene(13)
    slab(sc, 9, 7)
    sc.box(2, 2, 0, 5, 3.4, 0.35, NAVYF)
    scr = [sc.P(2, 2, 0.35), sc.P(7, 2, 0.35), sc.P(7, 2, 3.8), sc.P(2, 2, 3.8)]
    sc.add(sc.poly(scr, NAVY) + sc.poly([sc.P(2.3, 2, 0.6), sc.P(6.7, 2, 0.6), sc.P(6.7, 2, 3.5), sc.P(2.3, 2, 3.5)], "#FFFFFF", INK, 1))
    mx, my = sc.P(4.5, 2, 2.1)
    sc.add(f'<path d="M{mx - 14:.1f} {my + 2:.1f} a7 7 0 0 1 4 -12 a9 9 0 0 1 17 2 a6 6 0 0 1 2 11 Z" fill="{BLUE_T}" stroke="{BLUE}" stroke-width="1.4"></path>'
           f'<path d="M{mx - 14:.1f} {my - 12:.1f} L{mx + 12:.1f} {my + 8:.1f}" stroke="{BRICK}" stroke-width="2.2" stroke-linecap="round"></path>')
    a, b = sc.P(7, 4.5, 0.15), sc.P(8.6, 6.2, 0.15)
    sc.add(f'<path d="M{a[0]:.1f} {a[1]:.1f} Q{a[0] + 14:.1f} {a[1] + 2:.1f} {a[0] + 18:.1f} {a[1] + 10:.1f}" fill="none" stroke="{INK}" stroke-width="1.6"></path>'
           f'<rect class="ac-blink" x="{a[0] + 22:.1f}" y="{a[1] + 10:.1f}" width="9" height="6" rx="1" fill="{BRICK}"></rect>')
    sc.mark(a[0], a[1], b[0] + 10, b[1] + 10)
    return sc.render(w, label="A laptop with no connection")


def st_ai(w=200):
    sc = Scene(13)
    slab(sc, 7, 9, grid=1)
    sc.flat(0, 0, 0.02, 7, 9, "none", BLUE, 1.4, 'stroke-dasharray="5 4"')
    for i, (x, y, z) in enumerate(((0.6, 0.6, 0), (3.8, 0.6, 0), (0.6, 4.6, 0), (3.8, 4.6, 0), (2.2, 2.6, 0.9))):
        bed = sc.box(x, y, z, 2.6, 3.4, 0.9, WHITE, sw=1.1, ret=True) + sc.box(x + 0.3, y + 0.2, z + 0.9, 2.0, 0.8, 0.3, LBLUE, sw=1, ret=True)
        sc.add(f'<g class="{"ac-bob" if i == 4 else ""}">{bed}</g>')
    tx, ty = sc.P(7, 0, 3)
    sc.mark(tx - 10, ty - 30, tx + 20, ty)
    sc.add(sparkle(tx + 4, ty - 14, 9) + sparkle(tx + 16, ty - 26, 4.5, delay=.6))
    return sc.render(w, label="Five beds that do not fit on a small plot")


def st_lock(w=200):
    sc = Scene(13)
    slab(sc, 9, 7)
    sc.box(2, 2, 0, 0.5, 0.5, 5, WHITE)
    sc.box(6, 2, 0, 0.5, 0.5, 5, WHITE)
    sc.box(2, 2, 5, 4.5, 0.5, 0.5, WHITE)
    sc.add(sc.poly([sc.P(2.5, 2.5, 0), sc.P(6, 2.5, 0), sc.P(6, 2.5, 5), sc.P(2.5, 2.5, 5)], "#DCE2E8"))
    lx, ly = sc.P(4.25, 2.5, 2.4)
    sc.add(f'<g class="ac-bob"><path d="M{lx - 8:.1f} {ly - 6:.1f} v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="{INK}" stroke-width="3"></path>'
           f'<rect x="{lx - 13:.1f}" y="{ly - 7:.1f}" width="26" height="22" rx="4" fill="{NAVY}"></rect>'
           f'<circle cx="{lx:.1f}" cy="{ly + 2:.1f}" r="3" fill="{BLUE_T}"></circle><path d="M{lx:.1f} {ly + 4:.1f} v5" stroke="{BLUE_T}" stroke-width="2.2"></path></g>')
    return sc.render(w, label="A closed door with a padlock")


def st_empty(w=200):
    sc = Scene(13)
    slab(sc, 9, 9, grid=1)
    sc.flat(1.5, 1.5, 0.02, 6, 6, "#FFFFFF", BLUE, 1.6, 'stroke-dasharray="6 4"')
    px, py = sc.P(4.5, 4.5, 0)
    sc.add(f'<g class="ac-float"><circle cx="{px:.1f}" cy="{py - 8:.1f}" r="15" fill="{BLUE}" stroke="{INK}" stroke-width="1.3"></circle>'
           f'<path d="M{px - 6:.1f} {py - 8:.1f} H{px + 6:.1f} M{px:.1f} {py - 14:.1f} V{py - 2:.1f}" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"></path></g>')
    sc.tree(9.8, 1, 0.9, 1.7)
    return sc.render(w, label="An empty plot waiting for a first plan")


def st_denied(w=200):
    sc = Scene(13)
    slab(sc, 10, 6)
    sc.box(0.8, 2, 0, 0.7, 0.7, 4.2, NAVYF)
    sc.box(8.5, 2, 0, 0.7, 0.7, 4.2, NAVYF)
    bars = "".join(sc.line((x, 2.35, 0.2), (x, 2.35, 3.6), INK, 2.2) for x in (2.2, 3.4, 4.6, 5.8, 7.0, 8.0))
    bars += sc.line((1.5, 2.35, 3.0), (8.5, 2.35, 3.0), INK, 2.2) + sc.line((1.5, 2.35, 0.9), (8.5, 2.35, 0.9), INK, 2.2)
    sc.add(bars)
    sx, sy = sc.P(5, 2.35, 2.1)
    sc.add(f'<g class="ac-bob"><path d="M{sx:.1f} {sy - 16:.1f} l13 5 v9 c0 9 -6 14 -13 17 c-7 -3 -13 -8 -13 -17 v-9 Z" fill="#FFFFFF" stroke="{INK}" stroke-width="1.4"></path>'
           f'<path d="M{sx:.1f} {sy - 7:.1f} v8 M{sx:.1f} {sy + 5:.1f} v0.5" stroke="{BRICK}" stroke-width="2.6" stroke-linecap="round"></path></g>')
    return sc.render(w, label="A closed gate with a shield")
