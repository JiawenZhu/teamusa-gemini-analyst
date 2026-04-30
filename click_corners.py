import cv2
import numpy as np

def click_event(event, x, y, flags, params):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"[{x}, {y}],")
        cv2.circle(img, (x,y), 3, (0,0,255), -1)
        cv2.imshow('Click 4 corners (TL, TR, BR, BL) then press any key', img)

img = cv2.imread("/Users/jiawenzhu/.gemini/antigravity/brain/dd9b203b-3968-4ac2-831c-889f5a71a809/team_usa_realistic_thumbnail_1777445587741.png")
cv2.imshow('Click 4 corners (TL, TR, BR, BL) then press any key', img)
cv2.setMouseCallback('Click 4 corners (TL, TR, BR, BL) then press any key', click_event)
cv2.waitKey(0)
cv2.destroyAllWindows()
