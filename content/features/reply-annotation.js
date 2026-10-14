/**
 * 功能簡介：在階層留言模式中遮蔽內容開頭的 B樓層(用戶名) 回覆樓層標注。
 * 關閉階層留言或此選項時會還原標注顯示。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var ATTRIBUTE = 'data-comment-thread-annotation-hidden';
  var SELECTOR = '.comment_content > a:first-child[href*="Forum.C.openCommentDialog"]';

  function addStyles() {
    if (document.getElementById('comment-thread-reply-annotation-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-reply-annotation-styles';
    style.textContent = 'a[' + ATTRIBUTE + '="true"] { display: none !important; }';
    document.head.appendChild(style);
  }

  function apply(list, enabled) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll(SELECTOR), function (annotation) {
      if (enabled) annotation.setAttribute(ATTRIBUTE, 'true');
      else annotation.removeAttribute(ATTRIBUTE);
    });
  }

  tools.features = tools.features || {};
  tools.features.replyAnnotation = { apply: apply };
})(window, document);
