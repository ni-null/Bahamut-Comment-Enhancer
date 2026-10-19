/**
 * 功能簡介：將平面留言重組為最多三層的階層留言，並提供攤平還原功能。
 * 會保留原站留言本體結構，避免影響每筆留言右側的原生操作按鈕。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var parser = tools.parser;
  var sorting = tools.features.sorting;
  var CHILDREN_CLASS = 'comment-thread-children';
  var HIDE_SEPARATOR_ATTRIBUTE = 'data-comment-thread-hide-separators';
  var MAX_DEPTH = 3;

  function addStyles() {
    if (document.getElementById('comment-threading-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-threading-styles';
    style.textContent = [
      '.' + CHILDREN_CLASS + ' {',
      '  display: block;',
      '  clear: both;',
      '  margin: 8px 0 0 36px;',
      '  padding-left: 12px;',
      '  border-left: 2px solid rgba(125, 125, 125, .28);',
      '}',
      '[' + HIDE_SEPARATOR_ATTRIBUTE + '="true"] .' + CHILDREN_CLASS + ' { border-left-color: transparent; }',
      '.' + CHILDREN_CLASS + ' > .c-reply__item { margin-top: 8px; }',
      '@media (max-width: 600px) {',
      '  .' + CHILDREN_CLASS + ' { margin-left: 18px; padding-left: 8px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeEmptyContainers(list) {
    Array.prototype.slice.call(list.querySelectorAll('.' + CHILDREN_CLASS)).forEach(function (container) {
      if (!container.querySelector(tools.selectors.item)) container.remove();
    });
  }

  function flatten(list) {
    var editor = list.querySelector(':scope > .c-reply__editor');
    Array.prototype.slice.call(list.querySelectorAll('[data-comment-thread-copy="true"]')).forEach(function (copy) {
      copy.remove();
    });
    parser.collectItems(list).forEach(function (item) {
      list.insertBefore(item, editor || null);
      delete item.dataset.threadDepth;
      delete item.dataset.threadParent;
      item.removeAttribute('data-thread-truncated');
    });
    removeEmptyContainers(list);
    list.removeAttribute(HIDE_SEPARATOR_ATTRIBUTE);
  }

  function apply(list, sortMode, showSeparators) {
    addStyles();
    var items = parser.collectItems(list);
    var editor = list.querySelector(':scope > .c-reply__editor');
    var byId = Object.create(null);
    var records = items.map(function (item, index) {
      var record = {
        id: parser.getCommentId(item),
        item: item,
        index: index,
        parentIds: parser.getParentIds(item),
        parentId: null,
        depth: null
      };
      byId[record.id] = record;
      return record;
    });

    records.forEach(function (record) {
      record.parentId = record.parentIds.find(function (parentId) {
        return Boolean(byId[parentId]);
      }) || record.parentIds[0] || null;
    });

    flatten(list);
    if (showSeparators === false) list.setAttribute(HIDE_SEPARATOR_ATTRIBUTE, 'true');

    function getDepth(record, visiting) {
      if (record.depth !== null) return record.depth;
      if (!record.parentId || !byId[record.parentId] || visiting[record.id]) {
        record.depth = 1;
        return record.depth;
      }
      visiting[record.id] = true;
      record.depth = getDepth(byId[record.parentId], visiting) + 1;
      delete visiting[record.id];
      return record.depth;
    }

    function getVisualParent(record, parentId) {
      if (!parentId || !byId[parentId]) return null;

      var parent = byId[parentId];
      var ancestors = Object.create(null);
      ancestors[record.id] = true;
      for (var cursor = parent; cursor; cursor = cursor.parentId ? byId[cursor.parentId] : null) {
        if (ancestors[cursor.id]) return null;
        ancestors[cursor.id] = true;
      }
      while (parent && getDepth(parent, Object.create(null)) >= MAX_DEPTH) {
        parent = parent.parentId ? byId[parent.parentId] : null;
      }
      return parent || null;
    }

    function createThreadCopy(record, parent, depth) {
      var copy = record.item.cloneNode(true);
      copy.removeAttribute('id');
      copy.setAttribute('data-comment-thread-copy', 'true');
      copy.dataset.threadDepth = String(depth);
      copy.dataset.threadParent = parent.id;
      copy.removeAttribute('data-thread-truncated');
      getChildrenContainer(parent).appendChild(copy);
    }

    function getChildrenContainer(parent) {
      var container = parent.item.nextElementSibling;
      if (!container || !container.classList.contains(CHILDREN_CLASS)) {
        container = document.createElement('div');
        container.className = CHILDREN_CLASS;
        parent.item.insertAdjacentElement('afterend', container);
      }
      return container;
    }

    var compareRecords = sorting.createComparator(records, byId, sortMode || 'default', true);
    records.slice().sort(function (left, right) {
      var difference = getDepth(left, Object.create(null)) - getDepth(right, Object.create(null));
      return difference || compareRecords(left, right);
    }).forEach(function (record) {
      var actualDepth = getDepth(record, Object.create(null));
      var parent = getVisualParent(record, record.parentId);
      record.item.dataset.threadDepth = String(parent ? Math.min(actualDepth, MAX_DEPTH) : 1);
      record.item.dataset.threadParent = record.parentIds.join(',');
      record.item.toggleAttribute('data-thread-truncated', actualDepth > MAX_DEPTH);
      if (parent) getChildrenContainer(parent).appendChild(record.item);
      else list.insertBefore(record.item, editor || null);

      var copiedParents = Object.create(null);
      if (parent) copiedParents[parent.id] = true;
      record.parentIds.forEach(function (parentId) {
        if (parentId === record.parentId) return;
        var copyParent = getVisualParent(record, parentId);
        if (!copyParent || copiedParents[copyParent.id]) return;
        copiedParents[copyParent.id] = true;
        createThreadCopy(record, copyParent, Math.min(getDepth(copyParent, Object.create(null)) + 1, MAX_DEPTH));
      });
    });
  }

  tools.features = tools.features || {};
  tools.features.threading = {
    apply: apply,
    flatten: flatten,
    maxDepth: MAX_DEPTH
  };
})(window, document);
