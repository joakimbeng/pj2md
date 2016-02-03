'use strict';
const fs = require('fs');
const path = require('path');
const pify = require('pify');
const LazyPromise = require('lazy-promise');
const handlebars = require('handlebars');
const and = require('promise-and');
const all = require('promise-all');
const map = require('promise-map');
const reduce = require('promise-reduce');
const filter = require('promise-filter');
const call = require('promise-fncall');

const readdir = pify(fs.readdir);
const readfile = pify(fs.readFile);

module.exports = exports = function load(options) {
  options = options || {};
  const files = readdir(__dirname).then(filter(file => file.slice(-7) === '.md.hbs'));

  const templates = files
    .then(reduce((templates, file) => templates.concat([
      getHookTemplate('pre', file, options),
      getTemplate(file),
      getHookTemplate('post', file, options)
    ]), []))
    .then(all);

  const compiled = templates
    .then(map(template => {
      handlebars.registerPartial(template.name, template.template);
    }))
    .then(() => handlebars.compile('{{> README }}'));

  return function render(data) {
    return call(compiled, all(data));
  };
};

function fileToTemplateName(file) {
  return file.split('.')[0];
}

function getTemplate(file) {
  const name = fileToTemplateName(file);
  return all({
    name,
    template: read(path.join(__dirname, file))
  });
}

function getHookTemplate(type, file, options) {
  const hook = `${type}${fileToTemplateName(file).replace('Section', '')}`;
  return all({
    name: hook,
    template: and(
      options[hook] || '',
      lazyCall(read, lazyCall(path.resolve, options.cwd, options[hook]))
    )
  });
}

function lazyCall() {
  /* eslint prefer-spread: 0 */
  const args = Array.prototype.slice.call(arguments);
  return new LazyPromise((resolve, reject) => call.apply(null, args).then(resolve, reject));
}

function read(file) {
  return new LazyPromise((resolve, reject) => readfile(file, 'utf8').then(resolve, reject));
}
