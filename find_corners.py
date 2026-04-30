import cv2
import numpy as np

bg_path = "/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/team_usa_realistic_thumbnail_1777445587741.png"
bg = cv2.imread(bg_path)
h, w = bg.shape[:2]

# Draw a 50x50 grid with coordinates to help me pick exact points
for i in range(0, w, 50):
    cv2.line(bg, (i, 0), (i, h), (255, 0, 0), 1)
    if i % 100 == 0:
        cv2.putText(bg, str(i), (i, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
for i in range(0, h, 50):
    cv2.line(bg, (0, i), (w, i), (255, 0, 0), 1)
    if i % 100 == 0:
        cv2.putText(bg, str(i), (20, i), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

cv2.imwrite("/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/grid.png", bg)
