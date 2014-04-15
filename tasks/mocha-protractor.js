/*
 * grunt-mocha-protractor
 * https://github.com/noblesamurai/grunt-mocha-protractor
 */

'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('mochaProtractor', 'Run e2e angular tests with webdriver.', function() {

    var _ = require('lodash'),
        path = require('path'),
        partition = require('../lib/partition'),
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
          params: {},

          testPartitionSize: 20,
          throttleFactor: 1
        }),
        done = this.async(),
        forks = _.map(options.browsers, function(browser) {
          return _.map(files, function(fileGroup) {
            var expandedFiles = grunt.file.expand({filter: 'isFile'}, fileGroup.src),
                testTitles = getMochaTestTitles(expandedFiles),

                /**
                 * The selenium server seems to have some issue where it will only give
                 * out so many sessions before hanging and being entirely unresponsive,
                 * even to hitting it via curl or the browser. To get around that,
                 * let's just limit the number of different sessions we need by running
                 * more tests in each fork. This unfortunately reduces parallelism.
                 */
                partitionedTestTitles = partition(testTitles, options.testPartitionSize);

            return _.map(partitionedTestTitles, function (testTitles) {

              // We will have to find a better solution for grep later.
              options.grep = testTitles.join('\|');

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
                grep: options.grep
              };
            });
          });
        }),
        flattenedForks = _.flatten(forks);

    grunt.log.ok('Forking `' + flattenedForks.length + '` subprocesses');

    // If we don't throttle it and just fork 150+ node processes at once,
    // the machine may become sad.
    throttleFork(flattenedForks, options.throttleFactor)
        .then(done)
        .fail(function(err) {
          done(new Error('Forked mocha processes exited with status codes: ' + err));
        });

  });
};
