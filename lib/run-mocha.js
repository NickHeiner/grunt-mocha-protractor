'use strict';

var _ = require('lodash'),
    runner = require('./runner'),
    files = JSON.parse(process.argv[2]),
    browser = JSON.parse(process.argv[3]),
    options = JSON.parse(process.argv[4]);

runner(files, browser, options, _.noop);

