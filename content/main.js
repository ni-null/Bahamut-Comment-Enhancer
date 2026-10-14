/**
 * 功能簡介：頁面控制器，負責同步設定、套用各功能模組與監聽 AJAX 新留言。
 * 選單與開發資訊視窗由 content/ui/ 模組獨立管理，本模組不處理其 DOM 細節。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var threading = tools.features.threading;
  var sorting = tools.features.sorting;
  var userNameFooter = tools.features.userNameFooter;
  var avatar = tools.features.avatar;
  var floorAvatar = tools.features.floorAvatar;
  var imagePreview = tools.features.imagePreview;
  var relativeTime = tools.features.relativeTime;
  var footerCollapse = tools.features.footerCollapse;
  var reactionInline = tools.features.reactionInline;
  var replyAnnotation = tools.features.replyAnnotation;
  var controlMenu = tools.ui.controlMenu;
  var structureValidator = tools.structureValidator;
  var storage = tools.settings;
  var state = storage.normalize();
  var relativeTimeTimer = null;

  function reportError(context, error) {
    if (window.console && typeof window.console.warn === 'function') {
      window.console.warn('[巴哈留言優化工具] ' + context, error);
    }
  }

  function needsCommentObserver() {
    return state.threadingEnabled || state.userNameAtBottomEnabled ||
      state.avatarDisplay !== 'default' || state.imageSmallPreviewEnabled ||
      state.imageHoverPreviewEnabled || state.timeDisplay !== 'default' ||
      state.footerInteractionCollapseEnabled || state.floorAtAvatarEnabled ||
      state.reactionInlineEnabled ||
      state.avatarShape !== 'round' || state.commentSortMode !== 'default';
  }

  function syncControls() {
    controlMenu.sync(state);
  }

  function setSetting(name, value) {
    var nextState = Object.assign({}, state);
    nextState[name] = value;
    state = storage.normalize(nextState);
    applySettingsToMountedLists();
    syncRelativeTimeTimer();
    syncControls();
    storage.save(state);
  }

  function applySettingsToMountedLists() {
    Array.prototype.forEach.call(document.querySelectorAll(tools.selectors.list), function (list) {
      if (list.dataset.commentThreadMounted === 'true') applyListState(list);
    });
  }

  function refreshRelativeTimes() {
    Array.prototype.forEach.call(document.querySelectorAll(tools.selectors.list), function (list) {
      if (list.dataset.commentThreadMounted === 'true') relativeTime.apply(list, state.timeDisplay);
    });
  }

  function syncRelativeTimeTimer() {
    if (state.timeDisplay !== 'relative') {
      if (relativeTimeTimer) window.clearInterval(relativeTimeTimer);
      relativeTimeTimer = null;
      return;
    }
    if (!relativeTimeTimer) relativeTimeTimer = window.setInterval(refreshRelativeTimes, 60000);
  }

  function resetSettings() {
    state = storage.normalize(storage.defaults);
    applySettingsToMountedLists();
    syncRelativeTimeTimer();
    syncControls();
    storage.save(state);
  }

  function isNewCommentNode(node) {
    return node.nodeType === 1 &&
      (node.matches(tools.selectors.item) || node.querySelector(tools.selectors.item));
  }

  function observeComments(list) {
    var queued = false;
    var observer = new MutationObserver(function (mutations) {
      if (list.dataset.commentThreadRefreshing === 'true' || queued) return;
      var hasNewComment = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, isNewCommentNode);
      });
      if (!hasNewComment) return;

      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        if (list.isConnected) applyListState(list);
      });
    });
    observer.observe(list, { childList: true, subtree: true });
    return observer;
  }

  function applyListState(list) {
    if (!list || list.dataset.commentThreadRefreshing === 'true') return;

    var observer = list._commentThreadObserver;
    if (observer) observer.disconnect();
    list.dataset.commentThreadRefreshing = 'true';
    try {
      if (state.threadingEnabled) threading.apply(list, state.commentSortMode, state.showThreadSeparators);
      else {
        threading.flatten(list);
        sorting.sortFlat(list, state.commentSortMode);
      }

      if (state.userNameAtBottomEnabled) userNameFooter.apply(list);
      else userNameFooter.restore(list);

      avatar.apply(list, state.avatarDisplay, state.avatarShape);
      floorAvatar.apply(list, state.floorAtAvatarEnabled);
      imagePreview.apply(list, state.imageSmallPreviewEnabled, state.imageHoverPreviewEnabled);
      relativeTime.apply(list, state.timeDisplay);
      footerCollapse.apply(list, state.footerInteractionCollapseEnabled);
      reactionInline.apply(list, state.reactionInlineEnabled);
      replyAnnotation.apply(list, state.threadingEnabled && state.hideReplyAnnotation);
    } catch (error) {
      reportError('套用留言功能時發生錯誤，已停止本次更新。', error);
    } finally {
      delete list.dataset.commentThreadRefreshing;
      if (needsCommentObserver()) {
        if (observer) observer.observe(list, { childList: true, subtree: true });
        else list._commentThreadObserver = observeComments(list);
      } else if (observer) {
        delete list._commentThreadObserver;
      }
    }
  }

  function containsCommentList(node) {
    return node.nodeType === 1 &&
      (node.matches(tools.selectors.list) || node.querySelector(tools.selectors.list));
  }

  function observeListHost(host) {
    if (!host || host._commentThreadHostObserver) return;

    var observer = new MutationObserver(function (mutations) {
      var listWasReplaced = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, containsCommentList) ||
          Array.prototype.some.call(mutation.removedNodes, containsCommentList);
      });
      var structureMayHaveChanged = listWasReplaced || mutations.some(function (mutation) {
        return mutation.type === 'attributes' &&
          (mutation.target === host || mutation.target.parentElement === host);
      });
      if (!structureMayHaveChanged) return;
      Array.prototype.forEach.call(host.querySelectorAll(tools.selectors.list), mount);
    });
    observer.observe(host, {
      childList: true,
      attributes: true,
      subtree: false,
      attributeFilter: ['class', 'id']
    });
    host._commentThreadHostObserver = observer;
  }

  function mount(list) {
    if (!list) return;
    var validation = structureValidator.validateList(list);
    var wasMounted = list.dataset.commentThreadMounted === 'true';
    if (wasMounted && validation.valid) return;
    if (wasMounted) destroy(list);
    if (!validation.host) return;

    try {
      controlMenu.mount(validation.host, {
        getState: function () { return state; },
        onSettingChange: setSetting,
        onReset: resetSettings,
        validation: validation
      });
    } catch (error) {
      reportError('建立設定選單時發生錯誤，已停止注入。', error);
      return;
    }
    observeListHost(validation.host);
    if (!validation.valid) return;

    list.dataset.commentThreadMounted = 'true';
    applyListState(list);
  }

  function destroy(list) {
    if (!list || list.dataset.commentThreadMounted !== 'true') return;
    if (list._commentThreadObserver) list._commentThreadObserver.disconnect();
    delete list._commentThreadObserver;
    threading.flatten(list);
    floorAvatar.apply(list, false);
    userNameFooter.restore(list);
    avatar.apply(list, 'default', 'round');
    imagePreview.apply(list, false, false);
    relativeTime.apply(list, 'default');
    footerCollapse.apply(list, false);
    reactionInline.apply(list, false);
    replyAnnotation.apply(list, false);
    delete list.dataset.commentThreadMounted;
  }

  function init() {
    var lists = document.querySelectorAll(tools.selectors.list);
    Array.prototype.forEach.call(lists, mount);
    if (!lists.length) waitForFirstList();
  }

  function waitForFirstList() {
    if (document._commentThreadDiscoveryObserver) return;
    var observer = new MutationObserver(function (mutations) {
      var hasList = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, containsCommentList);
      });
      if (!hasList) return;

      Array.prototype.forEach.call(document.querySelectorAll(tools.selectors.list), mount);
      observer.disconnect();
      delete document._commentThreadDiscoveryObserver;
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document._commentThreadDiscoveryObserver = observer;
  }

  window.CommentThreadPlugin = {
    mount: mount,
    refresh: applyListState,
    destroy: destroy,
    maxDepth: threading.maxDepth,
    get enabled() { return state.threadingEnabled; },
    setEnabled: function (enabled) { setSetting('threadingEnabled', enabled); },
    get settings() { return Object.assign({}, state); }
  };

  function start() {
    storage.load(function (savedState) {
      state = storage.normalize(savedState);
      init();
      syncRelativeTimeTimer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
