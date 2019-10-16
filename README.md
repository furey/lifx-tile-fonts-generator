# lifx-tile-fonts-generator

Font generator for the [lifx-tile-fonts](https://github.com/furey/lifx-tile-fonts) repository. ⚙️🔠

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Fonts](#fonts)
- [License](#license)

## Requirements

- [`node -v`](https://nodejs.org/en/download/current/) >= `v12.10.*`
- [`npm -v`](https://www.npmjs.com/get-npm) >= `6.10.*`

## Installation

```console
$ git clone https://github.com/furey/lifx-tile-fonts-generator.git
$ cd lifx-tile-fonts-generator
$ npm ci
```

## Configuration

Add the following `.env` file to your repository root:

```ini
OUTPUT_PATH=path/to/my/output/directory
```

Set `OUTPUT_PATH` to your intended output destination.

If not set, `OUTPUT_PATH` defaults to `'./fonts/output'`.

## Usage

```console
$ node .

Group: oldschool-pc-fonts
Font: verite
Char: A
········
·█████··
██···██·
██···██·
███████·
██···██·
██···██·
██···██·


Group: oldschool-pc-fonts
Font: verite
Char: B
········
██████··
·██··██·
·██··██·
·█████··
·██··██·
·██··██·
██████··


Group: oldschool-pc-fonts
Font: verite
Char: C
········
·█████··
██···██·
██······
██······
██······
██···██·
·█████··

// etc…
```

## Fonts

This repo processes `8x8` fonts sourced from:

- [Protracker v2.3D/v2.3E Font](https://github.com/echolevel/protracker-font)
- [The Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/)

## License

ISC License

Copyright (c) 2019, James Furey

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
