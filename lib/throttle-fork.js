'use strict';

var fork = require('child_process').fork,
    q = require('q'),
    _ = require('lodash'),
    os = require('os');

function throttleFork(forks, rawThrottleFactor) {
  var deferred = q.defer(),
      throttleFactor = rawThrottleFactor || 1,
      countMaxActiveForks = Math.floor(os.cpus().length * throttleFactor),
      failureStatusCodes = [],
      activeForks = [],
      pendingForks = forks;

  process.on('exit', function(exitCode) {
    _.forEach(activeForks, function(forked) {
      forked.kill(exitCode);
    });
  });

  function spawnNewFork() {

    var toFork,
        forked;

    if (activeForks.length === countMaxActiveForks || !pendingForks.length) {
      return;
    }

    toFork = pendingForks[0];
    console.log('forking; active forks =', activeForks.length + 1, 'test is ' + toFork.grep);
    forked = fork(toFork.moduleToRun, toFork.args, {
//      silent: true
    });

    toFork.output = '';

    pendingForks = pendingForks.slice(1);
    activeForks.push(forked);

//    forked.stdout.on('data', function (data) {
//      toFork.output += data;
//    });
//
//    forked.stderr.on('data', function(data) {
//      toFork.output += data;
//    });

    function onForkEnd(code) {
      _.pull(activeForks, forked)
      console.log('fork close; active forks =', activeForks.length, ' forks remaining: ' + pendingForks.length);

      console.log(toFork.output);

      if (code !== 0) {
        failureStatusCodes.push(code);
        return;
      } else {
        if (!activeForks.length && !pendingForks.length) {

          if (failureStatusCodes.length) {
            deferred.reject(failureStatusCodes);
          }

          deferred.resolve();

          return;
        }
      }

      spawnNewFork();
    }

    forked.on('exit', onForkEnd);

    spawnNewFork();
  }

  spawnNewFork();

  return deferred.promise;
}

module.exports = throttleFork;
