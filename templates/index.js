'use strict';
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const all = require('promise-all');

// We do this sync because it's on upstart:

const files = fs.readdirSync(__dirname);

const templates = files.reduce((templates, file) => (
  file === 'index.js' ?
  templates :
  templates.concat({
    name: file.split('.')[0],
    template: fs.readFileSync(path.join(__dirname, file), 'utf8')
  })
), []);

templates.forEach(template => handlebars.registerPartial(template.name, template.template));

const compiled = handlebars.compile('{{> README }}');

module.exports = exports = function render(data) {
  return all(data).then(compiled);
};
