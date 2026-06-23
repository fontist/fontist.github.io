---
title: "Installing Windows supplementary fonts with Features on Demand"
description: "Fontist 3.0 can install over 100 Windows supplementary fonts — Japanese, Korean, Pan-European, and more — using Windows Features on Demand, automatically via PowerShell."
authors:
  - Ronald Tse
date: 2026-05-03
---

# Installing Windows supplementary fonts with Features on Demand

<BlogByline />

Windows 10 and 11 ship with a large catalog of fonts, but many are not
installed by default. These supplementary fonts — covering Japanese, Korean,
Chinese, Arabic, Hebrew, Thai, Pan-European, and many other scripts — are
available as Features on Demand (FOD) but require manual installation through
Settings or PowerShell.

Fontist 3.0 now installs these fonts automatically. A single command is all it
takes:

```sh
$ fontist install "Meiryo"
```

## The problem

Windows does not install all available fonts by default to save disk space.
Fonts like Meiryo (Japanese), Batang (Korean), Arial Nova (Pan-European), and
Plantagenet Cherokee are available as optional Features on Demand but require
either navigating through Windows Settings or running PowerShell commands with
admin privileges.

For CI pipelines running on Windows, this is especially inconvenient.
Documents that reference these fonts fail to render correctly when the fonts
are missing.

## How it works

When you install a Windows FOD font through Fontist, it:

1. Checks whether the required Windows capability is already installed using
   `Get-WindowsCapability`
2. If not present, installs it using `Add-WindowsCapability -Online`
3. Verifies the font files are now available in `C:\Windows\Fonts\`

This uses the Formula v5 schema with a `source: windows_fod` resource type,
which tells Fontist to handle installation through the operating system rather
than downloading an archive.

## Installing a font

Install any Windows FOD font by name:

```sh
$ fontist install "Meiryo"
```

```sh
$ fontist install "Arial Nova"
```

```sh
$ fontist install "Plantagenet Cherokee"
```

Use `--accept-all-licenses` for non-interactive installs:

```sh
$ fontist install "Meiryo" --accept-all-licenses
```

## Using in CI

On GitHub Actions Windows runners, FOD font installation works out of the box
since the runners have admin privileges:

```yaml
- name: Install fonts
  run: gem install fontist && fontist install "Meiryo" --accept-all-licenses
  shell: pwsh
```

## Requirements

- Windows 10 (version 1607) or later
- Administrator privileges (required by `Add-WindowsCapability`)
- Internet connectivity (Windows downloads the font capability on first install)

To check which FOD font capabilities are available on your system, run:

```powershell
Get-WindowsCapability -Online -Name "Language.Fonts.*"
```

## Available fonts

Fontist supports 24 Windows FOD capability groups containing 100 font families.

<details>
<summary>Click to expand the full list</summary>

### Arabic Script Supplemental Fonts

- Aldhabi
- Andalus
- Arabic Typesetting
- Microsoft Uighur
- Sakkal Majalla
- Simplified Arabic
- Simplified Arabic Fixed
- Traditional Arabic
- Urdu Typesetting

### Bangla Script Supplemental Fonts

- Shonar Bangla
- Vrinda

### Canadian Aboriginal Syllabics Supplemental Fonts

- Euphemia

### Cherokee Supplemental Fonts

- Plantagenet Cherokee

### Chinese (Simplified) Supplemental Fonts

- DengXian
- FangSong
- KaiTi
- SimHei

### Chinese (Traditional) Supplemental Fonts

- DFKai-SB
- MingLiU
- MingLiU_HKSCS
- PMingLiU

### Devanagari Supplemental Fonts

- Aparajita
- Kokila
- Mangal
- Sanskrit Text
- Utsaah

### Ethiopic Supplemental Fonts

- Nyala

### Gujarati Supplemental Fonts

- Shruti

### Gurmukhi Supplemental Fonts

- Raavi

### Hebrew Supplemental Fonts

- Aharoni Bold
- David
- FrankRuehl
- Gisha
- Levenim MT
- Miriam
- Miriam Fixed
- Narkisim
- Rod

### Japanese Supplemental Fonts

- BIZ UDGothic
- BIZ UDPGothic
- BIZ UDMincho Medium
- BIZ UDPMincho Medium
- Meiryo
- Meiryo UI
- MS Mincho
- MS PMincho
- UD Digi Kyokasho N-B
- UD Digi Kyokasho NK-B
- UD Digi Kyokasho NK-R
- UD Digi Kyokasho NP-B
- UD Digi Kyokasho NP-R
- UD Digi Kyokasho N-R
- Yu Mincho

### Kannada Supplemental Fonts

- Tunga

### Khmer Supplemental Fonts

- DaunPenh
- Khmer UI
- MoolBoran

### Korean Supplemental Fonts

- Batang
- BatangChe
- Dotum
- DotumChe
- Gulim
- GulimChe
- Gungsuh
- GungsuhChe

### Lao Supplemental Fonts

- DokChampa
- Lao UI

### Malayalam Supplemental Fonts

- Kartika

### Odia Supplemental Fonts

- Kalinga

### Pan-European Supplemental Fonts

- Arial Nova
- Arial Nova Cond
- Georgia Pro
- Georgia Pro Cond
- Gill Sans Nova
- Gill Sans Nova Cond
- Neue Haas Grotesk Text Pro
- Rockwell Nova
- Rockwell Nova Cond
- Verdana Pro
- Verdana Pro Cond

### Sinhala Supplemental Fonts

- Iskoola Pota

### Syriac Supplemental Fonts

- Estrangelo Edessa

### Tamil Supplemental Fonts

- Latha
- Vijaya

### Telugu Supplemental Fonts

- Gautami
- Vani

### Thai Supplemental Fonts

- Angsana New
- AngsanaUPC
- Browallia New
- BrowalliaUPC
- Cordia New
- CordiaUPC
- DilleniaUPC
- EucrosiaUPC
- FreesiaUPC
- IrisUPC
- JasmineUPC
- KodchiangUPC
- Leelawadee
- LilyUPC

</details>

## What else is new in Fontist 3.0

Windows FOD support is part of the Fontist 3.0 release, which also includes
these improvements:

**Formula v5 schema.**
Formulas now support multiple font formats (TTF, OTF, WOFF2), variable font
metadata, and import provenance. See our earlier post on Formula v5 for the full details.

**Platform-aware font selection.**
Manifests now validate operating system compatibility before attempting to
install platform-specific fonts, preventing errors when a font is only
available on one platform.

**Skip license prompts for already-installed fonts.**
If a font is already present on the current operating system, Fontist skips the
license confirmation step, reducing friction when re-running installations.

**Lazy formulas initialization.**
The formulas repository is no longer cloned at startup. Fontist defers this
until the first operation that actually needs formulas, making initial startup
faster.

**Index rebuild speedup.**
The index rebuild process has been optimized for large formula repositories,
reducing the time needed to refresh the font index.

## Conclusion

Windows FOD font support rounds out Fontist's platform coverage. Together with
macOS supplementary fonts, Google Fonts, SIL fonts, and Microsoft Office fonts,
Fontist now provides automated installation of openly-licensed fonts across all
major platforms.

Install Fontist and try it:

```sh
$ gem install fontist
$ fontist install "Meiryo"
```
