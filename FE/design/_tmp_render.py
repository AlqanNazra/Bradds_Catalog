import fitz, os
src = r"D:\opera\Shopping Website (Community)-3-11.pdf"
out = r"E:\Gabut\Go\Bradds_web\design\pdf-view"
os.makedirs(out, exist_ok=True)
doc = fitz.open(src)
for i in (6, 7, 8):
    page = doc[i]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.15, 1.15), alpha=False)
    p = os.path.join(out, f"page-{i+1:02d}.png")
    pix.save(p)
    print(p, pix.width, pix.height)
