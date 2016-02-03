'use strict';
const fs = require('fs');
const {resolve} = require('path');
const pify = require('pify');
const test = require('ava');
const readPkgUp = require('read-pkg-up');
const exec = require('../src/exec');
const readFile = pify(fs.readFile);

/**
 * Each folder in `./fixtures` is considered a test.
 * The `description` in each test's `package.json` is used as the test name.
 *
 * `pj2md` is executed in each folder and the result is compared
 * with the corresponding `README.md` in the same folder (they should match).
 */
const dirs = fs.readdirSync(resolve(__dirname, 'fixtures'));
const cwd = folder => ({cwd: resolve(__dirname, 'fixtures', folder)});
const pkg = folder => readPkgUp.sync(cwd(folder));
const pj2md = (...args) => exec(resolve(__dirname, '..', 'bin', 'pj2md.js'), ...args);
const readme = folder => readFile(resolve(__dirname, 'fixtures', folder, 'README.md'), 'utf8');

dirs.forEach(folder => {
  const {description} = pkg(folder).pkg;
  test(description, async t => {
    const actual = await pj2md(cwd(folder));
    const expected = await readme(folder);
    t.is(actual, expected);
  });
});
