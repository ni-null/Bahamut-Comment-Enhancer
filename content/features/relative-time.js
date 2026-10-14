/**
 * 功能簡介：切換留言 footer 的預設日期與相對時間，例如「3 小時前」。
 * 原始顯示文字會保留在資料屬性中，關閉功能時可完整還原。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var ORIGINAL_TIME_ATTRIBUTE = 'data-comment-thread-original-time';
  var TIME_SELECTOR = '.c-reply__item .reply-content__footer .edittime[data-tippy-content*="留言時間"]';

  function parseTime(element) {
    var source = element.getAttribute('data-tippy-content') || '';
    var match = source.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(
      Number(match[1]), Number(match[2]) - 1, Number(match[3]),
      Number(match[4]), Number(match[5]), Number(match[6])
    );
  }

  function formatRelativeTime(date) {
    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return '剛剛';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' 分鐘前';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' 小時前';
    if (seconds < 2592000) return Math.floor(seconds / 86400) + ' 天前';
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + ' 個月前';
    return Math.floor(seconds / 31536000) + ' 年前';
  }

  function apply(list, mode) {
    Array.prototype.forEach.call(list.querySelectorAll(TIME_SELECTOR), function (element) {
      if (!element.hasAttribute(ORIGINAL_TIME_ATTRIBUTE)) {
        element.setAttribute(ORIGINAL_TIME_ATTRIBUTE, element.textContent);
      }
      if (mode === 'relative') {
        var date = parseTime(element);
        if (date && !Number.isNaN(date.getTime())) element.textContent = formatRelativeTime(date);
      } else {
        element.textContent = element.getAttribute(ORIGINAL_TIME_ATTRIBUTE);
        element.removeAttribute(ORIGINAL_TIME_ATTRIBUTE);
      }
    });
  }

  tools.features = tools.features || {};
  tools.features.relativeTime = { apply: apply };
})(window);
