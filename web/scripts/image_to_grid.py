"""
Convierte una foto de referencia en una rejilla de densidad 0..1, combinando
dos lecturas de la imagen:
  · tono   — solo lo genuinamente oscuro de verdad (sombras, huecos, suelo)
  · bordes — el contorno estructural (tejado, ventanas, patas de mesa),
    detectado aparte, para que se marque aunque el tono de fondo sea medio
La densidad final es el máximo de las dos. Sin bordes, un cielo de atardecer
con gris medio se leía tan denso como la fachada y todo se volvía ruido; solo
con tono, la silueta desaparecía en cuanto el fondo no era blanco puro.

Uso: python3 image_to_grid.py <imagen> <cols> <rows> [crop_top crop_bottom] > salida.json

`crop_top`/`crop_bottom` recortan filas verticales (en px, sobre la foto
original) antes de procesar — sin esto, una foto con mucho cielo/suelo vacío
diluye el sujeto entre demasiado espacio en blanco y dificulta que la
silueta se lea a resolución de trama.
"""
import sys, json
from PIL import Image, ImageFilter

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

def grid(path, cols, rows, crop=None, tone_gamma=1.6, tone_deadzone=0.42, edge_gain=2.4, edge_deadzone=0.10):
    img = Image.open(path).convert('L')
    if crop:
        w0, h0 = img.size
        img = img.crop((0, crop[0], w0, h0 - crop[1]))
    pts = histpercentiles(img, [0.015, 0.985])
    black, white = pts[0.015], pts[0.985]

    tone = img.resize((cols, rows), Image.LANCZOS)
    tpx = tone.load()

    # Recorte de 2px antes de detectar bordes: sin esto, el límite mismo de
    # la foto se lee como un borde falso y sale una línea de puntos alrededor.
    w0, h0 = img.size
    cropped = img.crop((2, 2, w0 - 2, h0 - 2))
    edge = cropped.filter(ImageFilter.FIND_EDGES).resize((cols, rows), Image.BILINEAR)
    epx = edge.load()

    out = []
    for y in range(rows):
        row = []
        for x in range(cols):
            raw = (white - tpx[x, y]) / max(1, (white - black))
            raw = max(0.0, min(1.0, raw))
            t = max(0.0, raw - tone_deadzone) / (1 - tone_deadzone)
            t = t ** tone_gamma

            e = max(0.0, min(1.0, (epx[x, y] / 255.0) * edge_gain))
            if e < edge_deadzone:
                e = 0.0

            d = max(t, e)
            # Borde de la rejilla a 0: el recorte de 2px no basta, el propio
            # filtro de bordes deja resto en el límite tras el resize.
            if x < 2 or y < 2 or x >= cols - 2 or y >= rows - 2:
                d = 0.0
            row.append(round(min(1.0, d), 2))
        out.append(row)
    return out

if __name__ == '__main__':
    path, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    crop = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else None
    print(json.dumps(grid(path, cols, rows, crop=crop)))
