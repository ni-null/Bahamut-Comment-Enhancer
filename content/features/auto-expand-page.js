/**
 * 功能簡介：在頁面主世界安全呼叫官方 extendComment()，供 auto-expand.js 以事件橋接使用。
 * 此檔不處理留言 DOM 或設定；所有官方函式呼叫皆以 try/catch 保護並回傳結果。
 */
(function (window, document) {
  'use strict';

  var REQUEST_EVENT = 'bahamut-comment-auto-expand-request';
  var RESULT_EVENT = 'bahamut-comment-auto-expand-result';
  var pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  function sendResult(requestId, success, message) {
    document.dispatchEvent(new CustomEvent(RESULT_EVENT, {
      detail: JSON.stringify({ requestId: requestId, success: success, message: message || '' })
    }));
  }

  document.addEventListener(REQUEST_EVENT, function (event) {
    var request;
    try {
      request = JSON.parse(event.detail || '{}');
      if (!request.requestId || !Number.isFinite(request.bsn) || !Number.isFinite(request.snB)) {
        throw new Error('展開留言參數格式不正確。');
      }
      if (typeof pageWindow.extendComment !== 'function') {
        throw new Error('找不到論壇官方 extendComment() 方法。');
      }
      pageWindow.extendComment(request.bsn, request.snB);
      sendResult(request.requestId, true);
    } catch (error) {
      sendResult(request && request.requestId, false, error && error.message ? error.message : '呼叫官方展開方法失敗。');
    }
  });
})(window, document);
