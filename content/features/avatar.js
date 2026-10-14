/**
 * 功能簡介：控制留言頭像的顯示方式與圓形／方形樣式。
 * 僅處理留言項目中的頭像，不會影響留言輸入區等其他頭像。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var MODE_ATTRIBUTE = 'data-comment-thread-avatar-mode';
  var SHAPE_ATTRIBUTE = 'data-comment-thread-avatar-shape';
  var AVATAR_SELECTOR = '.c-reply__item > div > a.reply-avatar.user--sm';

  function addStyles() {
    if (document.getElementById('comment-thread-avatar-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-avatar-styles';
    style.textContent = [
      'a.reply-avatar.user--sm[' + MODE_ATTRIBUTE + '="small"] {',
      '  width: 20px !important;',
      '  height: 20px !important;',
      '  min-width: 20px !important;',
      '  min-height: 20px !important;',
      '  overflow: hidden;',
      '}',
      'a.reply-avatar.user--sm[' + MODE_ATTRIBUTE + '="small"] > img {',
      '  width: 20px !important;',
      '  height: 20px !important;',
      '}',
      'a.reply-avatar.user--sm[' + MODE_ATTRIBUTE + '="none"] { display: none !important; }',
      'a.reply-avatar.user--sm[' + SHAPE_ATTRIBUTE + '="round"],',
      'a.reply-avatar.user--sm[' + SHAPE_ATTRIBUTE + '="round"] > img { border-radius: 50% !important; }',
      'a.reply-avatar.user--sm[' + SHAPE_ATTRIBUTE + '="square"],',
      'a.reply-avatar.user--sm[' + SHAPE_ATTRIBUTE + '="square"] > img { border-radius: 0 !important; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function apply(list, mode, shape) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll(AVATAR_SELECTOR), function (avatar) {
      if (mode === 'small' || mode === 'none') avatar.setAttribute(MODE_ATTRIBUTE, mode);
      else avatar.removeAttribute(MODE_ATTRIBUTE);
      avatar.setAttribute(SHAPE_ATTRIBUTE, shape === 'square' ? 'square' : 'round');
    });
  }

  tools.features = tools.features || {};
  tools.features.avatar = {
    apply: apply,
    modes: ['default', 'small', 'none'],
    shapes: ['round', 'square']
  };
})(window, document);
