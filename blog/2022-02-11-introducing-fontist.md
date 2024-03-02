# Introducing Fontist: the extensible font manager

<sup>By **Ronald Tse** and **Alexey Morozov** on 11 Feb 2022</sup>

## Purpose

Fontist is a simple, functional and extensible font installer.

Fontist:

* *works cross-platform*: supports Windows, Linux and macOS;
* *has extensive font support*: from first-party system-provided fonts to third-party fonts;
* *supports automation*: works with modern continuous integration (CI) and continuous delivery (CD) systems, as well as GitHub and GitLab;
* *facilitates font management*: supports font repositories and font manifests;
* is *easily extensible*: easily support font packages hosted online;
* *works natively with OS font management* software: from `font-config` to macOS' Font Book

To truly grasp the intricacies of font management, some specific terms are used
in this article.


## Terms and definitions

The following terms are used in the article.

<dl>

  <dt><strong>font</strong></dt>
  <dd>group of glyphs of the same design style, with each glyph referenced by a unique character code</dd>

  <dt><strong>glyph</strong></dt>
  <dd>vector graphic representing a literary character, such as a character in an alphabet or a pictogram</dd>

  <dt><strong>font family (or type family)</strong></dt>
  <dd>group of fonts sharing a design style</dd>

  <dt><strong>font style</strong></dt>
  <dd>style of the font within a font family, typically of the variants "regular", "bold" and "italic"</dd>

  <dt><strong>font weight</strong></dt>
  <dd>heaviness of the font in comparison with other fonts in the same font family, typically a higher number represents a bolder font</dd>

  <dt><strong>font formula</strong></dt>
  <dd>Fontist object (in YAML) containing description and instructions on fonts contained in an external distributed package that contains fonts</dd>

  <dt><strong>font manifest</strong></dt>
  <dd>Fontist object (in YAML) containing a coherent listing of font families and font styles indicating fonts to be installed together, typically for a particular purpose</dd>

  <dt><strong>font formula repository (or: Fontist repo)</strong></dt>
  <dd>Git repository used by Fontist to contain Fontist font formulas</dd>

</dl>


## Installing Fontist

Fontist works across all major platforms, including Windows, Linux and macOS.

The core of the Fontist software is in Ruby and utilizes C for its multitude of
archival handling methods.

Ruby can be installed on all major platforms following
[the official guide](https://www.ruby-lang.org/en/documentation/installation/).

When Ruby is set up, `fontist` can be installed as a gem (or as a Ruby library).

After installing, the `fontist` command becomes available:

```sh
$ gem install fontist
$ fontist help
Commands:
  fontist cache SUBCOMMAND ...ARGS       # Manage fontist cache
  fontist config SUBCOMMAND ...ARGS      # Manage fontist config
  fontist create-formula URL             # Create a new formula with fonts from URL
  fontist fontconfig SUBCOMMAND ...ARGS  # Manage fontconfig
  fontist help [COMMAND]                 # Describe available commands or one specific command
  fontist import SUBCOMMAND ...ARGS      # Manage imports
  fontist install FONT                   # Install font
  fontist list [FONT]                    # List installation status of FONT or fonts in fontist
  fontist manifest-install MANIFEST      # Install fonts from MANIFEST (yaml)
  fontist manifest-locations MANIFEST    # Get locations of fonts from MANIFEST (yaml)
  fontist rebuild-index                  # Rebuild formula index (used by formulas maintainers)
  fontist repo SUBCOMMAND ...ARGS        # Manage custom repositories
  fontist status [FONT]                  # Show paths of FONT or all fonts
  fontist uninstall/remove FONT          # Uninstall font by font or formula
  fontist update                         # Update formulas

Options:
     [--preferred-family], [--no-preferred-family]  # Use Preferred Family when available
  q, [--quiet], [--no-quiet]                        # Hide all messages
  v, [--verbose], [--no-verbose]                    # Print debug messages
  c, [--no-cache], [--no-no-cache]                  # Avoid using cache during download
     [--formulas-path=FORMULAS_PATH]                # Path to formulas
```


## Listing out supported fonts

Fontist allows installing fonts from the
[Fontist formulas repository](https://github.com/fontist/formulas)
managed on GitHub.

Each Fontist font formula typically represents a coherent collection of fonts,
a single package containing one or more fonts distributed together.

These fonts may be of the same font family or of disparate families.

Fontist font formulas currently support fonts from:

* [Google Fonts](https://fonts.google.com)
* [SIL International](https://software.sil.org/fonts/)
* open-source language-specific fonts such as: [IPAex (Japanese)](https://moji.or.jp/ipafont/ipaex00401/) and [Euphemia (Canadian Syllabics)](https://www.tiro.com/syllabics/resources/index.html)
* math and science fonts such as: [STIX](https://www.stixfonts.org)
* TeX fonts such as: [TeX Gyre](https://www.gust.org.pl/projects/e-foundry/tex-gyre/)
* curated and contributed fonts

To check what fonts are installed on your system:
```sh
$ fontist status
```

To see what fonts that can be installed:
```sh
$ fontist list
```

Number of font formulas: *2,082* (as of 2024-03-02)
Number of font styles: *13,738* (as of 2024-03-02)


## Font format support

Fontist supports major font formats including:

* TrueType (`*.ttf`) and TrueType Collections (`*.ttc`)
* OpenType and OpenType Collections (`*.otf` for both)
* Web Open Font Format 1 and 2 (`*.woff` and `*.woff2`)

Fontist does not yet support Adobe PostScript fonts such as `*.pf{a,b,m}`.


## Installing a font

It is easy to install a font using Fontist via the CLI:

```sh
$ fontist install Arial
```

That's it!


## Command-line interface and Ruby API

Fontist provides both a command-line interface, the `fontist` executable,
and a programmatic interface in Ruby.

For example, the following code will allow the program to know what
fonts are supplied by the current system given a font manifest:

```ruby
> manifest = {
  "Segoe UI"=>["Regular", "Bold"],
  "Roboto Mono"=>["Regular"]
}
> Fontist::Manifest::Locations.from_hash(manifest)
=>
  {
    "Segoe UI"=> {
      "Regular"=>{
        "full_name"=>"Segoe UI",
        "paths"=>["/Users/user/.fontist/fonts/SEGOEUI.TTF"]
      },
      "Bold"=>{
        "full_name"=>"Segoe UI Bold",
        "paths"=>["/Users/user/.fontist/fonts/SEGOEUIB.TTF"]
      }
    },
    "Roboto Mono"=> {
      "Regular"=>{
        "full_name"=>nil,
        "paths"=>[]
      }
    }
  }
```

## Additional information

There are many Fontist features that facilitate the installation and management
of fonts across platforms. Stay tuned with our blog and check out the home page
for further details!
