## Introduction

Fontist now allows installing macOS-specific add-on fonts via the `fontist`
command-line interface.

This is to allow continuous integration (CI) jobs on macOS environments to use
these specially licensed fonts that are not available on other platforms.

For instance, the "Canela" font is a commercial font that comes free with
macOS.

The following demonstration shows how useful this is in a CI environment.

## Prerequisites

Install the Canela font on macOS using
[Fontist](https://github.com/fontist/fontist):

```sh
$ fontist install Canela
```

## Example

_The Blood Is At The Doorstep_ movie poster uses the Canela font. We can
potentially generate it using ImageMagick in a CI environment.

This is the original poster:

![Original poster](https://i.imgur.com/ZsNgRCZ.png)
_Source: mdfilmfest.com License: All Rights Reserved._
[Link to poster](https://fontsinuse.com/uses/18269/the-blood-is-at-the-doorstep-movie-poster)

As described at the [ImageMagic `convert` page](https://imagemagick.org/script/convert.php), we can
use the `magick convert` command to generate this exact same title.

The command to generate the title:

```sh
$ magick convert \
   -size 800x1066 canvas:black \
   -font Canela-Regular-Regular \
   -pointsize 180 \
   -fill white \
   -kerning 0  -interword-spacing 180 -annotate +25+170 'T H E' \
   -kerning 22 -annotate +35+340 'BLOOD' \
   -kerning 60 -interword-spacing 75  -annotate +60+510 'IS AT' \
   -kerning 0  -interword-spacing 180 -annotate +25+680 'T H E' \
   -kerning 60 -annotate +35+850 'DOOR' \
   -kerning 95 -annotate +35+1020 'STEP' \
   poster.png
```

The generated version is pretty much identical (except for the background).

![Generated poster](https://i.imgur.com/waGfDP8.png)

## Final thoughts

As always, if you need help with the new functionality, please post at
[Fontist Discussions](https://github.com/fontist/discussions/discussions)!

## References

- [fontist](https://github.com/fontist/fontist)
