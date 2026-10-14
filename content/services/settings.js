/**
 * 功能簡介：集中管理擴充功能的預設設定與 chrome.storage.local 讀寫。
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
      commentSortMode: value && ['default', 'hot'].indexOf(value.commentSortMode) !== -1
        ? value.commentSortMode
        : DEFAULTS.commentSortMode
    };
  }

  function hasStorage() {
    return Boolean(window.chrome && chrome.storage && chrome.storage.local);
  }

  function load(callback) {
    if (!hasStorage()) {
      callback(normalize());
      return;
    }

    try {
      chrome.storage.local.get(STORAGE_KEY, function (stored) {
        if (chrome.runtime && chrome.runtime.lastError) {
          callback(normalize());
          return;
        }
        callback(normalize(stored && stored[STORAGE_KEY]));
      });
    } catch (error) {
      callback(normalize());
    }
  }

  function save(settings) {
    if (!hasStorage()) return;
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: normalize(settings) });
    } catch (error) {
      // A failed write must not prevent the current page from using its state.
    }
  }

  tools.settings = {
    defaults: DEFAULTS,
    normalize: normalize,
    load: load,
    save: save
  };
})(window);
