# Extension Icons

Place your extension icons here with the following sizes:

-   icon-16.png (16x16)
-   icon-48.png (48x48)
-   icon-128.png (128x128)

You can use tools like [Icon Generator](https://www.iconfinder.com/) or create simple placeholders using online tools.

For quick placeholder icons, you can use these commands to create solid color PNG files or generate them from SVGs:

```bash
# Using ImageMagick to generate from SVGs
magick -background none icon-16-red.svg icon-16-red.png
magick -background none icon-48-red.svg icon-48-red.png
magick -background none icon-128-red.svg icon-128-red.png

# Create solid color PNG files (original blue)
magick -background none -size 16x16 xc:#4285f4 icon-16.png
magick -background none -size 48x48 xc:#4285f4 icon-48.png
magick -background none -size 128x128 xc:#4285f4 icon-128.png
```
