'use strict';
var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');

// We do this sync because it's on upstart:

var files = fs.readdirSync(__dirname);

var templates = files.reduce(function (templates, file) {
  if (file !== 'index.js') {
    templates.push({
      name: file.split('.')[0],
      template: fs.readFileSync(path.join(__dirname, file), 'utf8')
    });
  }
  return templates;
}, []);

templates.forEach(function (template) {
  handlebars.registerPartial(template.name, template.template);
});

var compiled = handlebars.compile('{{> README }}');

module.exports = exports = function render (data) {
  return compiled(data);
};
