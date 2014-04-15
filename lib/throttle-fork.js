'use strict';

var fork = require('child_process').fork,
    q = require('q'),
    os = require('os');

function throttleFork(forks) {
  var deferred = q.defer(),
      countMaxActiveForks = os.cpus().length,
      countActiveForks = 0,
      pendingForks = forks;

  function spawnNewForks() {
    while (countActiveForks < countMaxActiveForks && pendingForks.length) {

      var toFork = pendingForks[0],
          forked = fork(toFork.moduleToRun, toFork.args);

      pendingForks = pendingForks.slice(1);
      countActiveForks += 1;

      forked.on('close', function (code) {
        countActiveForks -= 1;

        if (code !== 0) {
          deferred.reject(code);
        } else {
          if (countActiveForks === 0 && !pendingForks.length) {
            deferred.resolve();
          } else {
            spawnNewForks();
          }
        }
      });
    }
  }

  spawnNewForks();

  return deferred.promise;
}

module.exports = throttleFork;
