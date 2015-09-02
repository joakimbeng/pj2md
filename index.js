'use strict';
var path = require('path');
var assign = require('object-assign');
var pathExists = require('path-exists');
var pify = require('pify');
var exec = pify(require('child_process').exec);
var parseAuthor = require('parse-author');
var username = require('gh-repo-to-user');
var lookUp = require('look-up');
var camelcase = require('camelcase');
var getApi = require('get-api');
var render = require('./templates');

module.exports = exports = function pj2md(options) {
  options = assign({
    cwd: process.cwd(),
    badges: true,
    api: true,
    module: true,
    codestyle: true,
    cli: true,
    license: true
  }, options);

  var packageJsonPath = lookUp('package.json', {cwd: options.cwd}) || path.resolve(options.cwd, 'package.json');
  var travisYmlPath = lookUp('.travis.yml') || path.resolve(options.cwd, '.travis.yml');

  var pkg;
  try {
    pkg = require(packageJsonPath);
  } catch (e) {
    return Promise.reject(new Error('No package.json found for current working directory!\nCan not continue...'));
  }

  if (!pathExists.sync(travisYmlPath)) {
    options.travis = false;
  }

  var moduleName = camelcase(pkg.name);

  var context = {
    pkg: pkg,
    moduleName: moduleName,
    badges: options.badges,
    api: options.api && pkg.main,
    module: options.module && pkg.main,
    cli: options.cli && pkg.bin,
    license: options.license && pkg.license,
    author: typeof pkg.author === 'object' ? pkg.author : parseAuthor(pkg.author),
    usage: options.module && pkg.main || options.cli && pkg.bin,
    travis: options.travis && username(pkg.repository),
    codestyle: options.codestyle && getCodeStyle(pkg),
    commands: null,
    methods: null
  };

  if (options.api && pkg.main) {
    context.methods = getApi(require(path.resolve(path.dirname(packageJsonPath), pkg.main)), {main: moduleName}).methods;
  }

  var promise = Promise.resolve(context);

  if (options.cli && pkg.bin) {
    promise = Promise.all(binToCommands(pkg.name, pkg.bin).map(function (cmd) {
      return exec(cmd.location + ' --help', options.cwd)
        .then(function (usage) {
          return {name: cmd.name, usage: usage.join('').trim()};
        });
    }))
    .then(function (commands) {
      context.commands = commands;
      return context;
    });
  }

  return promise.then(render);
};

function getCodeStyle(pkg) {
  var codestyle = null;

  if (moduleDependsOn(pkg, 'xo')) {
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
}

function binToCommands(name, bin) {
  if (typeof bin === 'string') {
    return [{name: name, location: bin}];
  }
  if (typeof bin === 'object') {
    return Object.keys(bin).map(function (name) {
      return {name: name, location: bin[name]};
    });
  }
  return [];
}

function moduleDependsOn(pkg, dependency) {
  return pkg.devDependencies[dependency] || pkg.dependencies[dependency] || pkg.peerDependencies[dependency];
}
