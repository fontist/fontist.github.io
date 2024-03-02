# Creating custom Fontist font formulas

<sup>By **Ronald Tse** and **Alexey Morozov** on 2 March 2024</sup>

Easily create Fontist font formulas from font packages hosted online.

## Purpose

Consider this scenario: you require a specific font for either your Continuous
Integration system or your software.

If the font is already available as a
[Fontist font formula](https://www.fontist.org/formulas/),
you can directly install that font.

But what if *it's not there yet*?

You can easily create a Fontist font formula from a *package hosted online*,
even if it is complex and has an archive-in-archive structure.

## Creating a Fontist font formula from a package

First you need to create a formula providing a URL to an archive:

```sh
$ fontist create-formula http://example.com/archive.pkg
some_font.yml formula has been successfully created
```

Then this formula should be placed in a formula repository, then the Fontist
font formula index needs to be rebuilt:

```sh
$ cp some_font.yml ~/.fontist/versions/v3/formulas/Formulas/
$ fontist rebuild-index
```

That's it! Now the fonts from the package can be installed and used:

```sh
$ fontist install "Some Font"
Fonts installed at:
- /Users/john/.fontist/fonts/some_font.ttf
```

## Contributing a Fontist font formula

If the font formula you created is of a font that is openly licensed,
please feel free to contribute it to the official
[Fontist font formulas repository](https://github.com/fontist/formulas)
so others could also use it.

To do so, please create a Pull Request to the repository and add the formula
YAML file (`*.yaml`) to it. A member of the Fontist team will then attend to
the contribution as soon as we can.


## Private font formulas

If the font package in question is not to be shared online
(such as a purchased, commercially-licensed font), Fontist supports
[Custom Fontist repositories](https://github.com/fontist/fontist/#custom-fontist-repositories)
to manage your own fonts and your own formulas.



## Compression methods supported

Fontist implements support for many compression methods, some of those
not even readily available on popular OS platforms.

Currently, Fontist supports decompression of files of the following archival
methods commonly used for font packages:

* [Cabinet / CAB](https://en.wikipedia.org/wiki/Cabinet_(file_format))
  (extension: `*.cab`), the file format from Microsoft.
* [cpio](https://en.wikipedia.org/wiki/Cpio) (extension: `*.cpio`),
  the Unix "copy in and out" utility, defined in IEEE Std 1003.2 ("POSIX.2").
* [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)) (extension: `*.zip`)
  and ZIP-based [self-extracting archives](https://en.wikipedia.org/wiki/Self-extracting_archives)
  (extension: `*.exe`).
* [gzip](https://en.wikipedia.org/wiki/Gzip) (extension: `*.gzip`) commonly used on Unix systems.
* [OLE](https://en.wikipedia.org/wiki/Object_Linking_and_Embedding) from Microsoft
  used in the packaging of the
  [Windows Installer](https://en.wikipedia.org/wiki/Windows_Installer) archives
  (extension: `*.msi`, `*.msp`).
* [RPM](https://en.wikipedia.org/wiki/RPM_Package_Manager) (extension: `*.rpm`)
  installation packages used on Linux systems.
* [tar](https://en.wikipedia.org/wiki/Tar_(computing)) the Unix archival format.
* [XAR](https://en.wikipedia.org/wiki/Xar_(archiver)) (extensions: `*.xar`, `*.pkg`, `*.xip`) from Apple,
  [used in macOS installation packages and the App Store](https://forums.developer.apple.com/forums/thread/133985).

Fontist relies on the [`excavate`](https://github.com/fontist/excavate/)
Ruby library for decompression, with the latest list of supported compression
methods available
[here](https://github.com/fontist/excavate/blob/main/lib/excavate/archive.rb#L14).

Fontist now also supports decompression of files through the comprehensive
[`libarchive`](https://www.libarchive.org) library
(the [Fontist version of libarchive in Ruby](https://github.com/fontist/ffi-libarchive-binary[ffi-libarchive])).
This enhancement opens up the
possibility of supporting a wider range of compression methods.


# Conclusion

Fontist now supports a growing number of fonts and can serve as a convenient
method to install fonts programmatically, especially for continuous integration
systems.

<!-- Small announcement. A standalone package of `fontist` is currently in
development. Soon, there would be even no need to install Ruby separately to
use `fontist`.
 -->

Discover new fonts you can use with `fontist` and which packages you found
online could be converted into font formulas.
