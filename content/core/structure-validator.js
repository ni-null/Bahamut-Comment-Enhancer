/**
 * 功能簡介：驗證巴哈留言區是否符合外掛可安全處理的官方 DOM 結構。
 * 回傳驗證結果與安全容器，不修改頁面，也不處理功能套用或選單顯示。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools;

  function getDirectChild(host, selector) {
    return Array.prototype.find.call(host.children, function (child) {
      return child.matches(selector);
    });
  }

  function validateList(list) {
    var validation = { valid: false, host: null, reason: '' };
    if (!list || list.nodeType !== 1 || !list.matches(tools.selectors.list)) {
      validation.reason = '找不到預期的留言清單。';
      return validation;
    }
    if (!/^Commendlist_\d+$/.test(list.id)) {
      validation.reason = '留言清單 ID 格式不符。';
      return validation;
    }

    var host = list.closest('.c-post__footer.c-reply');
    if (!host) {
      validation.reason = '找不到預期的留言容器。';
      return validation;
    }
    validation.host = host;
    if (list.parentElement !== host) {
      validation.reason = '留言清單不是留言容器的直屬元素。';
      return validation;
    }

    var legacyControlsHeader = getDirectChild(host, '.comment-thread-controls-header');
    var hasExpandedHeader = Boolean(
      getDirectChild(host, '.c-reply__head.nocontent') ||
      (legacyControlsHeader && getDirectChild(legacyControlsHeader, '.c-reply__head.nocontent'))
    );
    var hasReplyEditor = Boolean(getDirectChild(host, '.c-reply__editor'));
    if (!hasExpandedHeader && !hasReplyEditor) {
      validation.reason = '找不到展開留言標頭或留言輸入區。';
      return validation;
    }

    validation.valid = true;
    return validation;
  }

  tools.structureValidator = {
    validateList: validateList
  };
})(window);
