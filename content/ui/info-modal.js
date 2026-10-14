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

  function getModal() {
    if (modal) return modal;

    addStyles();
    var version = window.chrome && chrome.runtime && chrome.runtime.getManifest
      ? chrome.runtime.getManifest().version
      : '—';
    modal = document.createElement('div');
    modal.className = 'comment-thread-info-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'comment-thread-info-modal-title');
    modal.innerHTML = [
      '<div class="comment-thread-info-modal__backdrop"></div>',
      '<section class="comment-thread-info-modal__dialog">',
      '<button type="button" class="comment-thread-info-modal__close" aria-label="關閉開發者資訊" title="關閉">',
      '<i class="material-icons" aria-hidden="true">close</i></button>',
      '<h2 id="comment-thread-info-modal-title">巴哈留言優化工具</h2>',
      '<p>版本：' + version + '・Chrome Manifest V3</p>',
      '<h3>介紹</h3>',
      '<p>提供階層留言、熱門排序與多種留言顯示優化，僅在巴哈 C.php、Co.php 頁面運作。</p>',
      '<p>本項目開源，無廣告，無營利，無追蹤統計資料回傳，所有處理都在本地電腦完成。</p>',
      '</section>'
    ].join('');
    modal.querySelector('.comment-thread-info-modal__close').addEventListener('click', close);
    modal.querySelector('.comment-thread-info-modal__backdrop').addEventListener('click', close);
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
