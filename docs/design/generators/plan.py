"""Shared 5 Marla plan geometry and SVG renderers (2D architectural plan, isometric 3D, thumbnails)."""

NAVY = "#13202C"
BLUE = "#1E5AA8"
VIOLET = "#6B4FD8"
AMBER = "#A85F00"
GREEN = "#2F7A5B"
RED = "#B42318"
MUTED = "#5F6B76"

W, D = 25, 45  # plot width (front) and depth, in feet

LAWN = dict(id="lawn", name="Back lawn", x=0, y=0, w=25, d=5, floor="lawn")
ROOMS = [
    dict(id="bed1", name="Bedroom 1", x=0, y=5, w=11, d=12, floor="room"),
    dict(id="kitchen", name="Kitchen", x=11, y=5, w=14, d=12, floor="tile"),
    dict(id="lounge", name="TV lounge", x=0, y=17, w=16, d=13, floor="room"),
    dict(id="bath", name="Bath", x=16, y=17, w=9, d=6, floor="tile"),
    dict(id="stairs", name="Stairs", x=16, y=23, w=9, d=7, floor="tile"),
    dict(id="porch", name="Car porch", x=0, y=30, w=12, d=15, floor="paved"),
    dict(id="drawing", name="Drawing room", x=12, y=30, w=13, d=10, floor="room"),
    dict(id="entry", name="Entry", x=12, y=40, w=13, d=5, floor="tile"),
]

EXT, INT, BND = 0.75, 0.5, 0.5
# walls: (axis, c, a, b, thickness, kind) axis h = along x at y=c, v = along y at x=c
WALLS = [
    ("h", 0, 0, 25, BND, "boundary"),
    ("v", 0, 0, 5, BND, "boundary"),
    ("v", 25, 0, 5, BND, "boundary"),
    ("h", 5, 0, 25, EXT, "ext"),
    ("v", 0, 5, 45, EXT, "ext"),
    ("v", 25, 5, 45, EXT, "ext"),
    ("h", 45, 12, 25, EXT, "ext"),
    ("v", 11, 5, 17, INT, "int"),
    ("h", 17, 0, 25, INT, "int"),
    ("v", 16, 17, 30, INT, "int"),
    ("h", 23, 16, 25, INT, "int"),
    ("h", 30, 0, 25, INT, "int"),
    ("v", 12, 30, 45, INT, "int"),
    ("h", 40, 12, 25, INT, "int"),
]
# doors: (axis, c, a, b, hinge 'a'|'b'|None, swing +1|-1)
DOORS = [
    ("h", 17, 6, 9, "a", -1),
    ("h", 17, 12, 15, "b", -1),
    ("h", 5, 21.2, 24.2, "b", 1),
    ("v", 16, 18, 20.5, "a", 1),
    ("v", 16, 24, 29, None, 0),
    ("h", 30, 13, 16, "a", -1),
    ("h", 30, 4, 7, "a", -1),
    ("h", 40, 14, 17, "a", -1),
    ("h", 45, 19, 22.5, "b", -1),
]
WINDOWS = [
    ("h", 5, 3, 8),
    ("h", 5, 13, 18),
    ("v", 12, 32, 37),
    ("h", 45, 14, 17),
    ("h", 30, 8.5, 11.5),
]
# furniture: (kind, x0, y0, x1, y1)
FURN = [
    ("bed", 2.5, 5.5, 8.5, 12.0),
    ("nightstand", 0.7, 5.5, 2.2, 7.0),
    ("nightstand", 8.8, 5.5, 10.3, 7.0),
    ("wardrobe", 0.5, 13.0, 2.5, 16.5),
    ("counter", 11.4, 5.4, 20.0, 7.4),
    ("counter", 22.6, 8.5, 24.6, 16.5),
    ("stove", 17.6, 5.6, 19.6, 7.2),
    ("sink", 22.9, 11.0, 24.3, 12.8),
    ("table", 11.9, 10.6, 15.1, 13.4),
    ("sofa_v", 0.5, 20.0, 3.3, 27.0),
    ("armchair", 7.5, 26.0, 10.0, 28.5),
    ("ctable", 4.6, 21.5, 7.0, 25.5),
    ("basin", 17.2, 17.4, 18.6, 18.7),
    ("wc", 22.8, 21.0, 24.6, 22.7),
    ("shower", 21.0, 17.4, 23.0, 19.4),
    ("stairs", 16.4, 23.4, 24.6, 29.6),
    ("car", 2.8, 31.0, 9.2, 44.2),
    ("sofa_v", 22.2, 31.5, 24.6, 38.0),
    ("armchair", 14.5, 31.0, 17.0, 33.5),
    ("ctable", 18.4, 33.0, 21.0, 36.5),
]

FLOOR_2D = {"room": "#FAF9F7", "tile": "#F2F4F5", "paved": "#EEF0F2", "lawn": "#EEF3EC"}


def ftin(v):
    feet = int(v)
    inches = round((v - feet) * 12)
    if inches == 12:
        feet, inches = feet + 1, 0
    return f"{feet}'-{inches}\""


def r(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def plan2d(s, *, dims=True, furniture=True, labels=True, selected=None, ai_ghost=None,
           warn=None, snap=False, handles=True, rooms=None, lawn=True, extra="", label_scale=1.0,
           bed_depth=None, draft_wall=None):
    """Return an <svg> string of the plan at s px per foot."""
    rooms = rooms or ROOMS
    ml, mt = (46, 40) if dims else (6, 6)
    X = lambda v: ml + v * s
    Y = lambda v: mt + v * s
    width = ml + W * s + 12
    height = mt + D * s + 12
    o = [f'<svg width="{r(width)}" height="{r(height)}" viewBox="0 0 {r(width)} {r(height)}" '
         f'role="img" aria-label="2D floor plan of a 5 Marla ground floor" style="display: block">']
    if lawn:
        o.append(f'<rect x="{r(X(0))}" y="{r(Y(0))}" width="{r(W*s)}" height="{r(5*s)}" fill="{FLOOR_2D["lawn"]}"></rect>')
    for rm in rooms:
        fill = FLOOR_2D.get(rm["floor"], "#FAF9F7")
        if selected == rm["id"]:
            fill = "#E6EEF8"
        o.append(f'<rect x="{r(X(rm["x"]))}" y="{r(Y(rm["y"]))}" width="{r(rm["w"]*s)}" height="{r(rm["d"]*s)}" fill="{fill}"></rect>')
    if ai_ghost:
        gx, gy, gw, gd = ai_ghost
        o.append(f'<rect x="{r(X(gx))}" y="{r(Y(gy))}" width="{r(gw*s)}" height="{r(gd*s)}" fill="#EFEAFD" stroke="{VIOLET}" stroke-width="1.5" stroke-dasharray="5 3"></rect>')
        o.append(f'<rect x="{r(X(gx)+6)}" y="{r(Y(gy)+6)}" width="74" height="20" rx="4" fill="{VIOLET}"></rect>')
        o.append(f'<text x="{r(X(gx)+43)}" y="{r(Y(gy)+20)}" text-anchor="middle" font-family="Inter, sans-serif" font-size="11.5" font-weight="600" fill="#FFFFFF">+35 sq ft</text>')
    if furniture:
        o.append(furniture2d(X, Y, s))
    # walls
    for ax, c, a, b, t, kind in WALLS:
        col = NAVY if kind != "boundary" else "#4A5866"
        if ax == "h":
            o.append(f'<rect x="{r(X(a - t/2))}" y="{r(Y(c - t/2))}" width="{r((b - a + t)*s)}" height="{r(t*s)}" fill="{col}"></rect>')
        else:
            o.append(f'<rect x="{r(X(c - t/2))}" y="{r(Y(a - t/2))}" width="{r(t*s)}" height="{r((b - a + t)*s)}" fill="{col}"></rect>')
    if draft_wall:
        (x0, y0, x1, y1, tx, ty) = draft_wall
        o.append(f'<line x1="{r(X(x0))}" y1="{r(Y(y0))}" x2="{r(X(x1))}" y2="{r(Y(y1))}" stroke="{RED}" stroke-width="{r(0.5*s)}"></line>')
        o.append(f'<line x1="{r(X(x1))}" y1="{r(Y(y1))}" x2="{r(X(tx))}" y2="{r(Y(ty))}" stroke="{BLUE}" stroke-width="1.5" stroke-dasharray="3 3"></line>')
        o.append(f'<circle cx="{r(X(x1))}" cy="{r(Y(y1))}" r="5" fill="#FFFFFF" stroke="{RED}" stroke-width="2"></circle>')
        o.append(f'<circle cx="{r(X(tx))}" cy="{r(Y(ty))}" r="5" fill="#FFFFFF" stroke="{BLUE}" stroke-width="2.5"></circle>')
    # doors
    gapfill = "#FAF9F7"
    for ax, c, a, b, hinge, sw in DOORS:
        t = EXT + 0.1
        if ax == "h":
            o.append(f'<rect x="{r(X(a))}" y="{r(Y(c - t/2))}" width="{r((b-a)*s)}" height="{r(t*s)}" fill="{gapfill}"></rect>')
        else:
            o.append(f'<rect x="{r(X(c - t/2))}" y="{r(Y(a))}" width="{r(t*s)}" height="{r((b-a)*s)}" fill="{gapfill}"></rect>')
        if hinge:
            w = b - a
            hp = a if hinge == "a" else b
            other = b if hinge == "a" else a
            if ax == "h":
                hx, hy = X(hp), Y(c)
                lx, ly = X(hp), Y(c + sw * w)
                ex, ey = X(other), Y(c)
            else:
                hx, hy = X(c), Y(hp)
                lx, ly = X(c + sw * w), Y(hp)
                ex, ey = X(c), Y(other)
            cross = (lx - hx) * (ey - hy) - (ly - hy) * (ex - hx)
            sweep = 1 if cross < 0 else 0
            col = AMBER if warn == "bathdoor" and ax == "v" and c == 16 and a == 18 else NAVY
            o.append(f'<line x1="{r(hx)}" y1="{r(hy)}" x2="{r(lx)}" y2="{r(ly)}" stroke="{col}" stroke-width="1.6"></line>')
            o.append(f'<path d="M{r(lx)} {r(ly)} A{r(w*s)} {r(w*s)} 0 0 {sweep} {r(ex)} {r(ey)}" fill="none" stroke="{col}" stroke-width="0.9"></path>')
    # porch gate
    o.append(f'<line x1="{r(X(0.4))}" y1="{r(Y(45))}" x2="{r(X(11.6))}" y2="{r(Y(45))}" stroke="{NAVY}" stroke-width="1.4" stroke-dasharray="6 3"></line>')
    # windows
    for ax, c, a, b in WINDOWS:
        t = EXT if c in (5, 45) else INT
        if ax == "h":
            o.append(f'<rect x="{r(X(a))}" y="{r(Y(c - t/2))}" width="{r((b-a)*s)}" height="{r(t*s)}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="1"></rect>')
            o.append(f'<line x1="{r(X(a))}" y1="{r(Y(c))}" x2="{r(X(b))}" y2="{r(Y(c))}" stroke="{NAVY}" stroke-width="0.8"></line>')
        else:
            o.append(f'<rect x="{r(X(c - t/2))}" y="{r(Y(a))}" width="{r(t*s)}" height="{r((b-a)*s)}" fill="#FFFFFF" stroke="{NAVY}" stroke-width="1"></rect>')
            o.append(f'<line x1="{r(X(c))}" y1="{r(Y(a))}" x2="{r(X(c))}" y2="{r(Y(b))}" stroke="{NAVY}" stroke-width="0.8"></line>')
    if warn == "bathdoor":
        o.append(f'<circle cx="{r(X(17.6))}" cy="{r(Y(19.0))}" r="{r(2.4*s)}" fill="{AMBER}" fill-opacity="0.12" stroke="{AMBER}" stroke-width="1.5" stroke-dasharray="4 3"></circle>')
    # selection
    if selected:
        rm = next(x for x in rooms if x["id"] == selected)
        x0, y0, x1, y1 = X(rm["x"]), Y(rm["y"]), X(rm["x"] + rm["w"]), Y(rm["y"] + rm["d"])
        o.append(f'<rect x="{r(x0)}" y="{r(y0)}" width="{r(x1-x0)}" height="{r(y1-y0)}" fill="none" stroke="{BLUE}" stroke-width="2"></rect>')
        if handles:
            for hx, hy in [(x0, y0), (x1, y0), (x0, y1), (x1, y1), ((x0+x1)/2, y0), ((x0+x1)/2, y1), (x0, (y0+y1)/2), (x1, (y0+y1)/2)]:
                o.append(f'<rect x="{r(hx-4)}" y="{r(hy-4)}" width="8" height="8" fill="#FFFFFF" stroke="{BLUE}" stroke-width="1.6"></rect>')
    if snap:
        o.append(f'<line x1="{r(X(11))}" y1="{r(Y(17))}" x2="{r(X(11))}" y2="{r(Y(-0.6))}" stroke="{BLUE}" stroke-width="1" stroke-dasharray="4 3"></line>')
        o.append(f'<circle cx="{r(X(11))}" cy="{r(Y(5))}" r="4.5" fill="{BLUE}"></circle>')
        o.append(f'<rect x="{r(X(11)+6)}" y="{r(Y(-0.6)-2)}" width="88" height="18" rx="4" fill="{BLUE}"></rect>')
        o.append(f'<text x="{r(X(11)+50)}" y="{r(Y(-0.6)+10.5)}" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF">Snap: wall end</text>')
    # labels
    if labels:
        fs = max(9.0, min(13.0, s * 0.78)) * label_scale
        fd = max(8.0, min(11.5, s * 0.66)) * label_scale
        for rm in rooms + ([LAWN] if lawn else []):
            cx, cy = X(rm["x"] + rm["w"] / 2), Y(rm["y"] + rm["d"] / 2)
            if rm["id"] == "stairs":
                cy = Y(rm["y"] + rm["d"] / 2)
            dimtxt = f'{ftin(rm["w"])} × {ftin(rm["d"])}'
            if rm["id"] == "bed1" and bed_depth:
                dimtxt = f'{ftin(rm["w"])} × {ftin(bed_depth)}'
            halo = 'paint-order="stroke" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"'
            col = BLUE if selected == rm["id"] else NAVY
            o.append(f'<text x="{r(cx)}" y="{r(cy - 2)}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="{r(fs)}" fill="{col}" {halo}>{rm["name"]}</text>')
            if rm["id"] not in ("stairs",):
                o.append(f'<text x="{r(cx)}" y="{r(cy + fd + 1)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="{r(fd)}" fill="{MUTED}" {halo}>{dimtxt}</text>')
    if dims:
        o.append(dimlines(X, Y, s))
    o.append(extra)
    o.append("</svg>")
    return "".join(o)


def dimlines(X, Y, s):
    o = []
    col = MUTED
    fs = 10.5
    # top overall
    y = Y(0) - 22
    o.append(f'<line x1="{r(X(0))}" y1="{r(y)}" x2="{r(X(W))}" y2="{r(y)}" stroke="{col}" stroke-width="0.8"></line>')
    for xv in (0, W):
        o.append(f'<line x1="{r(X(xv)-4)}" y1="{r(y+4)}" x2="{r(X(xv)+4)}" y2="{r(y-4)}" stroke="{col}" stroke-width="1.2"></line>')
        o.append(f'<line x1="{r(X(xv))}" y1="{r(y-6)}" x2="{r(X(xv))}" y2="{r(Y(0)-3)}" stroke="{col}" stroke-width="0.6"></line>')
    o.append(f'<text x="{r((X(0)+X(W))/2)}" y="{r(y-5)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="{fs}" fill="{NAVY}">{ftin(W)}</text>')
    # left chained
    x = X(0) - 24
    marks = [0, 5, 17, 30, 45]
    o.append(f'<line x1="{r(x)}" y1="{r(Y(0))}" x2="{r(x)}" y2="{r(Y(D))}" stroke="{col}" stroke-width="0.8"></line>')
    for yv in marks:
        o.append(f'<line x1="{r(x-4)}" y1="{r(Y(yv)+4)}" x2="{r(x+4)}" y2="{r(Y(yv)-4)}" stroke="{col}" stroke-width="1.2"></line>')
        o.append(f'<line x1="{r(x-6)}" y1="{r(Y(yv))}" x2="{r(X(0)-3)}" y2="{r(Y(yv))}" stroke="{col}" stroke-width="0.6"></line>')
    for a, b in zip(marks, marks[1:]):
        cy = (Y(a) + Y(b)) / 2
        o.append(f'<text x="{r(x-5)}" y="{r(cy)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="{fs}" fill="{NAVY}" transform="rotate(-90 {r(x-5)} {r(cy)})">{ftin(b-a)}</text>')
    return "".join(o)


def furniture2d(X, Y, s):
    st = 'stroke="#8A96A3" stroke-width="0.9"'
    o = []
    for kind, x0, y0, x1, y1 in FURN:
        px, py, pw, ph = X(x0), Y(y0), (x1 - x0) * s, (y1 - y0) * s
        if kind == "bed":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="2" fill="#FFFFFF" {st}></rect>')
            pwid = (pw - 3 * 0.25 * s) / 2
            for i in range(2):
                o.append(f'<rect x="{r(px + 0.25*s + i*(pwid + 0.25*s))}" y="{r(py + 0.3*s)}" width="{r(pwid)}" height="{r(1.1*s)}" rx="2" fill="#FFFFFF" {st}></rect>')
            o.append(f'<path d="M{r(px)} {r(py + 2.2*s)} H{r(px+pw)}" {st}></path>')
            o.append(f'<path d="M{r(px)} {r(py + 2.6*s)} H{r(px+pw)}" {st}></path>')
        elif kind in ("nightstand", "table", "ctable"):
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="1.5" fill="#FFFFFF" {st}></rect>')
            if kind == "table":
                for cx, cy in [(px + pw*0.3, py - 0.5*s), (px + pw*0.7, py - 0.5*s), (px + pw*0.3, py + ph + 0.5*s), (px + pw*0.7, py + ph + 0.5*s)]:
                    o.append(f'<rect x="{r(cx - 0.6*s)}" y="{r(cy - 0.4*s)}" width="{r(1.2*s)}" height="{r(0.8*s)}" rx="1.5" fill="#FFFFFF" {st}></rect>')
        elif kind == "wardrobe":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" fill="#FFFFFF" {st}></rect>')
            o.append(f'<path d="M{r(px)} {r(py)} L{r(px+pw)} {r(py+ph)}" {st}></path>')
        elif kind == "counter":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" fill="#EEECE7" {st}></rect>')
        elif kind == "stove":
            for i in range(2):
                o.append(f'<circle cx="{r(px + pw*(0.28 + 0.44*i))}" cy="{r(py + ph/2)}" r="{r(0.45*s)}" fill="none" {st}></circle>')
        elif kind == "sink":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="3" fill="#FFFFFF" {st}></rect>')
            o.append(f'<circle cx="{r(px+pw/2)}" cy="{r(py+ph/2)}" r="1.5" fill="#8A96A3"></circle>')
        elif kind == "sofa_v":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="3" fill="#FFFFFF" {st}></rect>')
            back = 0.8 * s
            if x0 > 20:
                o.append(f'<path d="M{r(px+pw-back)} {r(py+0.7*s)} V{r(py+ph-0.7*s)}" {st}></path>')
            else:
                o.append(f'<path d="M{r(px+back)} {r(py+0.7*s)} V{r(py+ph-0.7*s)}" {st}></path>')
            o.append(f'<path d="M{r(px)} {r(py+0.7*s)} H{r(px+pw)} M{r(px)} {r(py+ph-0.7*s)} H{r(px+pw)}" {st}></path>')
        elif kind == "armchair":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="3" fill="#FFFFFF" {st}></rect>')
            o.append(f'<rect x="{r(px+0.5*s)}" y="{r(py+0.5*s)}" width="{r(pw-1.0*s)}" height="{r(ph-0.9*s)}" rx="2" fill="none" {st}></rect>')
        elif kind == "basin":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="2" fill="#FFFFFF" {st}></rect>')
            o.append(f'<ellipse cx="{r(px+pw/2)}" cy="{r(py+ph/2+1)}" rx="{r(pw*0.32)}" ry="{r(ph*0.28)}" fill="none" {st}></ellipse>')
        elif kind == "wc":
            o.append(f'<rect x="{r(px+pw-0.6*s)}" y="{r(py)}" width="{r(0.6*s)}" height="{r(ph)}" rx="1.5" fill="#FFFFFF" {st}></rect>')
            o.append(f'<ellipse cx="{r(px+(pw-0.6*s)/2+1)}" cy="{r(py+ph/2)}" rx="{r((pw-0.6*s)/2)}" ry="{r(ph*0.36)}" fill="#FFFFFF" {st}></ellipse>')
        elif kind == "shower":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" fill="#FFFFFF" {st}></rect>')
            o.append(f'<path d="M{r(px)} {r(py)} L{r(px+pw)} {r(py+ph)} M{r(px+pw)} {r(py)} L{r(px)} {r(py+ph)}" {st}></path>')
        elif kind == "stairs":
            mid = py + ph / 2
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" fill="#FFFFFF" {st}></rect>')
            o.append(f'<path d="M{r(px)} {r(mid)} H{r(X(22.4))}" {st}></path>')
            n = 7
            for i in range(1, n + 1):
                xv = px + i * (X(22.4) - px) / (n + 1)
                o.append(f'<path d="M{r(xv)} {r(py)} V{r(py+ph)}" {st}></path>')
            o.append(f'<path d="M{r(X(22.4))} {r(py)} V{r(py+ph)}" {st}></path>')
            ay = py + ph * 0.75
            o.append(f'<path d="M{r(px+0.4*s)} {r(ay)} H{r(X(22.0))} M{r(X(22.0)-4)} {r(ay-3)} L{r(X(22.0))} {r(ay)} L{r(X(22.0)-4)} {r(ay+3)}" fill="none" stroke="{NAVY}" stroke-width="1"></path>')
        elif kind == "car":
            o.append(f'<rect x="{r(px)}" y="{r(py)}" width="{r(pw)}" height="{r(ph)}" rx="{r(1.2*s)}" fill="#FFFFFF" {st}></rect>')
            o.append(f'<rect x="{r(px+0.6*s)}" y="{r(py+3.4*s)}" width="{r(pw-1.2*s)}" height="{r(6.6*s)}" rx="{r(0.8*s)}" fill="#F2F4F5" {st}></rect>')
            o.append(f'<path d="M{r(px+0.6*s)} {r(py+4.6*s)} H{r(px+pw-0.6*s)} M{r(px+0.6*s)} {r(py+8.8*s)} H{r(px+pw-0.6*s)}" {st}></path>')
    return "".join(o)


# ---------------------------------------------------------------- isometric 3D
C30 = 0.8660254


def iso3d(s, *, selected=None, wall_h=3.6, chunk=1.5, ai_ghost=None, max_w=None):
    pts_cache = []

    def P(x, y, z):
        return ((x - y) * C30 * s, (x + y) * 0.5 * s - z * s)

    polys = []  # (key, svg)

    def poly(pts, fill, stroke=None, extra=""):
        pp = [P(*p) for p in pts]
        pts_cache.extend(pp)
        d = " ".join(f"{r(a)},{r(b)}" for a, b in pp)
        sc = stroke or fill
        return f'<polygon points="{d}" fill="{fill}" stroke="{sc}" stroke-width="0.6" stroke-linejoin="round"{extra}></polygon>'

    floors = []
    floor_col = {"room": "#EFE6D8", "tile": "#E7EAEC", "paved": "#DADDE0", "lawn": "#DCE7D6"}
    for rm in [LAWN] + ROOMS:
        col = floor_col[rm["floor"]]
        if selected == rm["id"]:
            col = "#CFE0F5"
        x0, y0, x1, y1 = rm["x"], rm["y"], rm["x"] + rm["w"], rm["y"] + rm["d"]
        floors.append(poly([(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0)], col))
    if selected:
        rm = next(x for x in ROOMS if x["id"] == selected)
        x0, y0, x1, y1 = rm["x"], rm["y"], rm["x"] + rm["w"], rm["y"] + rm["d"]
        pp = [P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)]
        d = " ".join(f"{r(a)},{r(b)}" for a, b in pp)
        floors.append(f'<polygon points="{d}" fill="none" stroke="{BLUE}" stroke-width="2"></polygon>')

    def box(x0, y0, x1, y1, h, top, side_y, side_x, z0=0.0):
        # split into chunks for painter's ordering
        nx = max(1, int((x1 - x0) / chunk + 0.999))
        ny = max(1, int((y1 - y0) / chunk + 0.999))
        for i in range(nx):
            for j in range(ny):
                a0 = x0 + (x1 - x0) * i / nx
                a1 = x0 + (x1 - x0) * (i + 1) / nx
                b0 = y0 + (y1 - y0) * j / ny
                b1 = y0 + (y1 - y0) * (j + 1) / ny
                key = (a0 + a1) / 2 + (b0 + b1) / 2 + z0 * 0.01
                svg = ""
                if i == nx - 1:
                    svg += poly([(a1, b0, z0), (a1, b1, z0), (a1, b1, z0 + h), (a1, b0, z0 + h)], side_x)
                if j == ny - 1:
                    svg += poly([(a0, b1, z0), (a1, b1, z0), (a1, b1, z0 + h), (a0, b1, z0 + h)], side_y)
                svg += poly([(a0, b0, z0 + h), (a1, b0, z0 + h), (a1, b1, z0 + h), (a0, b1, z0 + h)], top)
                polys.append((key, svg))

    # walls minus door gaps
    for ax, c, a, b, t, kind in WALLS:
        h = wall_h if kind != "boundary" else 1.6
        gaps = sorted([(d[2], d[3]) for d in DOORS if d[0] == ax and d[1] == c and d[2] >= a - 0.01 and d[3] <= b + 0.01])
        segs, cur = [], a - t / 2
        for g0, g1 in gaps:
            segs.append((cur, g0))
            cur = g1
        segs.append((cur, b + t / 2))
        for s0, s1 in segs:
            if s1 - s0 < 0.05:
                continue
            if ax == "h":
                box(s0, c - t / 2, s1, c + t / 2, h, "#2A3946", "#E9E6E0", "#D8D4CC")
            else:
                box(c - t / 2, s0, c + t / 2, s1, h, "#2A3946", "#E9E6E0", "#D8D4CC")
    fcol = {
        "bed": (2.0, "#FFFFFF", "#E3E6EA", "#D3D8DE"),
        "nightstand": (1.8, "#D9CBB5", "#C9B99F", "#B9A88C"),
        "wardrobe": (6.5, "#D9CBB5", "#C9B99F", "#B9A88C"),
        "counter": (3.0, "#D6D2CA", "#C7C2B8", "#B8B2A7"),
        "table": (2.5, "#C9B99F", "#B9A88C", "#A8977A"),
        "sofa_v": (2.6, "#9FB0C2", "#8B9DB0", "#7A8C9F"),
        "armchair": (2.4, "#9FB0C2", "#8B9DB0", "#7A8C9F"),
        "ctable": (1.4, "#C9B99F", "#B9A88C", "#A8977A"),
        "basin": (2.8, "#FFFFFF", "#E3E6EA", "#D3D8DE"),
        "wc": (1.4, "#FFFFFF", "#E3E6EA", "#D3D8DE"),
        "car": (4.0, "#8C99A6", "#7A8794", "#697581"),
    }
    for kind, x0, y0, x1, y1 in FURN:
        if kind == "stairs":
            n = 8
            for i in range(n):
                a0 = x0 + i * (22.4 - x0) / n
                a1 = 22.4
                box(a0, y0, a0 + (22.4 - x0) / n + 0.01, y1, (i + 1) * (wall_h / n), "#F4F4F2", "#DDDBD6", "#CFCCC6")
            box(22.4, y0, x1, y1, wall_h, "#F4F4F2", "#DDDBD6", "#CFCCC6")
            continue
        if kind in fcol:
            h, t, sy, sx = fcol[kind]
            box(x0, y0, x1, y1, h, t, sy, sx)
            if kind == "bed":
                box(x0 + 0.2, y0 + 0.2, x1 - 0.2, y0 + 1.4, 0.5, "#F6B48A", "#E89E70", "#D88A5C", z0=2.0)
    if ai_ghost:
        gx, gy, gw, gd = ai_ghost
        pp = [P(gx, gy, 0), P(gx + gw, gy, 0), P(gx + gw, gy + gd, 0), P(gx, gy + gd, 0)]
        d = " ".join(f"{r(a)},{r(b)}" for a, b in pp)
        floors.append(f'<polygon points="{d}" fill="#EFEAFD" stroke="{VIOLET}" stroke-width="1.5" stroke-dasharray="5 3"></polygon>')
    polys.sort(key=lambda kv: kv[0])
    xs = [p[0] for p in pts_cache]
    ys = [p[1] for p in pts_cache]
    minx, maxx, miny, maxy = min(xs) - 6, max(xs) + 6, min(ys) - 6, max(ys) + 6
    vw, vh = maxx - minx, maxy - miny
    out_w = max_w or vw
    out_h = vh * out_w / vw
    return (f'<svg width="{r(out_w)}" height="{r(out_h)}" viewBox="{r(minx)} {r(miny)} {r(vw)} {r(vh)}" role="img" '
            f'aria-label="3D view of the same 5 Marla ground floor" style="display: block">'
            + "".join(floors) + "".join(p for _, p in polys) + "</svg>")


# ---------------------------------------------------------------- thumbnails
def thumb(rooms, w, d, px_w, *, hl=None, hl_col=BLUE, lawn_d=0, max_h=None):
    s = px_w / w
    if max_h and d * s > max_h:
        s = max_h / d
    o = [f'<svg width="{r(w*s+4)}" height="{r(d*s+4)}" viewBox="-2 -2 {r(w*s+4)} {r(d*s+4)}" aria-hidden="true" style="display: block">']
    if lawn_d:
        o.append(f'<rect x="0" y="0" width="{r(w*s)}" height="{r(lawn_d*s)}" fill="#EEF3EC"></rect>')
    for rm in rooms:
        fill = "#FAF9F7"
        stroke = NAVY
        if hl and rm.get("id") in hl:
            fill = "#EFEAFD" if hl_col == VIOLET else "#E6EEF8"
        o.append(f'<rect x="{r(rm["x"]*s)}" y="{r(rm["y"]*s)}" width="{r(rm["w"]*s)}" height="{r(rm["d"]*s)}" fill="{fill}" stroke="{stroke}" stroke-width="1"></rect>')
    o.append(f'<rect x="0" y="0" width="{r(w*s)}" height="{r(d*s)}" fill="none" stroke="{NAVY}" stroke-width="2.2"></rect>')
    o.append("</svg>")
    return "".join(o)


def grid_layout(w, d, rows, lawn=0):
    """rows: list of (depth, [widths]) from back to front."""
    rooms, y = [], lawn
    k = 0
    for depth, widths in rows:
        x = 0
        for wd in widths:
            rooms.append(dict(id=f"r{k}", x=x, y=y, w=wd, d=depth))
            x += wd
            k += 1
        y += depth
    return rooms


LAYOUT_B = [dict(rm, x=W - rm["x"] - rm["w"]) for rm in ROOMS]
LAYOUT_C = [
    dict(id="lounge", x=0, y=5, w=14, d=12), dict(id="kitchen", x=14, y=5, w=11, d=12),
    dict(id="bed1", x=0, y=17, w=12, d=13), dict(id="bath", x=12, y=17, w=6, d=6),
    dict(id="store", x=12, y=23, w=6, d=7), dict(id="stairs", x=18, y=17, w=7, d=13),
    dict(id="drawing", x=0, y=30, w=13, d=10), dict(id="entry", x=0, y=40, w=13, d=5),
    dict(id="porch", x=13, y=30, w=12, d=15),
]
LAYOUT_A_AI = [dict(rm) for rm in ROOMS]
for rm in LAYOUT_A_AI:
    if rm["id"] == "bed1":
        rm["y"], rm["d"] = 1.83, 15.17
