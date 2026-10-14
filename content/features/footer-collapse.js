/**
 * 功能簡介：摺疊整個留言 footer，並允許點擊留言的非互動區切換收合狀態。
 * 推、噓、回覆、連結、頭像、圖片與選單按鈕會保留論壇原有操作。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var STATE_ATTRIBUTE = 'data-comment-thread-footer-collapse';
  var ITEM_COLLAPSED_ATTRIBUTE = 'data-comment-thread-footer-collapsed';
  var LEGACY_BUTTON_CLASS = 'comment-thread-footer-toggle';
  var STYLE_ID = 'comment-thread-footer-collapse-v2-styles';
  var clickHandlers = new WeakMap();

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.reply-content[' + STATE_ATTRIBUTE + '="collapsed"] > .reply-content__footer { display: none !important; }',
      '.reply-content[' + STATE_ATTRIBUTE + '] > article.reply-content__article.c-article { padding-right: 0 !important; }',
      '.c-reply__item[' + ITEM_COLLAPSED_ATTRIBUTE + '="true"] { cursor: pointer; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setCollapsed(item, content, collapsed) {
    content.setAttribute(STATE_ATTRIBUTE, collapsed ? 'collapsed' : 'expanded');
    if (collapsed) item.setAttribute(ITEM_COLLAPSED_ATTRIBUTE, 'true');
    else item.removeAttribute(ITEM_COLLAPSED_ATTRIBUTE);
  }

  function isInteractiveTarget(target) {
    return Boolean(target && target.closest && target.closest(
      'a, button, input, select, textarea, img, [role="button"], [contenteditable="true"]'
    ));
  }

  function addToggleHandler(item, content) {
    if (clickHandlers.has(item)) return;

    var handler = function (event) {
      var isCollapsed = content.getAttribute(STATE_ATTRIBUTE) === 'collapsed';
      if (!isCollapsed && isInteractiveTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setCollapsed(item, content, !isCollapsed);
    };
    clickHandlers.set(item, handler);
    item.addEventListener('click', handler, true);
  }

  function removeToggleHandler(item) {
    var handler = clickHandlers.get(item);
    if (handler) item.removeEventListener('click', handler, true);
    clickHandlers.delete(item);
  }

  function removeLegacyButton(content) {
    var button = content.querySelector(':scope > .' + LEGACY_BUTTON_CLASS);
    if (button) button.remove();
  }

  function applyItem(item, enabled) {
    var content = item.querySelector(':scope > div > .reply-content');
    var footer = content && content.querySelector(':scope > .reply-content__footer');
    if (!content || !footer) return;

    removeLegacyButton(content);
    if (!enabled) {
      content.removeAttribute(STATE_ATTRIBUTE);
      item.removeAttribute(ITEM_COLLAPSED_ATTRIBUTE);
      removeToggleHandler(item);
      return;
    }

    addToggleHandler(item, content);
    if (!content.hasAttribute(STATE_ATTRIBUTE)) setCollapsed(item, content, true);
  }

  function apply(list, enabled) {
    addStyles();
    tools.parser.collectItems(list).forEach(function (item) {
      applyItem(item, enabled);
    });
  }

  tools.features = tools.features || {};
  tools.features.footerCollapse = { apply: apply };
})(window, document);
