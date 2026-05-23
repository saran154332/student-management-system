# Student Management System — Logo assets

Files included:
- `banner.svg` — 1200x400px navy banner (rounded corners)
- `banner_transparent.svg` — same layout with transparent background
- `icon_512.svg` — 512x512 square icon with navy background
- `favicon_64.svg` — 64x64 favicon SVG
- `navbar_400x120.svg` — 400x120 navbar-safe SVG

Notes and export instructions:

- The source files are vector SVGs and follow the requested layout:
  - Canvas: 1200x400, safe zone 80px, icon 200x200, icon-to-text gap 40px.
  - Colors: navy `#0f2744`, emerald `#10b981`, white `#ffffff`.
  - Fonts: uses `Inter, Arial, sans-serif` as fallback. For exact font rendering, install `Inter`.

- To export PNGs with ImageMagick:

```bash
# banner 1200x400
magick convert -background none frontend/public/logo/banner_transparent.svg -resize 1200x400 frontend/public/logo/banner.png

# icon 512x512
magick convert -background none frontend/public/logo/icon_512.svg -resize 512x512 frontend/public/logo/icon_512.png

# navbar 400x120
magick convert -background none frontend/public/logo/navbar_400x120.svg -resize 400x120 frontend/public/logo/navbar_400x120.png

# favicon 64x64
magick convert -background none frontend/public/logo/favicon_64.svg -resize 64x64 frontend/public/logo/favicon_64.png
```

- Or with Inkscape (more consistent text rendering):

```bash
inkscape frontend/public/logo/banner.svg --export-filename=frontend/public/logo/banner.png --export-width=1200 --export-height=400
inkscape frontend/public/logo/icon_512.svg --export-filename=frontend/public/logo/icon_512.png --export-width=512 --export-height=512
inkscape frontend/public/logo/navbar_400x120.svg --export-filename=frontend/public/logo/navbar_400x120.png --export-width=400 --export-height=120
inkscape frontend/public/logo/favicon_64.svg --export-filename=frontend/public/logo/favicon_64.png --export-width=64 --export-height=64
```

If you want, I can also generate PNG exports here and add them to the repo. Reply if you'd like me to rasterize and commit PNGs as well.
