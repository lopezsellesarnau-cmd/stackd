"""
Convierte una foto de referencia en una rejilla de densidad 0..1 (oscuro real
de la foto = denso en la ilustración), con normalización por percentiles
(propia de cada foto) y una zona muerta para que el fondo no ensucie —
mismo criterio que ya se usó para probar antes de fijarlo aquí.

Uso: python3 image_to_grid.py <imagen> <cols> <rows> > salida.json
"""
import sys, json
from PIL import Image

def histpercentiles(img, ps):
    hist = img.histogram()
    total = sum(hist)
    cum = 0
    out = {}
    remaining = sorted(ps)
    for i, c in enumerate(hist):
        cum += c
        while remaining and cum >= total * remaining[0]:
            out[remaining[0]] = i
            remaining.pop(0)
    for p in remaining:
        out[p] = 255
    return out

def grid(path, cols, rows, gamma=0.8, deadzone=0.10):
    img = Image.open(path).convert('L')
    pts = histpercentiles(img, [0.02, 0.98])
    black, white = pts[0.02], pts[0.98]
    small = img.resize((cols, rows), Image.LANCZOS)
    px = small.load()
    out = []
    for y in range(rows):
        row = []
        for x in range(cols):
            v = px[x, y]
            raw = (white - v) / max(1, (white - black))
            raw = max(0.0, min(1.0, raw))
            d = 0.0 if raw < deadzone else ((raw - deadzone) / (1 - deadzone)) ** gamma
            row.append(round(min(1.0, d), 2))
        out.append(row)
    return out

if __name__ == '__main__':
    path, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    print(json.dumps(grid(path, cols, rows)))
