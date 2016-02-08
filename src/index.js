'use strict';
const path = require('path');
const arrify = require('arrify');
const pathExists = require('path-exists');
const parseAuthor = require('parse-author');
const username = require('gh-repo-to-user');
const readPkgUp = require('read-pkg-up');
const getPkgs = require('get-pkgs');
const camelcase = require('camelcase');
const getApi = require('get-api');
const or = require('promise-or');
const and = require('promise-and');
const all = require('promise-all');
const get = require('promise-get');
const call = require('promise-fncall');
const LazyPromise = require('lazy-promise');
const templates = require('../templates');
const exec = require('./exec');

module.exports = exports = function pj2md(options) {
  options = Object.assign({
    cwd: process.cwd(),
    badges: true,
    api: true,
    module: true,
    codestyle: true,
    cli: true,
    license: true,
    travis: true,
    related: null
  }, options);

  const badges = options.badges;
  const related = arrify(options.related);
  const readPkg = readPackage(options.cwd);
  const pkg = get('pkg', readPkg);
  const pkgPath = call(path.dirname, get('path', readPkg));
  const hasTravisYml = call(path.resolve, pkgPath, '.travis.yml').then(pathExists);
  const moduleName = call(camelcase, get('name', pkg));
  const user = call(username, get('repository', pkg));
  const main = get('main', pkg);
  const module = and(options.module, main);
  const cli = and(options.cli, get('bin', pkg));
  const api = and(options.api, main);
  const license = and(options.license, get('license', pkg));
  const render = templates(options);

  const context = {
    badges,
    pkg,
    moduleName,
    user,
    api,
    module,
    cli,
    license,
    author: getAuthorObject(get('author', pkg)),
    usage: or(module, cli),
    logo: and(user, options.logo),
    travis: and(options.travis, hasTravisYml, user),
    codestyle: and(options.codestyle, getCodeStyle(pkg)),
    commands: and(cli, getCliCommands(pkgPath, cli)),
    related: and(related.length, getRelatedPkgs(related)),
    methods: and(api, getApiMethods(pkgPath, main, moduleName))
  };

  return render(context);
};

function getCodeStyle(pkgPromise) {
  return pkgPromise.then(pkg => {
    if (moduleDependsOn(pkg, 'xo') || moduleDependsOn(pkg, 'eslint-config-xo')) {
      return {
        name: 'XO',
        repo: 'sindresorhus/xo',
        color: '5ed9c7'
      };
    } else if (moduleDependsOn(pkg, 'semistandard')) {
      return {
        name: 'semistandard',
        repo: 'Flet/semistandard',
        color: 'brightgreen'
      };
    } else if (moduleDependsOn(pkg, 'standard')) {
      return {
        name: 'standard',
        repo: 'feross/standard',
        color: 'brightgreen'
      };
    }
    return null;
  });
}

function getCliCommands(pkgPath, bin) {
  return new LazyPromise((resolve, reject) => {
    all({pkgPath, bin})
      .then(res => all(
        binToCommands(res.bin)
          .map(cmd =>
            getCommandHelp(res.pkgPath, cmd)
          )
      ))
      .then(resolve, reject);
  });
}

function getCommandHelp(pkgPath, cmd) {
  return exec(cmd.location, ['--help'], {cwd: pkgPath})
    .then(usage => ({
      name: cmd.name,
      usage: usage.trim()
    }));
}

function getRelatedPkgs(related) {
  return new LazyPromise((resolve, reject) => {
    getPkgs(related, (err, pkgs) => {
      if (err) {
        return reject(err);
      }
      resolve(pkgs);
    });
  });
}

function getApiMethods(pkgPath, mainModule, moduleName) {
  return new LazyPromise((resolve, reject) => {
    all({
      modulePath: call(path.resolve, pkgPath, mainModule),
      moduleName
    })
    .then(result => getApi(require(result.modulePath), {main: result.moduleName}).methods)
    .then(resolve, reject);
  });
}

function getAuthorObject(authorPromise) {
  return authorPromise.then(author =>
    typeof author === 'string' ?
    parseAuthor(author) :
    author
  );
}

function readPackage(cwd) {
  return readPkgUp({cwd})
    .then(pkg => {
      if (!pkg.pkg) {
        throw new Error('No package.json found for current working directory!\nCan not continue...');
      }
      return pkg;
    });
}

function binToCommands(bin) {
  if (typeof bin === 'object') {
    return Object.keys(bin).map(name => ({
      name,
      location: bin[name]
    }));
  }
  return [];
}

function moduleDependsOn(pkg, dependency) {
  return pkg.devDependencies && pkg.devDependencies[dependency] ||
         pkg.dependencies && pkg.dependencies[dependency] ||
         pkg.peerDependencies && pkg.peerDependencies[dependency];
}
