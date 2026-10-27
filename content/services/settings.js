/**
 * 功能簡介：集中管理擴充功能的預設設定與本機儲存讀寫。
 * 新增或修改設定 schema 時，應只在此模組處理驗證、預設值與儲存容錯。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  var STORAGE_KEY = 'commentThreadSettings';
  var LEGACY_COMMENT_STYLE_NAMES = Object.freeze({ modern: 'block' });
  var DEFAULTS = Object.freeze({
    threadingEnabled: false,
    showThreadSeparators: true,
    collapseThreadingEnabled: false,
    userNameAtBottomEnabled: false,
    avatarDisplay: 'default',
    avatarShape: 'round',
    imageSmallPreviewEnabled: false,
    imageLightboxEnabled: true,
    youtubeLightboxEnabled: true,
    commentAreaHeightMode: 'unlimited',
    commentAreaCustomHeight: 600,
    timeDisplay: 'default',
    footerInteractionCollapseEnabled: false,
    replyEditorFollowEnabled: false,
    markerEnhancementEnabled: false,
    reactionInlineEnabled: false,
    floorAtAvatarEnabled: false,
    hideReplyAnnotation: false,
    autoExpandCommentsEnabled: false,
    hideHotTagEnabled: false,
    commentStyle: 'default',
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
      collapseThreadingEnabled: value && typeof value.collapseThreadingEnabled === 'boolean'
        ? value.collapseThreadingEnabled
        : DEFAULTS.collapseThreadingEnabled,
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
      imageLightboxEnabled: value && typeof value.imageLightboxEnabled === 'boolean'
        ? value.imageLightboxEnabled
        : DEFAULTS.imageLightboxEnabled,
      youtubeLightboxEnabled: value && typeof value.youtubeLightboxEnabled === 'boolean'
        ? value.youtubeLightboxEnabled
        : DEFAULTS.youtubeLightboxEnabled,
      commentAreaHeightMode: value && ['unlimited', 'compact', 'large', 'custom'].indexOf(value.commentAreaHeightMode) !== -1
        ? value.commentAreaHeightMode
        : DEFAULTS.commentAreaHeightMode,
      commentAreaCustomHeight: value && Number.isFinite(value.commentAreaCustomHeight)
        ? Math.max(120, Math.min(5000, Math.round(value.commentAreaCustomHeight)))
        : DEFAULTS.commentAreaCustomHeight,
      timeDisplay: value && ['default', 'full', 'relative'].indexOf(value.timeDisplay) !== -1
        ? value.timeDisplay
        : DEFAULTS.timeDisplay,
      footerInteractionCollapseEnabled: value && typeof value.footerInteractionCollapseEnabled === 'boolean'
        ? value.footerInteractionCollapseEnabled
        : DEFAULTS.footerInteractionCollapseEnabled,
      replyEditorFollowEnabled: value && typeof value.replyEditorFollowEnabled === 'boolean'
        ? value.replyEditorFollowEnabled
        : DEFAULTS.replyEditorFollowEnabled,
      markerEnhancementEnabled: value && typeof value.markerEnhancementEnabled === 'boolean'
        ? value.markerEnhancementEnabled
        : Boolean(value && (value.replyAnnotationPreviewEnabled || value.quickMarkerButtonsEnabled)),
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
      hideHotTagEnabled: value && typeof value.hideHotTagEnabled === 'boolean'
        ? value.hideHotTagEnabled
        : DEFAULTS.hideHotTagEnabled,
      commentStyle: value && tools.features.commentStyles && tools.features.commentStyles.has(
        LEGACY_COMMENT_STYLE_NAMES[value.commentStyle] || value.commentStyle
      )
        ? (LEGACY_COMMENT_STYLE_NAMES[value.commentStyle] || value.commentStyle)
        : DEFAULTS.commentStyle,
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
          var savedValue = stored && stored[STORAGE_KEY];
          callback(normalize(savedValue), Boolean(savedValue && typeof savedValue === 'object'));
        });
        return;
      } catch (error) {
        callback(normalize());
        return;
      }
    }
    if (hasUserscriptStorage()) {
      try {
        var savedValue = GM_getValue(STORAGE_KEY, null);
        callback(normalize(savedValue), Boolean(savedValue && typeof savedValue === 'object'));
        return;
      } catch (error) {
        // 使用者腳本儲存空間不可用時，安全退回預設值。
      }
    }
    callback(normalize(), false);
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
