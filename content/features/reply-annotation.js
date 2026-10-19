/**
 * 功能簡介：在階層留言模式中遮蔽內容開頭所有連續的 B樓層(用戶名) 回覆樓層標注。
 * 關閉階層留言或此選項時會還原標注顯示。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var ATTRIBUTE = 'data-comment-thread-annotation-hidden';
  var CONTENT_SELECTOR = '.comment_content';
  var ANNOTATION_SELECTOR = 'a[href*="Forum.C.openCommentDialog"]';

  function isFloorAnnotation(node) {
    return node.matches(ANNOTATION_SELECTOR) && /^B\d+(?:\s*[（(]|$)/i.test(node.textContent.trim());
  }

  function addStyles() {
    if (document.getElementById('comment-thread-reply-annotation-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-reply-annotation-styles';
    style.textContent = 'a[' + ATTRIBUTE + '="true"] { display: none !important; }';
    document.head.appendChild(style);
  }

  function apply(list, enabled) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll('a[' + ATTRIBUTE + '="true"]'), function (annotation) {
      annotation.removeAttribute(ATTRIBUTE);
    });
    if (!enabled) return;

    Array.prototype.forEach.call(list.querySelectorAll(CONTENT_SELECTOR), function (content) {
      var canHide = true;
      Array.prototype.forEach.call(content.childNodes, function (node) {
        if (!canHide) return;
        if (node.nodeType === 3 && !node.textContent.trim()) return;
        if (node.nodeType === 1 && isFloorAnnotation(node)) {
          node.setAttribute(ATTRIBUTE, 'true');
          return;
        }
        canHide = false;
      });
    });
  }

  tools.features = tools.features || {};
  tools.features.replyAnnotation = { apply: apply };
})(window, document);
