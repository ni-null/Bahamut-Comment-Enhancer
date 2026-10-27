/**
 * 功能簡介：控制留言內文圖片的縮小預覽。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var PREVIEW_ATTRIBUTE = 'data-comment-thread-image-preview';
  var IMAGE_SELECTOR = '.c-reply__item .comment_content img';

  function addStyles() {
    if (document.getElementById('comment-thread-image-preview-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-image-preview-styles';
    style.textContent = [
      'img[' + PREVIEW_ATTRIBUTE + '="small"] {',
      '  max-width: 28px !important;',
      '  max-height: 28px !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function apply(list, isSmallPreviewEnabled) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll(IMAGE_SELECTOR), function (image) {
      if (isSmallPreviewEnabled) image.setAttribute(PREVIEW_ATTRIBUTE, 'small');
      else image.removeAttribute(PREVIEW_ATTRIBUTE);
    });
  }

  tools.features = tools.features || {};
  tools.features.imagePreview = {
    apply: apply
  };
})(window, document);
