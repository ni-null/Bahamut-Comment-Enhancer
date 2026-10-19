/**
 * 功能簡介：解析巴哈論壇留言的 DOM 結構、留言 ID 與一或多個回覆父留言 ID，
 * 提供其他功能模組建立階層關係所需的唯讀資料，不直接修改頁面。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  var ITEM_SELECTOR = '.c-reply__item[id^="Commendcontent_"]';
  var LIST_SELECTOR = '[id^="Commendlist_"]';

  function getCommentId(item) {
    return item.id.replace(/^Commendcontent_/, '');
  }

  function uniqueIds(ids) {
    var seen = Object.create(null);
    return ids.filter(function (id) {
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function getParentIds(item) {
    var raw = item.getAttribute('data-comment');
    var ids = [];

    if (raw) {
      try {
        var comment = JSON.parse(raw);
        // ID 在載入舊留言或排序改變後仍保持穩定；一則留言可標記多個樓層。
        var matches = String(comment.content || '').matchAll(/#B\d+:(\d+)#/ig);
        for (var match of matches) ids.push(match[1]);
      } catch (error) {
        // JSON 暫時不完整時，改由頁面中的標註連結嘗試解析。
      }
    }

    if (!ids.length) {
      Array.prototype.forEach.call(item.querySelectorAll('.comment_content a[href*="openCommentDialog"]'), function (link) {
        var match = String(link.getAttribute('href') || '').match(/openCommentDialog\s*\(\s*[^,]+\s*,\s*[^,]+\s*,\s*(\d+)\s*\)/i);
        if (match) ids.push(match[1]);
      });
    }

    var commentId = getCommentId(item);
    return uniqueIds(ids).filter(function (id) { return id !== commentId; });
  }

  function getParentId(item) {
    return getParentIds(item)[0] || null;
  }

  function collectItems(list) {
    return Array.prototype.slice.call(list.querySelectorAll(ITEM_SELECTOR));
  }

  tools.selectors = {
    item: ITEM_SELECTOR,
    list: LIST_SELECTOR
  };
  tools.parser = {
    getCommentId: getCommentId,
    getParentId: getParentId,
    getParentIds: getParentIds,
    collectItems: collectItems
  };
})(window);
