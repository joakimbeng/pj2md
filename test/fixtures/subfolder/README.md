# pj2md

[![Build status][travis-image]][travis-url] [![NPM version][npm-image]][npm-url] [![XO code style][codestyle-image]][codestyle-url]

> Generate a README in markdown from a package.json file

## Installation

Install `pj2md` globally using [npm](https://www.npmjs.com/):

```bash
npm install -g pj2md
```

## Usage

### CLI usage

```
$> pj2md --help

Generate a README in markdown from a package.json file

  Usage:
    pj2md [options]

  Options:
    -o, --out=<file>     Output to file instead of stdout
    -f, --force          Overwrite any existing output file
    -l, --logo=<path>    Add the provided file as a logo, using http://rawgit.com/ url's (1)
    -r, --related=<pkg>  Add a package as a related package in readme (can be set multiple times)
    --no-badges          Don't add any badges to readme
    --no-travis          Don't add a Travis build badge (2)
    --no-codestyle       Don't add a code style badge (3)
    --no-module          Don't add module usage information (4)
    --no-api             Don't add API information (4)
    --no-cli             Don't add CLI usage information (5)
    --no-license         Don't add license information to readme
    -v, --version        Show version number
    -h, --help           Show help

      1) only applicable when package has a 'repository' section
      2) only applicable when there's a '.travis.yml' file in project
      3) only applicable when package depends on XO, semistandard or standard
      4) only applicable when package has a 'main' section
      5) only applicable when package has a 'bin' section

  Examples:
    pj2md --no-api -f -o README.md    Generate (and overwrite) README.md without API information from current package.json file
    pj2md --logo media/project.svg > README.md   Generate a readme with 'media/project.svg' as logo to stdout, which is then saved as README.md
```


## License

MIT © [Joakim Carlstein](http://joakim.beng.se)

[npm-url]: https://npmjs.org/package/pj2md
[npm-image]: https://badge.fury.io/js/pj2md.svg
[travis-url]: https://travis-ci.org/joakimbeng/pj2md
[travis-image]: https://travis-ci.org/joakimbeng/pj2md.svg?branch=master
[codestyle-url]: https://github.com/sindresorhus/xo
[codestyle-image]: https://img.shields.io/badge/code%20style-XO-5ed9c7.svg?style=flat
