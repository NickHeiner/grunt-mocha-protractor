/*
 * grunt-mocha-protractor
 * https://github.com/noblesamurai/grunt-mocha-protractor
 */

'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('mochaProtractor', 'Run e2e angular tests with webdriver.', function() {

    var _ = require('lodash'),
        path = require('path'),
        fork = require('child_process').fork,
        q = require('q'),

        files = this.files,
        options = this.options({
          browsers: ['Chrome'],
          reporter: 'Spec',
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
        testRunPromises;

    testRunPromises = _.map(options.browsers, function(browser) {
      return _.map(files, function(fileGroup) {
        var preTestFiles = grunt.file.expand({filter: 'isFile'}, options.preTestFiles),
            expandedFiles = grunt.file.expand({filter: 'isFile'}, fileGroup.src);

        return _.map([expandedFiles[0], expandedFiles[15]], function (testFile) {

          console.log('forking for', testFile);

          var filesToRun = preTestFiles.concat([testFile]),
              deferred = q.defer(),
              pathToRunMochaModule = path.join(__dirname, '..', 'lib', 'run-mocha.js'),
              rawArgs = [filesToRun, browser, options],
              serializedArgs = _.map(rawArgs, function (arg) {
                // this will kill grep
                // http://stackoverflow.com/questions/12075927/serialization-of-regexp
                return JSON.stringify(arg);
              }),
              forked = fork(pathToRunMochaModule, serializedArgs);

          forked.on('close', function (code) {
            if (code === 0) {
              deferred.resolve();
              return;
            }

            deferred.reject(code);
          });

          return deferred.promise;
        });
      });
    });

    q.all(_.flatten(testRunPromises))
        .then(done)
        .fail(function(err) {
          done(new Error(err));
        });

//    grunt.util.async.forEachSeries(options.browsers, function(browser, next) {
//      grunt.util.async.forEachSeries(files, function(fileGroup, next) {
//        runner(fileGroup, browser, options, next);
//      }, next);
//    }, this.async());
  });
};
