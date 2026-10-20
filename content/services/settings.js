/**
 * 功能簡介：集中管理擴充功能的預設設定與本機儲存讀寫。
 * 新增或修改設定 schema 時，應只在此模組處理驗證、預設值與儲存容錯。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  var STORAGE_KEY = 'commentThreadSettings';
  var RECOMMENDED_SETTINGS_PATH = 'content/config/recommended-settings.json';
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
    replyEditorFollowEnabled: false,
    replyAnnotationPreviewEnabled: false,
    quickMarkerButtonsEnabled: false,
    reactionInlineEnabled: false,
    floorAtAvatarEnabled: false,
    hideReplyAnnotation: false,
    autoExpandCommentsEnabled: false,
    hideHotTagEnabled: false,
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
      replyEditorFollowEnabled: value && typeof value.replyEditorFollowEnabled === 'boolean'
        ? value.replyEditorFollowEnabled
        : DEFAULTS.replyEditorFollowEnabled,
      replyAnnotationPreviewEnabled: value && typeof value.replyAnnotationPreviewEnabled === 'boolean'
        ? value.replyAnnotationPreviewEnabled
        : DEFAULTS.replyAnnotationPreviewEnabled,
      quickMarkerButtonsEnabled: value && typeof value.quickMarkerButtonsEnabled === 'boolean'
        ? value.quickMarkerButtonsEnabled
        : DEFAULTS.quickMarkerButtonsEnabled,
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

  function normalizeRecommended(value) {
    return {
      title: value && typeof value.title === 'string' ? value.title : '推薦設定',
      description: value && typeof value.description === 'string' ? value.description : '',
      settings: normalize(value && value.settings)
    };
  }

  function loadRecommended(callback) {
    if (tools.recommendedSettingsDefinition) {
      callback(normalizeRecommended(tools.recommendedSettingsDefinition));
      return;
    }
    if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.getURL === 'function') {
      try {
        window.fetch(window.chrome.runtime.getURL(RECOMMENDED_SETTINGS_PATH))
          .then(function (response) {
            if (!response.ok) throw new Error('無法讀取推薦設定檔。');
            return response.json();
          })
          .then(function (definition) { callback(normalizeRecommended(definition)); })
          .catch(function () { callback(normalizeRecommended()); });
        return;
      } catch (error) {
        // 無法讀取設定檔時，使用 schema 預設值，避免阻礙主功能載入。
      }
    }
    callback(normalizeRecommended());
  }

  tools.settings = {
    defaults: DEFAULTS,
    normalize: normalize,
    load: load,
    loadRecommended: loadRecommended,
    save: save
  };
})(window);
