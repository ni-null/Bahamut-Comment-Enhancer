/**
 * 功能簡介：滑鼠懸停留言頭像時，以同尺寸的樓層數字覆蓋頭像圖片。
 * 不移動 footer 的原始樓層元素；也會將舊版樓層徽章還原至 footer。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var HOST_ATTRIBUTE = 'data-comment-thread-floor-hover-host';
  var LEGACY_MOVED_ATTRIBUTE = 'data-comment-thread-floor-avatar';
  var LEGACY_HOST_ATTRIBUTE = 'data-comment-thread-floor-avatar-host';
  var LABEL_CLASS = 'comment-thread-avatar-floor-label';
  var AVATAR_SELECTOR = ':scope > div > a.reply-avatar.user--sm';

  function addStyles() {
    if (document.getElementById('comment-thread-floor-hover-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-floor-hover-styles';
    style.textContent = [
      'a.reply-avatar.user--sm[' + HOST_ATTRIBUTE + '] { position: relative !important; }',
      'a.reply-avatar.user--sm[' + HOST_ATTRIBUTE + '] > img { transition: opacity .15s ease; }',
      'a.reply-avatar.user--sm[' + HOST_ATTRIBUTE + '] > .' + LABEL_CLASS + ' {',
      '  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;',
      '  padding: 0 2px; border-radius: inherit; background: #117e96; color: #fff;',
      '  font-size: 10px; font-weight: 600; line-height: 1; opacity: 0; pointer-events: none;',
      '  transition: opacity .15s ease; white-space: nowrap;',
      '}',
      'a.reply-avatar.user--sm[' + HOST_ATTRIBUTE + ']:hover > img { opacity: 0; }',
      'a.reply-avatar.user--sm[' + HOST_ATTRIBUTE + ']:hover > .' + LABEL_CLASS + ' { opacity: 1; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function restoreLegacyFloor(item) {
    var floor = item.querySelector('[' + LEGACY_MOVED_ATTRIBUTE + ']');
    if (!floor) return;

    var footer = item.querySelector('.reply-content__footer');
    var placeholder = footer && Array.prototype.find.call(footer.childNodes, function (node) {
      return node.nodeType === Node.COMMENT_NODE && node.data === 'comment-thread-floor-avatar';
    });
    if (placeholder) placeholder.replaceWith(floor);
    else if (footer) footer.insertBefore(floor, footer.firstChild);

    floor.removeAttribute(LEGACY_MOVED_ATTRIBUTE);
    var avatar = item.querySelector(AVATAR_SELECTOR);
    if (avatar) avatar.removeAttribute(LEGACY_HOST_ATTRIBUTE);
  }

  function removeLabel(item) {
    var avatar = item.querySelector(AVATAR_SELECTOR);
    if (!avatar) return;
    avatar.removeAttribute(HOST_ATTRIBUTE);
    var label = avatar.querySelector(':scope > .' + LABEL_CLASS);
    if (label) label.remove();
  }

  function applyItem(item, enabled) {
    restoreLegacyFloor(item);
    if (!enabled) {
      removeLabel(item);
      return;
    }

    var footer = item.querySelector('.reply-content__footer');
    var floor = footer && footer.querySelector(':scope > [name="comment_floor"]');
    var avatar = item.querySelector(AVATAR_SELECTOR);
    if (!floor || !avatar) return;

    var label = avatar.querySelector(':scope > .' + LABEL_CLASS);
    if (!label) {
      label = document.createElement('span');
      label.className = LABEL_CLASS;
      label.setAttribute('aria-hidden', 'true');
      avatar.appendChild(label);
    }
    label.textContent = floor.textContent.trim();
    avatar.setAttribute(HOST_ATTRIBUTE, 'true');
  }

  function apply(list, enabled) {
    addStyles();
    tools.parser.collectItems(list).forEach(function (item) {
      applyItem(item, enabled);
    });
  }

  tools.features = tools.features || {};
  tools.features.floorAvatar = { apply: apply };
})(window, document);
