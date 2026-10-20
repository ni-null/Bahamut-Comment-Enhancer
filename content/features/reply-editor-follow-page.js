/**
 * 功能簡介：在頁面 MAIN world 將鏡像回覆框的 Enter 轉送到官方原始 textarea。
 * 此檔只負責跨世界事件橋接，讓論壇既有 jQuery keypress handler 可在原始執行環境觸發。
 */
(function (window, document) {
  'use strict';

  var REQUEST_EVENT = 'bahamut-comment-reply-keypress-request';

  function findSourceTextarea(token) {
    return Array.prototype.find.call(document.querySelectorAll('textarea[data-comment-thread-reply-source-token]'), function (textarea) {
      var editor = textarea.closest('.c-reply__editor');
      var host = editor && editor.parentElement;
      // 鏡像 editor 位於留言 footer 內；只允許 .c-post__footer.c-reply 的直屬官方 editor。
      var isOfficialEditor = host && host.classList.contains('c-post__footer') && host.classList.contains('c-reply');
      return isOfficialEditor && textarea.getAttribute('data-comment-thread-reply-source-token') === token;
    }) || null;
  }

  function createKeypressEvent(request) {
    var event = new KeyboardEvent('keypress', {
      bubbles: true,
      cancelable: true,
      key: request.key || 'Enter',
      code: request.code || 'Enter',
      location: request.location || 0,
      ctrlKey: Boolean(request.ctrlKey),
      altKey: Boolean(request.altKey),
      shiftKey: Boolean(request.shiftKey),
      metaKey: Boolean(request.metaKey),
      repeat: Boolean(request.repeat)
    });
    ['keyCode', 'which', 'charCode'].forEach(function (property) {
      try {
        Object.defineProperty(event, property, { value: 13 });
      } catch (error) {
        // 無法覆寫唯讀屬性時，論壇仍可使用 event.key 判斷。
      }
    });
    return event;
  }

  document.addEventListener(REQUEST_EVENT, function (event) {
    try {
      var request = JSON.parse(event.detail || '{}');
      if (!request.sourceToken) return;
      var textarea = findSourceTextarea(request.sourceToken);
      if (!textarea) return;
      textarea.dispatchEvent(createKeypressEvent(request));
    } catch (error) {
      // 官方頁面結構或事件處理異常時，不讓橋接影響既有頁面功能。
    }
  });
})(window, document);
