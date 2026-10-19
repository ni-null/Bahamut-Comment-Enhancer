/**
 * 功能簡介：要求頁面主世界直接呼叫官方 extendComment() 展開較早留言，不模擬 javascript: 連結 click。
 * 參數、橋接回應與逾時都會安全處理；完成後不呼叫 foldedComment()，保留使用者手動收合權限。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var REQUEST_EVENT = 'bahamut-comment-auto-expand-request';
  var RESULT_EVENT = 'bahamut-comment-auto-expand-result';
  var REQUEST_TIMEOUT = 5000;
  var nextRequestId = 0;

  function findExpandControl(list) {
    var host = list.parentElement;
    if (!host) return null;
    var header = Array.prototype.find.call(host.children, function (child) {
      return child.matches('.c-reply__head');
    });
    if (!header) return null;
    return header.querySelector('a.more-reply[id^="showoldCommend_"]') ||
      header.querySelector('a[id^="showoldCommend_"]');
  }

  function getExtendParams(control) {
    var match = String(control.getAttribute('onclick') || '')
      .match(/extendComment\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (!match) return null;
    return { bsn: Number(match[1]), snB: Number(match[2]) };
  }

  function clearPendingRequest(list) {
    var pending = list._commentThreadAutoExpandPending;
    if (!pending) return;
    document.removeEventListener(RESULT_EVENT, pending.onResult);
    window.clearTimeout(pending.timeoutId);
    delete list._commentThreadAutoExpandPending;
  }

  function reportError(message) {
    if (window.console && typeof window.console.warn === 'function') {
      window.console.warn('[巴哈留言優化工具] ' + message);
    }
  }

  function requestExpand(list, params) {
    var requestId = 'auto-expand-' + Date.now() + '-' + (++nextRequestId);
    var pending = {};
    pending.onResult = function (event) {
      var result;
      try {
        result = JSON.parse(event.detail || '{}');
      } catch (error) {
        return;
      }
      if (result.requestId !== requestId) return;
      clearPendingRequest(list);
      list._commentThreadAutoExpandDone = true;
      if (!result.success) reportError(result.message || '官方展開留言方法執行失敗。');
    };
    pending.timeoutId = window.setTimeout(function () {
      if (list._commentThreadAutoExpandPending !== pending) return;
      clearPendingRequest(list);
      list._commentThreadAutoExpandDone = true;
      reportError('等待官方展開留言方法回應逾時，已停止自動展開。');
    }, REQUEST_TIMEOUT);
    list._commentThreadAutoExpandPending = pending;
    document.addEventListener(RESULT_EVENT, pending.onResult);

    try {
      document.dispatchEvent(new CustomEvent(REQUEST_EVENT, {
        detail: JSON.stringify({ requestId: requestId, bsn: params.bsn, snB: params.snB })
      }));
    } catch (error) {
      clearPendingRequest(list);
      list._commentThreadAutoExpandDone = true;
      reportError('無法要求官方展開留言方法：' + error.message);
    }
  }

  function apply(list, enabled) {
    if (!enabled) {
      clearPendingRequest(list);
      delete list._commentThreadAutoExpandDone;
      return;
    }
    if (list._commentThreadAutoExpandDone || list._commentThreadAutoExpandPending) return;
    var control = findExpandControl(list);
    if (!control) {
      list._commentThreadAutoExpandDone = true;
      return;
    }
    var params = getExtendParams(control);
    if (!params) {
      list._commentThreadAutoExpandDone = true;
      reportError('無法解析官方 extendComment() 的留言參數。');
      return;
    }
    requestExpand(list, params);
  }

  tools.features = tools.features || {};
  tools.features.autoExpand = { apply: apply };
})(window, document);
