'use strict';

var _ = require('lodash');

function partition(arr, rawMaxLengthOfEachPair) {

  var maxLengthOfEachPair = rawMaxLengthOfEachPair || 1;

  return _.reduce(arr, function(acc, el, index) {

    var allButLast,
        lastWithEl;

    if (index % maxLengthOfEachPair === 0) {
      return acc.concat([[el]]);
    }

    allButLast = _.first(acc, acc.length - 1);
    lastWithEl = _.last(acc).concat([el]);

    return allButLast.concat([lastWithEl]);

  }, [])
}

module.exports = partition;
