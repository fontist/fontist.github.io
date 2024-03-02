# Installing macOS-specific add-on fonts

<sup>By **Ronald Tse** and **Alexey Morozov** on 11 Feb 2022</sup>
<sup>Last updated 02 Mar 2024</sup>

Fontist now allows installing macOS-specific add-on fonts via the `fontist`
command-line interface.

## Introduction

macOS comes with an amazingly beautiful set of fonts. These fonts typically
require commercial licenses to be used on other platforms, so macOS makes good
on the Apple reputation that design comes essential and affordable.

Designers using Apple products often rely on Apple supplied typefaces,
some of the commonly used fonts include:

* Avenir Next
* Canela
* Futura
* Georgia
* Palatino



## Available fonts on macOS systems

Since macOS 11 (Big Sur), the font list provided by macOS grew sufficiently
large that many fonts are now downloaded upon demand.
macOS fonts are now distributed in one of these two ways:

* supplied by the default installation
* downloadable on demand

In fact, macOS
[Font Book supports removal of the supplied fonts](https://support.apple.com/en-hk/guide/font-book/fntbk1000/mac)
to be installed on demand after a font is manually removed, so all fonts are
technically available to the system at any time.

The full list of available fonts on various macOS versions can be found on the
Apple Support site:

* [Fonts in macOS 14 Sonoma](https://support.apple.com/en-us/108939)
* [Fonts in macOS 13 Ventura](https://support.apple.com/en-us/HT213266)
* [Fonts in macOS 12 Monteray](https://support.apple.com/en-us/HT212587)
* [Fonts in macOS 11 Big Sur](https://support.apple.com/en-in/HT211240)


## Installing macOS fonts

Fontist makes it possible for the user to bypass the macOS Font Book UI and
installing these specially licensed fonts in a continuous integration (CI)
manner on macOS environments.

Here's how to install macOS fonts through Fontist.

First update the collection of Fontist font formulas using the
`fontist update` command:

```sh
$ fontist update
Formulas have been successfully updated.
```

Now individual fonts can be installed by referring to their font names:

```sh
$ fontist install "Canela"
...
Font "Canela" not found locally.
FONT LICENSE ACCEPTANCE REQUIRED FOR "Canela":

Fontist can install this font if you accept its licensing conditions.

FONT LICENSE BEGIN ("Canela")
-----------------------------------------------------------------------
For use on Apple-branded Systems
...
-----------------------------------------------------------------------
FONT LICENSE END ("Canela")

Do you accept all presented font licenses, and want Fontist to download these fonts for you?
=> TYPE 'Yes' or 'No': Yes
...
Installing font "macos/canela".
Fonts installed at:
- /Users/john/.fontist/fonts/Canela.ttc
```


## Using macOS fonts in continuous integration

In a continuous integration (CI) system it is important that the installs
do not require user interaction.

The Fontist CLI provides flags for the system to answer mandatory prompts
at time of execution:

* The `--accept-all-licenses` flag allows the `install` command to install a
font, while providing explicit acceptance through a command-line option.

The `--force` flag ensures that `fontist` installs the font even if it's already
present in the system, thereby guaranteeing its presence in the target path.

```sh
$ fontist install --accept-all-licenses --force "Canela"
```


## Example using a macOS font in a generated design

The following demonstration shows how useful this is in a CI environment.

The "Canela" font is a commonly-used commercial font that comes free with
macOS, and the "_The Blood Is At The Doorstep_" movie poster uses the Canela font.

This is the original poster:

![Original poster](https://i.imgur.com/ZsNgRCZ.png)
_Source: mdfilmfest.com License: All Rights Reserved._
[Link to poster](https://fontsinuse.com/uses/18269/the-blood-is-at-the-doorstep-movie-poster)

And we will generate the same using a CI.


### Prerequisites

Install the Canela font on macOS using
[Fontist](https://github.com/fontist/fontist):

```sh
$ fontist install Canela
```

### Generating an image

We can generate the title using ImageMagick in a CI environment.

As described on the
[ImageMagic `convert` page](https://imagemagick.org/script/convert.php), we can
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

The generated version is pretty much identical (except for the background)!

![Generated poster](https://i.imgur.com/waGfDP8.png)


## Conclusion

Fontist provides you with a convenient way to install fonts outside of
system limitations, allowing CI systems to utilize macOS licensed fonts
without user interaction.

As always, if you need help with the new functionality, please post at
the [Fontist Issues page](https://github.com/fontist/fontist/issues)!
