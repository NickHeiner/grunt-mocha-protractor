'use strict';

var MochaConstructor = require('mocha'),
    _ = require('lodash');

function getMochaTestTitles(testFiles) {

  var mocha = new MochaConstructor(),
      testTitles = [];

  _.forEach(testFiles, function(file) {
    mocha.addFile(file);
  });

  try {
    mocha.loadFiles();
  } catch(e) {
    // The tests won't work without the protractor globals added,
    // so we will just swallow those errors. All we care about is
    // getting the names of all the tests.
  }

  mocha.suite.eachTest(function(test) {
    testTitles.push(test.fullTitle());
  });

  return testTitles;
}

module.exports = getMochaTestTitles;
