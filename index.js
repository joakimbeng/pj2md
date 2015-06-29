'use strict';
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var Promise = require('bluebird');
var camelcase = require('camelcase');
var functionParams = require('function-params');
var render = require('./templates');

Promise.promisifyAll(fs);

module.exports = exports = function pj2md (options) {
  options = options || {};
  options.badges = typeof options.badges === 'undefined' ? true : options.badges;
  options.api = typeof options.api === 'undefined' ? true : options.api;
  options.module = typeof options.module === 'undefined' ? true : options.module;
  options.cli = typeof options.cli === 'undefined' ? true : options.cli;
  options.license = typeof options.license === 'undefined' ? true : options.license;

  var packageJsonPath = path.resolve('package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('No package.json found in current working directory!\nCan not continue...');
    return process.exit(1);
  }

  if (options.out && !options.force) {
    if (fs.existsSync(path.resolve(options.out))) {
      console.error(options.out + ' already exists, use --force option to continue.');
      return process.exit(1);
    }
  }

  if (!fs.existsSync(path.resolve('.travis.yml'))) {
    options.travis = null;
  }

  fs.readFileAsync(packageJsonPath, 'utf8')
    .then(JSON.parse)
    .then(function (pkg) {
      var moduleName = camelcase(pkg.name);
      var context = {
        pkg: pkg,
        moduleName: moduleName,
        badges: options.badges,
        api: options.api && pkg.main,
        module: options.module && pkg.main,
        cli: options.cli && pkg.bin,
        license: options.license,
        usage: options.module && pkg.main || options.cli && pkg.bin,
        travis: options.travis
      };

      if (options.api && pkg.main) {
        context.methods = getMethodsFromModule(moduleName, path.resolve(pkg.main));
      }

      if (options.cli && pkg.bin) {
        return Promise.all(binToCommands(pkg.name, pkg.bin).map(function (cmd) {
          return run(cmd.location + ' --help')
            .then(function (usage) {
              return {name: cmd.name, usage: usage};
            });
        }))
        .then(function (commands) {
          context.commands = commands;
          return context;
        });
      }
      return context;
    })
    .then(function (context) {
      var readme = render(context);
      if (options.out) {
        return fs.writeFileAsync(path.resolve(options.out), readme, 'utf8');
      }
      console.log(render(context));
    })
    .catch(function (err) {
      console.error(err.message);
      process.exit(1);
    });
};

function binToCommands (name, bin) {
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

function getMethodsFromModule (moduleName, modulePath) {
  var module;
  var methods = [];
  try {
    module = require(modulePath);
  } catch (e) {
    return methods;
  }
  if (typeof module === 'function') {
    methods.push({name: moduleName, params: getParamsForMethod(moduleName, module)});
  }
  Object.keys(module).forEach(function (name) {
    if (typeof module[name] === 'function') {
      methods.push({name: moduleName + '.' + name, params: getParamsForMethod(moduleName + '.' + name, module[name])});
    }
  });
  return methods;
}

function getParamsForMethod (name, method) {
  var params = functionParams(method);
  if (params.length !== method.length) {
    console.warn('Could not reliably get name of all parameters for: ' + name + '().\nWanted ' + method.length + ' parameters, got: "' + params.join('", "') + '"');
    if (params.length < method.length) {
      for (var i = params.length; i < method.length; i++) {
        params.push('param' + i);
      }
    } else if (params.length > method.length) {
      params = params.slice(0, method.length);
    }
  }
  return params;
}

function run (cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, {cwd: process.cwd()}, function (err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      return resolve(stdout.toString());
    });
  });
}
