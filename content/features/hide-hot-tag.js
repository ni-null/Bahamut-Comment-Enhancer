/**
 * 功能簡介：依設定隱藏官方留言上的 HOT 標籤，不改動原始留言內容。
 * 關閉功能時只移除擴充功能標記，官方標籤會立即恢復顯示。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var ATTRIBUTE = 'data-comment-thread-hot-hidden';
  var HOT_TAG_SELECTOR = '.comment_hot-tag';

  function addStyles() {
    if (document.getElementById('comment-thread-hide-hot-tag-styles')) return;
    var style = document.createElement('style');
    style.id = 'comment-thread-hide-hot-tag-styles';
    style.textContent = '[' + ATTRIBUTE + '="true"] { display: none !important; }';
    document.head.appendChild(style);
  }

  function apply(list, enabled) {
    if (!list) return;
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll(HOT_TAG_SELECTOR), function (tag) {
      if (enabled) tag.setAttribute(ATTRIBUTE, 'true');
      else tag.removeAttribute(ATTRIBUTE);
    });
  }

  tools.features = tools.features || {};
  tools.features.hideHotTag = { apply: apply };
})(window, document);
