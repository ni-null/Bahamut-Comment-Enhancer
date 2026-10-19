/**
 * 功能簡介：提供原始順序與熱門度的排序比較器。
 * 熱門度會將子留言分支以遞減權重加到父留言，供階層留言維持脈絡地排序。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var CHILD_WEIGHT = 0.6;

  function setOriginalIndex(record) {
    var item = record.item;
    if (!item.hasAttribute('data-comment-thread-original-order')) {
      item.setAttribute('data-comment-thread-original-order', String(record.index));
    }
    record.originalIndex = Number(item.getAttribute('data-comment-thread-original-order'));
  }

  function getLikes(record) {
    var counter = record.item.querySelector('.gp-count[data-gp]');
    var likes = counter && Number(counter.getAttribute('data-gp'));
    return Number.isFinite(likes) ? likes : 0;
  }

  function createComparator(records, byId, mode, useChildWeights) {
    var children = Object.create(null);
    var scores = Object.create(null);
    records.forEach(function (record) {
      setOriginalIndex(record);
      record.likes = getLikes(record);
      var parentIds = record.parentIds || (record.parentId ? [record.parentId] : []);
      if (useChildWeights) {
        parentIds.forEach(function (parentId) {
          if (byId[parentId]) {
            (children[parentId] || (children[parentId] = [])).push(record);
          }
        });
      }
    });

    function getHotScore(record, visiting) {
      if (scores[record.id] !== undefined) return scores[record.id];
      if (visiting[record.id]) return 0;

      visiting[record.id] = true;
      var score = record.likes;
      (children[record.id] || []).forEach(function (child) {
        score += getHotScore(child, visiting) * CHILD_WEIGHT;
      });
      delete visiting[record.id];
      scores[record.id] = score;
      return score;
    }

    if (mode === 'hot' && useChildWeights) {
      records.forEach(function (record) {
        record.hotScore = getHotScore(record, Object.create(null));
      });
    } else if (mode === 'hot') {
      records.forEach(function (record) {
        record.hotScore = record.likes;
      });
    }

    return function (left, right) {
      if (mode === 'hot' && right.hotScore !== left.hotScore) {
        return right.hotScore - left.hotScore;
      }
      return left.originalIndex - right.originalIndex;
    };
  }

  function sortFlat(list, mode) {
    var parser = tools.parser;
    var editor = list.querySelector(':scope > .c-reply__editor');
    var byId = Object.create(null);
    var records = parser.collectItems(list).map(function (item, index) {
      var record = { id: parser.getCommentId(item), item: item, index: index, parentId: null };
      byId[record.id] = record;
      return record;
    });
    var compare = createComparator(records, byId, mode, false);
    records.sort(compare).forEach(function (record) {
      list.insertBefore(record.item, editor || null);
    });
  }

  tools.features = tools.features || {};
  tools.features.sorting = {
    childWeight: CHILD_WEIGHT,
    createComparator: createComparator,
    sortFlat: sortFlat
  };
})(window);
