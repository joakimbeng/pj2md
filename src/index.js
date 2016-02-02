'use strict';
const path = require('path');
const parseAuthor = require('parse-author');
const username = require('gh-repo-to-user');
const findUp = require('find-up');
const readPkgUp = require('read-pkg-up');
const camelcase = require('camelcase');
const getApi = require('get-api');
const or = require('promise-or');
const and = require('promise-and');
const all = require('promise-all');
const get = require('promise-get');
const call = require('promise-fncall');
const LazyPromise = require('lazy-promise');
const render = require('../templates');
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
    travis: true
  }, options);

  const badges = options.badges;
  const hasTravisYml = findUp('.travis.yml', {cwd: options.cwd});
  const readPkg = readPackage(options.cwd);
  const pkg = get('pkg', readPkg);
  const moduleName = call(camelcase, get('name', pkg));
  const user = call(username, get('repository', pkg));
  const module = and(options.module, get('main', pkg));
  const cli = and(options.cli, get('bin', pkg));
  const api = and(options.api, get('main', pkg));
  const license = and(options.license, get('license', pkg));

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
    commands: and(cli, getCliCommands(get('bin', pkg), options)),
    methods: and(api, getApiMethods(readPkg, moduleName))
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

function getCliCommands(binPromise, options) {
  return new LazyPromise((resolve, reject) => {
    binPromise.then(bin => all(
      binToCommands(bin)
        .map(cmd =>
          getCommandHelp(cmd, options)
        )
    ))
    .then(resolve, reject);
  });
}

function getCommandHelp(cmd, options) {
  return exec(cmd.location, ['--help'], {cwd: options.cwd})
    .then(usage => ({
      name: cmd.name,
      usage: usage.join('').trim()
    }));
}

function getApiMethods(readPkgPromise, moduleName) {
  return new LazyPromise((resolve, reject) => {
    all({
      modulePath: call(path.resolve, call(path.dirname, get('path', readPkgPromise)), get('pkg.main', readPkgPromise)),
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
