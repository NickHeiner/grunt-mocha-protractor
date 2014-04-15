/*
 * grunt-mocha-protractor
 * https://github.com/noblesamurai/grunt-mocha-protractor
 */

'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('mochaProtractor', 'Run e2e angular tests with webdriver.', function() {

    var _ = require('lodash'),
        path = require('path'),
        throttleFork = require('../lib/throttle-fork'),
        getMochaTestTitles = require('../lib/get-mocha-test-titles'),
        q = require('q'),

        files = this.files,
        options = this.options({
          browsers: ['Chrome'],
          reporter: 'List',
          args: null,
          seleniumUrl: 'http://localhost:4444/wd/hub',

          // saucelabs options
          sauceUsername: process.env.SAUCE_USERNAME,
          sauceAccessKey: process.env.SAUCE_ACCESS_KEY,

          // protractor config
          baseUrl: '',
          rootElement: '',
          params: {}
        }),
        done = this.async(),
        forks = _.map(options.browsers, function(browser) {
          return _.map(files, function(fileGroup) {
            var expandedFiles = grunt.file.expand({filter: 'isFile'}, fileGroup.src),
                testTitles = getMochaTestTitles(expandedFiles);

            return _.map(testTitles.slice(35), function (testTitle) {

              // We will have to find a better solution for grep later.
              options.grep = testTitle;

              var pathToRunMochaModule = path.join(__dirname, '..', 'lib', 'run-mocha.js'),
                  rawArgs = [expandedFiles, browser, options],
                  serializedArgs = _.map(rawArgs, function (arg) {
                    // this will kill grep
                    // http://stackoverflow.com/questions/12075927/serialization-of-regexp
                    return JSON.stringify(arg);
                  });

              return {
                moduleToRun: pathToRunMochaModule,
                args: serializedArgs,
                grep: testTitle
              };
            });
          });
        }),
        flattenedForks = _.flatten(forks);

    grunt.log.ok('Forking `' + flattenedForks.length + '` subprocesses');

    // If we don't throttle it and just fork 150+ node processes at once,
    // the machine may become sad.
    throttleFork(flattenedForks, 1/8)
        .then(done)
        .fail(function(err) {
          done(new Error('Forked mocha processes exited with status codes: ' + err));
        });

  });
};
