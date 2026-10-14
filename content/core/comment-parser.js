/**
 * 功能簡介：解析巴哈論壇留言的 DOM 結構、留言 ID 與回覆父留言 ID，
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

  function getParentId(item) {
    var raw = item.getAttribute('data-comment');
    if (!raw) return null;

    try {
      var comment = JSON.parse(raw);
      // IDs remain stable when the site loads older comments or changes sort.
      var match = String(comment.content || '').match(/#B\d+:(\d+)#/i);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
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
    collectItems: collectItems
  };
})(window);
