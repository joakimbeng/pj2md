'use strict';
const pify = require('pify');
const exec = pify(require('child_process').execFile);

module.exports = exports = exec;
