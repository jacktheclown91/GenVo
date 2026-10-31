# GenVo itch.io cover (October 30) from genuine game renders of release bc3017bf.
# Inputs: a UI-free frame of the shipped Day-100 valley read from the game canvas
# (cover-plates.mjs) and a real valley organism drawn by the game's portrait
# renderer (cover-organisms.mjs). Pixels are scaled only by whole-number
# nearest-neighbour factors. The title follows the main menu's two-tone "GenVo"
# in its Georgia face, drawn small and scaled on the same pixel grid; the line
# under it is the menu's own tagline.
# Usage: python compose.py PLATE ORGANISM OUT.png [crop_x crop_y] [hero_cx hero_cy]
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
plate, organism, out = sys.argv[1:4]
cx, cy = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0, 150)
hx, hy = (int(sys.argv[6]), int(sys.argv[7])) if len(sys.argv) > 7 else (840, 610)
W, H = 1260, 1000
CREAM = (233, 224, 196); LEAF = (146, 178, 120); INK = (10, 18, 14); DEEP = (14, 28, 22)

def background():
    bg = Image.open(plate).convert('RGB').crop((cx, cy, cx + 630, cy + 500)).resize((W, H), Image.NEAREST)
    bg = ImageEnhance.Brightness(bg).enhance(.78)
    # Darken toward the top for the title and toward the bottom for the tagline.
    shade = Image.new('L', (W, H), 0); d = ImageDraw.Draw(shade)
    for y in range(H):
        a = int(225 * max(0, 1 - y / 300) ** 1.6) + int(200 * max(0, (y - H * .82) / (H * .18)) ** 1.5)
        d.line((0, y, W, y), fill=min(255, a))
    return Image.composite(Image.new('RGB', (W, H), DEEP), bg, shade).convert('RGBA')

def hero(factor):
    im = Image.open(organism).convert('RGBA')
    # The portrait's ground marks and drop shadow are translucent; keep the opaque sprite.
    a = im.split()[3].point(lambda v: 255 if v > 200 else 0); im.putalpha(a)
    im = im.crop(im.getbbox())
    return im.resize((im.width * factor, im.height * factor), Image.NEAREST)

def place(canvas, im, x0, y0):
    x, y = int(x0 - im.width / 2), int(y0 - im.height / 2)
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.split()[3].point(lambda v: 150 if v else 0))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)), (x + 16, y + 30))
    canvas.alpha_composite(im, (x, y))

def pixel_text(canvas, parts, size, scale, y, shadow=True):
    f = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', size)
    widths = [f.getbbox(t)[2] - f.getbbox(t)[0] for t, _ in parts]
    total = sum(widths) + 8; top = min(f.getbbox(t)[1] for t, _ in parts); bottom = max(f.getbbox(t)[3] for t, _ in parts)
    small = Image.new('RGBA', (total, bottom - top + 8), (0, 0, 0, 0)); d = ImageDraw.Draw(small); x = 4
    for (t, col), w in zip(parts, widths):
        l = f.getbbox(t)[0]
        if shadow:
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (1, 1), (2, 2)]:
                d.text((x - l + dx, 4 - top + dy), t, font=f, fill=INK + (255,))
        d.text((x - l, 4 - top), t, font=f, fill=col + (255,)); x += w
    small.putalpha(small.split()[3].point(lambda v: 255 if v > 110 else 0))
    big = small.resize((small.width * scale, small.height * scale), Image.NEAREST)
    canvas.alpha_composite(big, ((W - big.width) // 2, y))
    return y + big.height

canvas = background()
place(canvas, hero(int(sys.argv[8]) if len(sys.argv) > 8 else 2), hx, hy)
pixel_text(canvas, [('Gen', CREAM), ('Vo', LEAF)], 36, 6, 34)
pixel_text(canvas, [('Every life leaves a trace.', CREAM)], 15, 3, H - 96)
canvas.convert('RGB').save(out)
canvas.convert('RGB').resize((630, 500), Image.NEAREST).save(out.replace('.png', '-630x500.png'))
canvas.convert('RGB').resize((315, 250), Image.LANCZOS).save(out.replace('.png', '-thumb315.png'))
print(out)
