import base64
from io import BytesIO
import os
import random
from PIL import Image, ImageDraw, ImageFont

MASK_B64 = """
/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAA0JCgsKCA0LCwsPDg0QFCEVFBISFCgdHhghMCoy
MS8qLi00O0tANDhHOS0uQllCR05QVFVUMz9dY1xSYktTVFH/2wBDAQ4PDxQRFCcVFSdRNi42
UVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVH/
wAARCADwAHgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QA
tRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2Jy
ggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqD
hIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi
4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QA
tREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLR
ChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6
goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna
4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzClwaVRkZqeIAFUIwck59fagCAIxB
OOBTvJfK8Z3HAxVl1Acqy4VCd3NOCxnaEJUghu/AoAriBsA7c5zgVL9mZI97AHpjHPvVvykZ
yqM/qFz0JH/1qfbwbnUSO2x1ZolLcHA5yfzoArrYuQDgY5zkdPrQtvmME7AeuTxn2rQaAQM/
mvIsUkXUtxuJ6Aj6GhW8yzu/K2tEzrs3Z3fKM8Z9SAKAM/7GPm4DdcbRSG3UyYCM5IzsUc1v
TLPJMQCMozHBHBGzPr0JOKkW1C2qSKwVnQO/BbBUE4/UigDmhas7kCGRCF3EFeg7Uw2vJXgO
OCPQ10tx5a3ksZ3SsEH+rjJ2gBuuPx/KmtaJKY3ijl/ej5TEM7nIB/lzQBzH2dvQg478VE6M
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
AKKKKACiiigAooooA//Z
"""

# Safe whitespace-agnostic decoding
b64_clean = ''.join(MASK_B64.split())
pad = len(b64_clean) % 4
if pad:
    b64_clean += '=' * (4 - pad)
raw = base64.b64decode(b64_clean)

mask_src = Image.open(BytesIO(raw)).convert('L')
mw, mh = mask_src.size

mask_png = Image.new('RGBA', (mw, mh), (0, 0, 0, 0))
m_pix = mask_png.load()
s_pix = mask_src.load()

for y in range(mh):
    for x in range(mw):
        val = s_pix[x, y]
        if val > 18:
            factor = val / 255.0
            r = int(factor * 60)
            g = int(min(255, 140 + factor * 115))
            b = int(factor * 70)
            a = int(val * 0.95)
            m_pix[x, y] = (r, g, b, a)

pub = 'frontend/public'
app = 'frontend/app'
comp = 'frontend/components'
os.makedirs(pub, exist_ok=True)
os.makedirs(app, exist_ok=True)
os.makedirs(comp, exist_ok=True)

mask_png.save(f'{pub}/mask-matrix.png', 'PNG')
mask_png.save(f'{pub}/matrix-logo.png', 'PNG')
print("[+] Created transparent mask-matrix.png")

# Full 1200x630 Matrix banner
bw, bh = 1200, 630
banner = Image.new('RGB', (bw, bh), (4, 8, 6))
draw = ImageDraw.Draw(banner)
katakana = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒ0123456789ABCDEFΞ₿$'
font_size = 15

font = None
title_font = None
sub_font = None
badge_font = None
for f_path in [
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf'
]:
    if os.path.exists(f_path):
        try:
            font = ImageFont.truetype(f_path, font_size)
            title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
            sub_font = ImageFont.truetype(f_path, 14)
            badge_font = ImageFont.truetype(f_path, 12)
            break
        except:
            pass

if not font:
    font = ImageFont.load_default()
    title_font = font
    sub_font = font
    badge_font = font

# Fill 100% of canvas with falling Katakana rain columns
random.seed(42)
cols = bw // font_size
for c in range(cols):
    cx = c * font_size
    stream_len = random.randint(10, 36)
    start_y = random.randint(-40, bh - stream_len * font_size)
    for s in range(stream_len):
        cy = start_y + s * font_size
        if 0 <= cy <= bh - font_size:
            ch = random.choice(katakana)
            if s == stream_len - 1:
                color = (255, 255, 255)
            elif s > stream_len - 4:
                color = (57, 255, 20)
            else:
                fade = s / stream_len
                color = (int(5 * fade), int(220 * fade), int(50 * fade))
            draw.text((cx, cy), ch, fill=color, font=font)

overlay = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
ov_draw = ImageDraw.Draw(overlay)
ov_draw.rectangle([45, 35, bw - 45, bh - 35], fill=(3, 7, 5, 220), outline=(0, 255, 65, 230), width=2)

mask_h = 440
mask_w = int(mask_png.size[0] * (mask_h / mask_png.size[1]))
mask_resized = mask_png.resize((mask_w, mask_h), Image.Resampling.LANCZOS)
overlay.paste(mask_resized, (85, (bh - mask_h) // 2), mask_resized)

banner = Image.alpha_composite(banner.convert('RGBA'), overlay).convert('RGB')
b_draw = ImageDraw.Draw(banner)

tx = 85 + mask_w + 45
b_draw.text((tx, 120), "ANONYMOUS INDIA CYBER DEFENCE ACADEMY", fill=(0, 255, 170), font=badge_font)
b_draw.text((tx, 160), "CRYPTOCURRENCY", fill=(255, 255, 255), font=title_font)
b_draw.text((tx, 215), "PENETRATION TESTING LAB", fill=(57, 255, 20), font=title_font)
b_draw.text((tx, 280), "ADVANCED WEB3, SMART CONTRACT & DEFI CYBER RANGE", fill=(200, 255, 210), font=sub_font)
b_draw.text((tx, 335), "• Live Target Smart Contracts & Dynamic Nodes", fill=(140, 210, 160), font=sub_font)
b_draw.text((tx, 370), "• Automated Verification & Institutional Scoring", fill=(140, 210, 160), font=sub_font)
b_draw.text((tx, 405), "• Tactical Exploit Simulation & CTF Directives", fill=(140, 210, 160), font=sub_font)
b_draw.text((tx, 465), "[ ENTER CYBER RANGE • aicda-web3-ctf.vercel.app ]", fill=(0, 255, 65), font=badge_font)

banner.save(f'{app}/opengraph-image.png', 'PNG')
banner.save(f'{pub}/matrix-banner.jpg', quality=92)
banner.save(f'{pub}/og-image.jpg', quality=92)
banner.save(f'{pub}/aicda-preview.jpg', quality=92)
print("[+] Overwrote app/opengraph-image.png with full matrix banner!")

icon = Image.new('RGBA', (128, 128), (4, 8, 6, 255))
iw = int(mask_png.size[0] * (116 / mask_png.size[1]))
m_icon = mask_png.resize((iw, 116), Image.Resampling.LANCZOS)
icon.paste(m_icon, ((128 - iw) // 2, 6), m_icon)
icon.save(f'{pub}/icon.png')
icon.save(f'{app}/icon.png')
icon.resize((32, 32)).save(f'{pub}/favicon.png')
print("[+] Updated icon.png and favicon.png")
