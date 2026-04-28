#!/bin/bash
head -n 208 frontend/app/page.tsx > temp.tsx
sed -n '319,486p' frontend/app/page.tsx >> temp.tsx
sed -n '209,318p' frontend/app/page.tsx >> temp.tsx
sed -n '487,$p' frontend/app/page.tsx >> temp.tsx
mv temp.tsx frontend/app/page.tsx
