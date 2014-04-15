'use strict';

var fork = require('child_process').fork,
    q = require('q'),
    os = require('os');

function throttleFork(forks) {
  var deferred = q.defer(),
      countMaxActiveForks = os.cpus().length,
      failureStatusCodes = [],
      countActiveForks = 0,
      pendingForks = forks;

  function spawnNewFork() {

    var toFork,
        forked;

    if (countActiveForks === countMaxActiveForks || !pendingForks.length) {
      return;
    }

    toFork = pendingForks[0];
    forked = fork(toFork.moduleToRun, toFork.args, {
      silent: true
    });

    toFork.output = '';

    pendingForks = pendingForks.slice(1);
    countActiveForks += 1;

    forked.stdout.on('data', function (data) {
      toFork.output += data;
    });

    forked.stderr.on('data', function(data) {
      toFork.output += data;
    });

    forked.on('close', function (code) {
      countActiveForks -= 1;

      console.log(toFork.output);

      if (code !== 0) {
        failureStatusCodes.push(code);
        return;
      } else {
        if (countActiveForks === 0 && !pendingForks.length) {

          if (failureStatusCodes.length) {
            deferred.reject(failureStatusCodes);
          }

          deferred.resolve();

          return;
        }
      }

      spawnNewFork();
    });

    spawnNewFork();
  }

  spawnNewFork();

  return deferred.promise;
}

module.exports = throttleFork;
