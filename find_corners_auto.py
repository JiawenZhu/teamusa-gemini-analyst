import cv2
import numpy as np

bg_path = "/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/team_usa_realistic_thumbnail_1777445587741.png"
bg = cv2.imread(bg_path)

# Convert to grayscale and threshold for very dark colors (the black screen)
gray = cv2.cvtColor(bg, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY_INV)

# The screen is white in the original image! "Powerhouse"
# Let's threshold for white
_, thresh_white = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)

# Find contours of the white screen
contours, _ = cv2.findContours(thresh_white, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# Find the largest quadrilateral
max_area = 0
best_cnt = None
for cnt in contours:
    area = cv2.contourArea(cnt)
    if area > 10000:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.05 * peri, True)
        if len(approx) == 4 and area > max_area:
            max_area = area
            best_cnt = approx

if best_cnt is not None:
    pts = best_cnt.reshape(4, 2)
    # Sort points: top-left, top-right, bottom-right, bottom-left
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    print("Found coordinates:")
    print(rect)
else:
    print("Screen not found automatically.")
