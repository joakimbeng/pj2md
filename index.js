'use strict';
var path = require('path');
var assign = require('object-assign');
var pify = require('pify');
var exec = pify(require('child_process').execFile);
var parseAuthor = require('parse-author');
var username = require('gh-repo-to-user');
var findUp = require('find-up');
var readPkgUp = require('read-pkg-up');
var camelcase = require('camelcase');
var getApi = require('get-api');
var or = require('promise-or');
var and = require('promise-and');
var all = require('promise-all');
var get = require('promise-get');
var call = require('promise-fncall');
var LazyPromise = require('lazy-promise');
var render = require('./templates');

module.exports = exports = function pj2md(options) {
  options = assign({
    cwd: process.cwd(),
    badges: true,
    api: true,
    module: true,
    codestyle: true,
    cli: true,
    license: true,
    travis: true
  }, options);

  var hasTravisYml = findUp('.travis.yml', {cwd: options.cwd});
  var readPkg = readPackage(options.cwd);
  var pkg = get('pkg', readPkg);
  var moduleName = call(camelcase, get('name', pkg));
  var user = call(username, get('repository', pkg));
  var isModule = and(options.module, get('main', pkg));
  var isCli = and(options.cli, get('bin', pkg));
  var showApi = and(options.api, get('main', pkg));

  var context = {
    pkg: pkg,
    moduleName: moduleName,
    badges: options.badges,
    api: showApi,
    module: isModule,
    cli: isCli,
    license: and(options.license, get('license', pkg)),
    author: getAuthorObject(get('author', pkg)),
    usage: or(isModule, isCli),
    user: user,
    logo: and(user, options.logo),
    travis: and(options.travis, hasTravisYml, user),
    codestyle: and(options.codestyle, getCodeStyle(pkg)),
    commands: and(isCli, getCliCommands(get('bin', pkg), options)),
    methods: and(showApi, getApiMethods(readPkg, moduleName))
  };

  return render(context);
};

function getCodeStyle(pkgPromise) {
  return pkgPromise.then(function (pkg) {
    var codestyle = null;

    if (moduleDependsOn(pkg, 'xo') || moduleDependsOn(pkg, 'eslint-config-xo')) {
      codestyle = {
        name: 'xo',
        repo: 'sindresorhus'
      };
    } else if (moduleDependsOn(pkg, 'semistandard')) {
      codestyle = {
        name: 'semistandard',
        repo: 'Flet'
      };
    } else if (moduleDependsOn(pkg, 'standard')) {
      codestyle = {
        name: 'standard',
        repo: 'feross'
      };
    }

    return codestyle;
  });
}

function getCliCommands(binPromise, options) {
  return new LazyPromise(function (resolve, reject) {
    binPromise.then(function (bin) {
      return all(binToCommands(bin).map(function (cmd) {
        return getCommandHelp(cmd, options);
      }));
    })
    .then(resolve, reject);
  });
}

function getCommandHelp(cmd, options) {
  return exec(cmd.location, ['--help'], {cwd: options.cwd})
    .then(function (usage) {
      return {name: cmd.name, usage: usage.join('').trim()};
    });
}

function getApiMethods(readPkgPromise, moduleName) {
  return new LazyPromise(function (resolve, reject) {
    all({
      modulePath: call(path.resolve, call(path.dirname, get('path', readPkgPromise)), get('pkg.main', readPkgPromise)),
      moduleName: moduleName
    })
    .then(function (result) {
      return getApi(require(result.modulePath), {main: result.moduleName}).methods;
    })
    .then(resolve, reject);
  });
}

function getAuthorObject(authorPromise) {
  return authorPromise.then(function (author) {
    return typeof author === 'object' ? author : parseAuthor(author);
  });
}

function readPackage(cwd) {
  return readPkgUp({cwd: cwd})
    .then(function (pkg) {
      if (!pkg.pkg) {
        throw new Error('No package.json found for current working directory!\nCan not continue...');
      }
      return pkg;
    });
}

function binToCommands(bin) {
  if (typeof bin === 'object') {
    return Object.keys(bin).map(function (name) {
      return {name: name, location: bin[name]};
    });
  }
  return [];
}

function moduleDependsOn(pkg, dependency) {
  return pkg.devDependencies && pkg.devDependencies[dependency] ||
         pkg.dependencies && pkg.dependencies[dependency] ||
         pkg.peerDependencies && pkg.peerDependencies[dependency];
}
