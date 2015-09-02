# pj2md

[![NPM version][npm-image]][npm-url] [![js-xo-style][codestyle-image]][codestyle-url]

> Generate a README in markdown from a package.json file

## Installation

Install `pj2md` globally using [npm](https://www.npmjs.com/):

```bash
npm install -g pj2md
```

## Usage

### CLI usage

```bash
$> pj2md --help

Usage: bin/pj2md [options]

Options:
  -b, --badges     Add badges to readme, e.g. the npm badge  [boolean] [default: true]
  -t, --travis     Add Travis build badge to readme if `.travis.yml` exists and `package.json` has a "repository" field for a GitHub repo  [boolean]
  -s, --codestyle  Add codestyle badge to readme if package.json depends on `xo`, `semistandard` or `standard`  [boolean] [default: true]
  -m, --module     Add module usage information to readme if `package.json` has a "main" section  [boolean] [default: true]
  -c, --cli        Add cli usage information to readme if `package.json` has a "bin" section  [boolean] [default: true]
  -a, --api        Add API information to readme if `package.json` has a "main" section  [boolean] [default: true]
  -l, --license    Add license information to readme if `package.json` has a "license" section  [boolean] [default: true]
  -o, --out        Output file  [string]
  -f, --force      Force overwrite output file if it already exists  [boolean]
  -h, --help       Show help  [boolean]

Examples:
  bin/pj2md --no-api -f -o README.md  Generate (and overwrite) README.md without API information from current package.json file
```


## License

MIT © Joakim Carlstein

[npm-url]: https://npmjs.org/package/pj2md
[npm-image]: https://badge.fury.io/js/pj2md.svg
[codestyle-url]: https://github.com/sindresorhus/xo
[codestyle-image]: https://img.shields.io/badge/code%20style-xo-brightgreen.svg?style=flat
