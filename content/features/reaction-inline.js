/**
 * 功能簡介：將留言 footer 的推、推數、噓、噓數移至留言內容右側，保留論壇原有事件。
 * 關閉時會依 placeholder 將原節點放回 buttonbar 的原始位置，不修改回覆按鈕。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var TRAY_CLASS = 'comment-thread-reaction-inline';
  var STATE_ATTRIBUTE = 'data-comment-thread-reaction-inline';
  var STYLE_ID = 'comment-thread-reaction-inline-styles';
  var origins = new WeakMap();

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.reply-content[' + STATE_ATTRIBUTE + '="true"] { position: relative; padding-right: 76px !important; }',
      '.reply-content > .' + TRAY_CLASS + ' {',
      '  position: absolute; top: 1px; right: 0; display: inline-flex; align-items: center;',
      '  min-height: 24px; white-space: nowrap; z-index: 2;',
      '}',
      '.reply-content > .' + TRAY_CLASS + ' > button,',
      '.reply-content > .' + TRAY_CLASS + ' > a { flex: 0 0 auto; }',
      '.reply-content > .' + TRAY_CLASS + ' > button {',
      '  border: none !important; outline: none; background: #ffffff00 !important;',
      '}',
      '.reply-content > .' + TRAY_CLASS + ' > button > .material-icons { font-size: 12px; color: #a6a6a6; }',
      '.reply-content > .' + TRAY_CLASS + ' > a.gp-count,',
      '.reply-content > .' + TRAY_CLASS + ' > a.bp-count { display: inline-block !important; font-size: 10px; }',
      '.reply-content > .' + TRAY_CLASS + ' > button.gp.is-highlight,',
      '.reply-content > .' + TRAY_CLASS + ' > a.gp-count.is-highlight { color: #FF8B2C; }',
      '.reply-content > .' + TRAY_CLASS + ' > button.gp.is-highlight > .material-icons { color: #FF8B2C; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getReactionControls(buttonbar) {
    return Array.prototype.filter.call(buttonbar.children, function (element) {
      return element.matches('button.gp, a.gp-count, button.bp, a.bp-count');
    });
  }

  function restoreItem(content) {
    var tray = content.querySelector(':scope > .' + TRAY_CLASS);
    if (!tray) {
      content.removeAttribute(STATE_ATTRIBUTE);
      return;
    }

    Array.prototype.slice.call(tray.children).forEach(function (control) {
      var placeholder = origins.get(control);
      if (placeholder && placeholder.parentNode) placeholder.replaceWith(control);
      origins.delete(control);
    });
    tray.remove();
    content.removeAttribute(STATE_ATTRIBUTE);
  }

  function applyItem(item, enabled) {
    var content = item.querySelector(':scope > div > .reply-content');
    if (!content) return;
    if (!enabled) {
      restoreItem(content);
      return;
    }
    if (content.querySelector(':scope > .' + TRAY_CLASS)) return;

    var footer = content.querySelector(':scope > .reply-content__footer');
    var buttonbar = footer && footer.querySelector(':scope > .buttonbar');
    if (!buttonbar) return;
    var controls = getReactionControls(buttonbar);
    if (!controls.length) return;

    var tray = document.createElement('span');
    tray.className = TRAY_CLASS;
    tray.setAttribute('aria-label', '推噓操作');
    controls.forEach(function (control) {
      var placeholder = document.createComment('comment-thread-reaction-origin');
      control.parentNode.insertBefore(placeholder, control);
      origins.set(control, placeholder);
      tray.appendChild(control);
    });
    content.appendChild(tray);
    content.setAttribute(STATE_ATTRIBUTE, 'true');
  }

  function apply(list, enabled) {
    addStyles();
    tools.parser.collectItems(list).forEach(function (item) {
      applyItem(item, enabled);
    });
  }

  tools.features = tools.features || {};
  tools.features.reactionInline = { apply: apply };
})(window, document);
