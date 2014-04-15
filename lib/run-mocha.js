'use strict';

var _ = require('lodash'),
    runner = require('./runner'),
    files = JSON.parse(process.argv[2]),
    browser = JSON.parse(process.argv[3]),
    options = JSON.parse(process.argv[4]);

if (options.grep) {
  options.grep = new RegExp('^' + options.grep + '$')
}

runner(files, browser, options, function done(err) {
  if (err) {
    throw err;
  }
});

