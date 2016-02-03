#!/usr/bin/env node
const path = require('path');
const pify = require('pify');
const writeFile = pify(require('fs').writeFile);
const meow = require('meow');
const pathExists = require('path-exists');
const pkgConf = require('pkg-conf');
const pj2md = require('../src');

const config = pkgConf.sync('pj2md');

const cli = meow(`
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
`, {
  default: config,
  string: [
    'out',
    'logo'
  ],
  alias: {
    h: 'help',
    v: 'version',
    f: 'force',
    o: 'out',
    l: 'logo'
  }
});

pj2md(cli.flags)
  .then(md => {
    if (!cli.flags.out) {
      return process.stdout.write(md);
    }
    const outputFile = path.resolve(cli.flags.out);
    return pathExists(outputFile)
      .then(yes => {
        if (yes && !cli.flags.force) {
          throw new Error(`${cli.flags.out} already exists, use --force option to continue.`);
        }
        return writeFile(outputFile, md, 'utf8');
      });
  });