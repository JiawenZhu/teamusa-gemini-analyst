import cv2
import numpy as np
import glob
from PIL import Image

bg_path = "/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/team_usa_realistic_thumbnail_1777445587741.png"
fg_paths = glob.glob("/Users/jiawenzhu/Desktop/Screenshot 2026-04-29 at 1.55.22*png")
if not fg_paths:
    print("Screenshot not found")
    exit(1)
fg_path = fg_paths[0]

out_path = "/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/perfect_thumbnail.png"

bg = cv2.imread(bg_path)
fg = cv2.imread(fg_path)

if bg is None or fg is None:
    print("Could not load images")
    exit(1)

pts_dst = np.array([
    [464, 434],  # TL
    [878, 458],  # TR
    [848, 762],  # BR
    [428, 715]   # BL
], dtype=float)

h, w = fg.shape[:2]
pts_src = np.array([
    [0, 0],
    [w, 0],
    [w, h],
    [0, h]
], dtype=float)

h_mat, status = cv2.findHomography(pts_src, pts_dst)
fg_warped = cv2.warpPerspective(fg, h_mat, (bg.shape[1], bg.shape[0]))

mask = np.zeros(bg.shape, dtype=np.uint8)
cv2.fillConvexPoly(mask, pts_dst.astype(int), (255, 255, 255))

mask_inv = cv2.bitwise_not(mask)
bg_masked = cv2.bitwise_and(bg, mask_inv)
fg_masked = cv2.bitwise_and(fg_warped, mask)
result = cv2.add(bg_masked, fg_masked)

cv2.imwrite(out_path, result)
print(f"Saved to {out_path}")
