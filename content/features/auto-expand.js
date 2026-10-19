/**
 * 功能簡介：留言區接近可視範圍時，透過頁面橋接安全呼叫官方 extendComment() 展開較早留言。
 * 處理可視範圍觀察、請求、回應與設定；不模擬 javascript: 連結 click。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var REQUEST_EVENT = 'bahamut-comment-auto-expand-request';
  var RESULT_EVENT = 'bahamut-comment-auto-expand-result';
  var REQUEST_TIMEOUT = 5000;
  var VIEWPORT_MARGIN = '600px 0px 600px 0px';
  var nextRequestId = 0;
  var visibilityObserver = null;

  function getObserveTarget(list) {
    return list.parentElement || list;
  }

  function getVisibilityObserver() {
    if (!('IntersectionObserver' in window)) return null;
    if (visibilityObserver) return visibilityObserver;

    visibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var target = entry.target;
        var list = target._commentThreadAutoExpandList;
        visibilityObserver.unobserve(target);
        delete target._commentThreadAutoExpandList;
        if (!list || !list.isConnected || list._commentThreadAutoExpandDone ||
          list._commentThreadAutoExpandPending) return;

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
      });
    }, {
      root: null,
      rootMargin: VIEWPORT_MARGIN,
      threshold: 0
    });
    return visibilityObserver;
  }

  function stopObservingVisibility(list) {
    var target = list._commentThreadAutoExpandObserveTarget;
    if (!target) return;
    if (visibilityObserver) visibilityObserver.unobserve(target);
    if (target._commentThreadAutoExpandList === list) {
      delete target._commentThreadAutoExpandList;
    }
    delete list._commentThreadAutoExpandObserveTarget;
  }

  function observeWhenNearViewport(list) {
    var observer = getVisibilityObserver();
    if (!observer) return false;

    var target = getObserveTarget(list);
    if (list._commentThreadAutoExpandObserveTarget === target) return true;
    stopObservingVisibility(list);
    target._commentThreadAutoExpandList = list;
    list._commentThreadAutoExpandObserveTarget = target;
    observer.observe(target);
    return true;
  }

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
      stopObservingVisibility(list);
      clearPendingRequest(list);
      delete list._commentThreadAutoExpandDone;
      return;
    }
    if (list._commentThreadAutoExpandDone || list._commentThreadAutoExpandPending) return;

    if (observeWhenNearViewport(list)) return;

    // 舊版瀏覽器沒有 IntersectionObserver 時，安全退回立即展開。
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
