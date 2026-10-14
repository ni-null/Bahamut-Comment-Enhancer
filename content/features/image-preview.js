/**
 * 功能簡介：控制留言內文圖片的縮小預覽與滑鼠懸停展開。
 * 縮小預覽只限制最大尺寸；懸停展開沿用論壇原本圖片的點擊處理方式。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var PREVIEW_ATTRIBUTE = 'data-comment-thread-image-preview';
  var HOVER_ATTRIBUTE = 'data-comment-thread-image-hover';
  var HOVER_HANDLER_KEY = '_commentThreadImageHoverHandler';
  var IMAGE_SELECTOR = '.c-reply__item .comment_content img';
  var HOVER_DELAY_MS = 500;

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

  function enableHover(image) {
    if (image[HOVER_HANDLER_KEY]) return;

    var hoverState = {
      timer: null,
      enter: null,
      leave: null
    };
    hoverState.enter = function () {
      if (hoverState.timer) window.clearTimeout(hoverState.timer);
      hoverState.timer = window.setTimeout(function () {
        hoverState.timer = null;
        if (!image.matches(':hover') || image.getAttribute(HOVER_ATTRIBUTE) !== 'true') return;
        // 以原圖片為事件目標，讓論壇既有的 Photoswipe 或其他 click handler 接手。
        image.click();
      }, HOVER_DELAY_MS);
    };
    hoverState.leave = function () {
      if (!hoverState.timer) return;
      window.clearTimeout(hoverState.timer);
      hoverState.timer = null;
    };
    image[HOVER_HANDLER_KEY] = hoverState;
    image.addEventListener('mouseenter', hoverState.enter);
    image.addEventListener('mouseleave', hoverState.leave);
    image.setAttribute(HOVER_ATTRIBUTE, 'true');
  }

  function disableHover(image) {
    var hoverState = image[HOVER_HANDLER_KEY];
    if (hoverState) {
      if (hoverState.timer) window.clearTimeout(hoverState.timer);
      image.removeEventListener('mouseenter', hoverState.enter);
      image.removeEventListener('mouseleave', hoverState.leave);
    }
    delete image[HOVER_HANDLER_KEY];
    image.removeAttribute(HOVER_ATTRIBUTE);
  }

  function apply(list, isSmallPreviewEnabled, isHoverPreviewEnabled) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll(IMAGE_SELECTOR), function (image) {
      if (isSmallPreviewEnabled) image.setAttribute(PREVIEW_ATTRIBUTE, 'small');
      else image.removeAttribute(PREVIEW_ATTRIBUTE);

      if (isHoverPreviewEnabled) enableHover(image);
      else disableHover(image);
    });
  }

  tools.features = tools.features || {};
  tools.features.imagePreview = {
    apply: apply
  };
})(window, document);
