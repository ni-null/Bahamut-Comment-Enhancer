/**
 * 功能簡介：集中管理擴充功能的預設設定與本機儲存讀寫。
 * 新增或修改設定 schema 時，應只在此模組處理驗證、預設值與儲存容錯。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  var STORAGE_KEY = 'commentThreadSettings';
  var DEFAULTS = Object.freeze({
    threadingEnabled: false,
    showThreadSeparators: true,
    userNameAtBottomEnabled: false,
    avatarDisplay: 'default',
    avatarShape: 'round',
    imageSmallPreviewEnabled: false,
    imageHoverPreviewEnabled: false,
    timeDisplay: 'default',
    footerInteractionCollapseEnabled: false,
    reactionInlineEnabled: false,
    floorAtAvatarEnabled: false,
    hideReplyAnnotation: false,
    autoExpandCommentsEnabled: false,
    commentSortMode: 'default'
  });

  function normalize(value) {
    return {
      threadingEnabled: value && typeof value.threadingEnabled === 'boolean'
        ? value.threadingEnabled
        : DEFAULTS.threadingEnabled,
      showThreadSeparators: value && typeof value.showThreadSeparators === 'boolean'
        ? value.showThreadSeparators
        : DEFAULTS.showThreadSeparators,
      userNameAtBottomEnabled: value && typeof value.userNameAtBottomEnabled === 'boolean'
        ? value.userNameAtBottomEnabled
        : DEFAULTS.userNameAtBottomEnabled,
      avatarDisplay: value && ['default', 'small', 'none'].indexOf(value.avatarDisplay) !== -1
        ? value.avatarDisplay
        : DEFAULTS.avatarDisplay,
      avatarShape: value && ['round', 'square'].indexOf(value.avatarShape) !== -1
        ? value.avatarShape
        : DEFAULTS.avatarShape,
      imageSmallPreviewEnabled: value && typeof value.imageSmallPreviewEnabled === 'boolean'
        ? value.imageSmallPreviewEnabled
        : DEFAULTS.imageSmallPreviewEnabled,
      imageHoverPreviewEnabled: value && typeof value.imageHoverPreviewEnabled === 'boolean'
        ? value.imageHoverPreviewEnabled
        : DEFAULTS.imageHoverPreviewEnabled,
      timeDisplay: value && ['default', 'relative'].indexOf(value.timeDisplay) !== -1
        ? value.timeDisplay
        : DEFAULTS.timeDisplay,
      footerInteractionCollapseEnabled: value && typeof value.footerInteractionCollapseEnabled === 'boolean'
        ? value.footerInteractionCollapseEnabled
        : DEFAULTS.footerInteractionCollapseEnabled,
      reactionInlineEnabled: value && typeof value.reactionInlineEnabled === 'boolean'
        ? value.reactionInlineEnabled
        : DEFAULTS.reactionInlineEnabled,
      floorAtAvatarEnabled: value && typeof value.floorAtAvatarEnabled === 'boolean'
        ? value.floorAtAvatarEnabled
        : DEFAULTS.floorAtAvatarEnabled,
      hideReplyAnnotation: value && typeof value.hideReplyAnnotation === 'boolean'
        ? value.hideReplyAnnotation
        : DEFAULTS.hideReplyAnnotation,
      autoExpandCommentsEnabled: value && typeof value.autoExpandCommentsEnabled === 'boolean'
        ? value.autoExpandCommentsEnabled
        : DEFAULTS.autoExpandCommentsEnabled,
      commentSortMode: value && ['default', 'hot'].indexOf(value.commentSortMode) !== -1
        ? value.commentSortMode
        : DEFAULTS.commentSortMode
    };
  }

  function hasExtensionStorage() {
    return Boolean(window.chrome && window.chrome.storage && window.chrome.storage.local);
  }

  function hasUserscriptStorage() {
    return typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
  }

  function load(callback) {
    if (hasExtensionStorage()) {
      try {
        window.chrome.storage.local.get(STORAGE_KEY, function (stored) {
          if (window.chrome.runtime && window.chrome.runtime.lastError) {
            callback(normalize());
            return;
          }
          callback(normalize(stored && stored[STORAGE_KEY]));
        });
        return;
      } catch (error) {
        callback(normalize());
        return;
      }
    }
    if (hasUserscriptStorage()) {
      try {
        callback(normalize(GM_getValue(STORAGE_KEY, null)));
        return;
      } catch (error) {
        // 使用者腳本儲存空間不可用時，安全退回預設值。
      }
    }
    callback(normalize());
  }

  function save(settings) {
    var normalized = normalize(settings);
    if (hasExtensionStorage()) {
      try {
        window.chrome.storage.local.set({ [STORAGE_KEY]: normalized });
        return;
      } catch (error) {
        // A failed write must not prevent the current page from using its state.
      }
    }
    if (hasUserscriptStorage()) {
      try {
        GM_setValue(STORAGE_KEY, normalized);
      } catch (error) {
        // A failed write must not prevent the current page from using its state.
      }
    }
  }

  tools.settings = {
    defaults: DEFAULTS,
    normalize: normalize,
    load: load,
    save: save
  };
})(window);
