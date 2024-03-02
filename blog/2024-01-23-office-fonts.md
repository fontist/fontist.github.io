# Installing Microsoft Office fonts

<sup>By **Ronald Tse** and **Alexey Morozov** on 23 Jan 2024</sup>

Fontist now supports installing fonts from Microsoft Office packages.

## Introduction

Microsoft Office is still the premier office suite today, like it or not. One
reason is that it comes with a set of widely-used, well curated and high quality
fonts, including:

* for Latin, the Word default fonts like
[Cambria](https://en.wikipedia.org/wiki/Cambria_(typeface)) and
[Calibri](https://en.wikipedia.org/wiki/Calibri);

* for CJK, full glyph fonts like
[MS Mincho](https://learn.microsoft.com/en-us/typography/font-list/ms-mincho),
[MS PGothic](https://learn.microsoft.com/en-us/typography/font-list/ms-pgothic),
[MingLiU](https://learn.microsoft.com/en-us/typography/font-list/mingliu),
[SimHei](https://learn.microsoft.com/en-us/typography/font-list/simhei),
[SimSun](https://learn.microsoft.com/en-us/typography/font-list/simsun).

Fontist users have long requested fonts that are only available from Microsoft
Office, such as "MS PGothic"
([issue #70](https://github.com/fontist/formulas/issues/70#issuecomment-752422687) from 2020!).
"MS PGothic" is a font for the Japanese language that is commonly used,
including for documents issued by the Japanese government.

Wait... aren't there already freely-licensed, compatible fonts with
"MS PGothic"?

"HGPGothicM" is one of such, that is not only freely available, but it was also
produced by Ricoh, the same company that produced "MS PGothic".

While "HGPGothicM" is nearly identical, it is not:

* metric-compatible, which would cause layout flow issues;
* registered under the "MS PGothic" name, which would cause problems to software
  that open files using the font, such as LibreOffice and WPS Office.

NOTE: Differences between "MS PGothic" and "HGPGothicM" is found on
[Ricoh's page](https://industry.ricoh.com/en/font/true_type_font/).


## Available Office fonts

"Preview" versions of Microsoft Office software can be installed on Windows and
macOS machines for demonstrational purposes, and when installed, its fonts
become available on the computer.

Fontist has now implemented support for XAR decompression which allows usage of
fonts from within the "Office Preview" packages.

The ["Office Preview"](https://github.com/fontist/formulas/blob/v3/Formulas/office_preview.yml)
formula includes 91 new fonts, including "MS PGothic" and many others with
updated versions, totalling 149 fonts.

Here is the full list of fonts from the Office package.

<details>
<summary>Click to expand list</summary>

### Font listing of the Office preview package

* Abadi MT Condensed Extra Bold
* Abadi MT Condensed Light
* Arial
* Arial Black
* Arial Narrow
* Arial Rounded MT Bold
* Baskerville Old Face
* Batang
* BatangChe
* Bauhaus 93
* Bell MT
* Bernard MT Condensed
* Book Antiqua
* Bookman Old Style
* Bookshelf Symbol 7
* Braggadocio
* Britannic Bold
* Calibri
* Calibri Light
* Calisto MT
* Cambria
* Cambria Math
* Candara
* Century
* Century Gothic
* Century Schoolbook
* Colonna MT
* Comic Sans MS
* Consolas
* Constantia
* Copperplate Gothic Bold
* Corbel
* Curlz MT
* DengXian
* DengXian Light
* Desdemona
* Dotum
* DotumChe
* Edwardian Script ITC
* Engravers MT
* Eurostile
* FangSong
* Footlight MT Light
* Franklin Gothic Book
* Franklin Gothic Demi
* Franklin Gothic Demi Cond
* Franklin Gothic Heavy
* Franklin Gothic Medium
* Franklin Gothic Medium Cond
* Gabriola
* Garamond
* Gill Sans MT
* Gill Sans MT Condensed
* Gill Sans MT Ext Condensed Bold
* Gill Sans Ultra Bold
* Gloucester MT Extra Condensed
* Goudy Old Style
* Gulim
* GulimChe
* Gungsuh
* GungsuhChe
* HGGothicE
* HGMaruGothicMPRO
* HGMinchoE
* HGPGothicE
* HGPMinchoE
* HGPSoeiKakugothicUB
* HGSGothicE
* HGSMinchoE
* HGSSoeiKakugothicUB
* HGSoeiKakugothicUB
* Haettenschweiler
* Harrington
* Imprint MT Shadow
* KaiTi
* Kino MT
* Lucida Blackletter
* Lucida Bright
* Lucida Calligraphy
* Lucida Console
* Lucida Fax
* Lucida Handwriting
* Lucida Sans
* Lucida Sans Typewriter
* Lucida Sans Unicode
* MS Gothic
* MS Mincho
* MS PGothic
* MS PMincho
* MS Reference Sans Serif
* MS Reference Specialty
* MS UI Gothic
* MT Extra
* Malgun Gothic
* Malgun Gothic Semilight
* Marlett
* Matura MT Script Capitals
* Meiryo
* Microsoft Himalaya
* Microsoft JhengHei
* Microsoft New Tai Lue
* Microsoft Tai Le
* Microsoft YaHei
* Microsoft Yi Baiti
* MingLiU
* MingLiU-ExtB
* MingLiU_HKSCS
* MingLiU_HKSCS-ExtB
* Mistral
* Modern No. 20
* Mongolian Baiti
* Monotype Corsiva
* Monotype Sorts
* News Gothic MT
* Onyx
* PMingLiU
* PMingLiU-ExtB
* Palatino Linotype
* Perpetua
* Perpetua Titling MT
* Rockwell
* Rockwell Condensed
* Rockwell Extra Bold
* STHupo
* STLiti
* STXingkai
* STXinwei
* STZhongsong
* Segoe Print
* Segoe Script
* SimHei
* SimSun
* SimSun-ExtB
* Stencil
* Tahoma
* Trebuchet MS
* Tw Cen MT
* Tw Cen MT Condensed
* Tw Cen MT Condensed Extra Bold
* Verdana
* Webdings
* Wide Latin
* Wingdings
* Wingdings 2
* Wingdings 3
* Yu Gothic
* Yu Gothic Light
* Yu Gothic Medium
* Yu Mincho
</details>



## Installing Office fonts

Here's how to install "MS PGothic", "MS PMincho" and other Office fonts
through Fontist.

First update the collection of Fontist font formulas using the
`fontist update` command:

```sh
$ fontist update
Formulas have been successfully updated.
```

Now individual fonts can be installed by referring to their font names:

```sh
$ fontist install "MS PGothic"
Fonts installed at:
- /Users/john/.fontist/fonts/msgothic.ttc
```

Alternatively, all fonts from the same formula can be installed using the
formula name:

```sh
$ fontist install --formula office_preview
Fonts installed at:
- /Users/john/.fontist/fonts/Rockwell Extra Bold.ttf
- /Users/john/.fontist/fonts/webdings.ttf
- /Users/john/.fontist/fonts/Dengb.ttf
- /Users/john/.fontist/fonts/Candarai.ttf
- /Users/john/.fontist/fonts/Cambria.ttc
- /Users/john/.fontist/fonts/Verdana Bold.ttf
- /Users/john/.fontist/fonts/GillSansUltraBold.ttf
...
```

## Using Office fonts in continuous integration

`fontist` supports flags that can be utilized in continuous integration (CI)
systems.

For instance:

* The `--accept-all-licenses` flag allows the `install` command to install a
font, while providing explicit acceptance through a command-line option.

The `--force` flag ensures that `fontist` installs the font even if it's already
present in the system, thereby guaranteeing its presence in the target path.

```sh
$ fontist install --accept-all-licenses --force "MS PGothic"
```


## Conclusion

Fontist now supports a growing number of fonts and serve as a convenient
method to install fonts programmatically, especially on continuous integration
systems.

Small announcement. A standalone package of `fontist` is currently in
development. Soon, there would be even no need to install Ruby separately to
use `fontist`.

