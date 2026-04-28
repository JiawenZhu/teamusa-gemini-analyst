import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

replacements = {
    '"#050D1F"': '"var(--bg-main)"',
    '"#0A1628"': '"var(--bg-card)"',
    '"#1E293B"': '"var(--border-color)"',
    '"#fff"': '"var(--text-main)"',
    '"#FFFFFF"': '"var(--text-main)"',
    '"#94A3B8"': '"var(--text-muted)"',
    '"#64748B"': '"var(--text-sub)"',
    '"#CBD5E1"': '"var(--text-muted)"',
    '"#475569"': '"var(--text-sub)"',
    '"#334155"': '"var(--text-sub)"',
    '"#000"': '"var(--bg-main)"',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('app/page.tsx', 'w') as f:
    f.write(content)
