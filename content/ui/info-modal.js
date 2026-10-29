/**
 * 功能簡介：建立「巴哈留言優化工具」的開發資訊與功能介紹 Modal。
 * 此模組只管理彈窗內容、樣式與開關，不處理留言功能或設定狀態。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  tools.ui = tools.ui || {};
  var modal = null;
  var trigger = null;

  function addStyles() {
    if (document.getElementById('comment-thread-info-modal-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-info-modal-styles';
    style.textContent = [
      '.comment-thread-info-modal {',
      '  position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; padding: 16px;',
      '}',
      '.comment-thread-info-modal[hidden] { display: none; }',
      '.comment-thread-info-modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); }',
      '.comment-thread-info-modal__dialog {',
      '  position: relative; width: min(360px, 100%); padding: 18px; border: 1px solid rgba(127,127,127,.45);',
      '  border-radius: 8px; background: Canvas; color: CanvasText; box-shadow: 0 12px 36px rgba(0,0,0,.3);',
      '}',
      '.comment-thread-info-modal__close {',
      '  position: absolute; top: 7px; right: 7px; display: inline-flex; align-items: center; justify-content: center;',
      '  width: 30px; height: 30px; border: 0; border-radius: 4px; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.comment-thread-info-modal__close:hover, .comment-thread-info-modal__close:focus-visible {',
      '  background: rgba(17,126,150,.1); color: #117e96; outline: none;',
      '}',
      '.comment-thread-info-modal__dialog h2 { margin: 0 36px 8px 0; color: #117e96; font-size: 1.1em; }',
      '.comment-thread-info-modal__dialog h3 { margin: 10px 0 3px; color: #117e96; font-size: .95em; }',
      '.comment-thread-info-modal__dialog p { margin: 0; font-size: .92em; line-height: 1.6; }',
      '.comment-thread-info-modal__dialog p + p { margin-top: 4px; }',
      '.comment-thread-info-modal__dialog a { color: #117e96; overflow-wrap: anywhere; }',
      '.comment-thread-info-modal__dialog ul { margin: 3px 0 0; padding-left: 18px; font-size: .9em; line-height: 1.6; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function close() {
    if (!modal) return;
    modal.hidden = true;
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
    trigger = null;
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  }

  function createHeading(level, text) {
    return createElement(level, '', text);
  }

  function getModal() {
    if (modal) return modal;

    addStyles();
    var version = tools.version || (window.chrome && window.chrome.runtime && window.chrome.runtime.getManifest
      ? window.chrome.runtime.getManifest().version
      : '—');
    modal = document.createElement('div');
    modal.className = 'comment-thread-info-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'comment-thread-info-modal-title');
    var backdrop = createElement('div', 'comment-thread-info-modal__backdrop');
    var dialog = createElement('section', 'comment-thread-info-modal__dialog');
    var closeButton = createElement('button', 'comment-thread-info-modal__close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', '關閉開發者資訊');
    closeButton.title = '關閉';
    var closeIcon = createElement('i', 'material-icons', 'close');
    closeIcon.setAttribute('aria-hidden', 'true');
    closeButton.appendChild(closeIcon);

    var title = createHeading('h2', '巴哈留言優化工具');
    title.id = 'comment-thread-info-modal-title';
    var versionText = createElement('p', '', '版本：' + version + '・瀏覽器擴充功能／Userscript');
    var projectHeading = createHeading('h3', '專案');
    var developer = createElement('p', '', '開發者：ninull');
    var project = createElement('p', '', '專案網址：');
    var projectLink = createElement('a', '', 'github.com/ni-null/Bahamut-Comment-Enhancer');
    projectLink.href = 'https://github.com/ni-null/Bahamut-Comment-Enhancer';
    projectLink.target = '_blank';
    projectLink.rel = 'noopener noreferrer';
    project.appendChild(projectLink);
    var introductionHeading = createHeading('h3', '介紹');
    var introduction = createElement('p', '', '支援預設、區塊化與 GNN 留言主題，並提供階層留言、收合討論串、熱門排序、自動展開、回覆框跟隨、標記優化、頭像與時間顯示調整，以及圖片預覽、圖片燈箱與 YouTube 燈箱播放。功能僅在巴哈姆特 C.php、Co.php 頁面運作。');
    var privacy = createElement('p', '', '本項目開源，無廣告，無營利，無追蹤統計資料回傳，所有處理都在本地電腦完成。');

    dialog.appendChild(closeButton);
    dialog.appendChild(title);
    dialog.appendChild(versionText);
    dialog.appendChild(projectHeading);
    dialog.appendChild(developer);
    dialog.appendChild(project);
    dialog.appendChild(introductionHeading);
    dialog.appendChild(introduction);
    dialog.appendChild(privacy);
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    // 資訊視窗位於主選單 DOM 外；阻止其點擊冒泡到主選單外部關閉監聽器。
    modal.addEventListener('click', function (event) {
      event.stopPropagation();
    });
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
    (document.body || document.documentElement).appendChild(modal);
    return modal;
  }

  function open(nextTrigger) {
    trigger = nextTrigger || null;
    var dialog = getModal();
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    dialog.hidden = false;
    dialog.querySelector('.comment-thread-info-modal__close').focus();
  }

  tools.ui.infoModal = {
    open: open,
    close: close
  };
})(window, document);
