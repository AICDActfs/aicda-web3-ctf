import os, glob
from PIL import Image, ImageFilter

# Filter only for actual image files, ignoring directories
candidates = [
    p for p in glob.glob(os.path.expanduser('~/Downloads/*'))
    if os.path.isfile(p) and p.lower().endswith(('.jpg', '.jpeg', '.png'))
    and ('mask' in p.lower() or 'anonymous' in p.lower() or '4b' in p.lower())
]
candidates.append('frontend/public/mask.jpg')

src_path = 'frontend/public/mask.jpg'
for p in candidates:
    if os.path.isfile(p):
        src_path = p
        break

print(f"Processing HD source: {src_path}")
img = Image.open(src_path).convert('L')
thresh = img.point(lambda p: 255 if p > 20 else 0)
bbox = thresh.getbbox()
cropped = img.crop(bbox) if bbox else img

# 800px Ultra-HD height
target_h = 800
target_w = int(cropped.size[0] * (target_h / cropped.size[1]))
cropped = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
cropped = cropped.filter(ImageFilter.UnsharpMask(radius=1.2, percent=140))
c_pix = cropped.load()

mask_png = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
m_pix = mask_png.load()

for y in range(target_h):
    for x in range(target_w):
        val = c_pix[x, y]
        if val > 15:
            factor = val / 255.0
            a = int(val * 0.98)
            r = int(factor * 60)
            g = int(min(255, 140 + factor * 115))
            b = int(factor * 70)
            m_pix[x, y] = (r, g, b, a)

pub = 'frontend/public'
mask_png.save(f'{pub}/mask-matrix.png', 'PNG')
mask_png.save(f'{pub}/matrix-logo.png', 'PNG')
print(f"Generated Ultra HD mask: {target_w}x{target_h}")
