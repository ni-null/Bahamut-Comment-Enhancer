/**
 * 功能簡介：使用者點擊官方「回覆」後，在該留言 footer 下方建立官方編輯器的鏡像介面。
 * 原始編輯器保持原樣；文字雙向同步，鏡像控制項轉送至原始控制項，關閉時只移除鏡像。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var MIRROR_CLASS = 'comment-thread-reply-editor-mirror';
  var STYLE_ID = 'comment-thread-reply-editor-follow-styles';
  var SOURCE_SYNC_INTERVAL = 100;
  var PAGE_KEYPRESS_REQUEST_EVENT = 'bahamut-comment-reply-keypress-request';
  var states = new WeakMap();
  var clickListenerInstalled = false;
  var sourceSequence = 0;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.' + MIRROR_CLASS + ' { clear: both; width: 100%; margin-top: 8px; }',
      '.' + MIRROR_CLASS + ' textarea { overflow-y: hidden; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getDirectEditor(host) {
    return Array.prototype.find.call(host.children, function (child) {
      return child.classList && child.classList.contains('c-reply__editor');
    }) || null;
  }

  function getFooter(item) {
    var content = item.querySelector(':scope > div > .reply-content');
    return content && content.querySelector(':scope > .reply-content__footer');
  }

  function getTextarea(editor) {
    return editor && editor.querySelector('textarea');
  }

  function removeIds(element) {
    if (element.hasAttribute('id')) element.removeAttribute('id');
    Array.prototype.forEach.call(element.querySelectorAll('[id]'), function (child) {
      child.removeAttribute('id');
    });
  }

  function syncControls(source, mirror) {
    // 標記強化會在原始 editor 動態加入搜尋欄位；textarea 必須獨立同步，
    // 不可再依所有表單控制項的索引配對，否則欄位數不同時會錯位。
    var sourceTextarea = getTextarea(source);
    var mirrorTextarea = getTextarea(mirror);
    if (sourceTextarea && mirrorTextarea) mirrorTextarea.value = sourceTextarea.value;

    var sourceControls = source.querySelectorAll('input, select');
    var mirrorControls = mirror.querySelectorAll('input, select');
    Array.prototype.forEach.call(mirrorControls, function (control, index) {
      var original = sourceControls[index];
      if (!original) return;
      if ('checked' in control) control.checked = original.checked;
      if ('value' in control) control.value = original.value;
    });
  }

  function resizeMirrorTextarea(textarea) {
    if (!textarea) return;
    // 先清除既有高度取得正確 scrollHeight，再依內容撐高；不影響官方底部輸入框。
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 20) + 'px';
  }

  function forwardControlClick(state, mirrorControl) {
    var mirrorControls = Array.prototype.slice.call(state.mirror.querySelectorAll('button, a, input, select'));
    var sourceControls = state.source.querySelectorAll('button, a, input, select');
    var index = mirrorControls.indexOf(mirrorControl);
    var sourceControl = index === -1 ? null : sourceControls[index];
    if (sourceControl) {
      var href = sourceControl.getAttribute && sourceControl.getAttribute('href');
      if (sourceControl.tagName === 'A' && /^\s*javascript:/i.test(href || '')) {
        // 轉送事件給論壇既有 listener，但取消 javascript: URL 的預設導向；
        // 直接呼叫 .click() 會被網站 CSP 視為執行 inline JavaScript 而封鎖。
        var preventJavascriptNavigation = function (event) { event.preventDefault(); };
        sourceControl.addEventListener('click', preventJavascriptNavigation, true);
        sourceControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        sourceControl.removeEventListener('click', preventJavascriptNavigation, true);
      } else if (typeof sourceControl.click === 'function') {
        sourceControl.click();
      }
    }
    window.requestAnimationFrame(function () {
      if (state.mirror && state.source) syncControls(state.source, state.mirror);
    });
  }

  function syncFromSource(state, force) {
    var sourceTextarea = getTextarea(state && state.source);
    var mirrorTextarea = getTextarea(state && state.mirror);
    if (!sourceTextarea || !mirrorTextarea) return;
    if (!force && state.lastSourceValue === sourceTextarea.value) return;

    state.lastSourceValue = sourceTextarea.value;
    syncControls(state.source, state.mirror);
    resizeMirrorTextarea(mirrorTextarea);
    // 讓鏡像的標記預覽立即重繪；同步旗標避免回寫到底部 editor 形成迴圈。
    state.isSyncing = true;
    mirrorTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    state.isSyncing = false;
    // 官方可能直接指定 textarea.value 而不派送 input；這裡也要檢查目標標記是否已被移除。
    if (state.marker && sourceTextarea.value.indexOf(state.marker) === -1) removeMirror(state);
  }

  function startSourceSync(state) {
    if (!state || state.syncTimer) return;
    state.lastSourceValue = getTextarea(state.source) ? getTextarea(state.source).value : '';
    // 僅在鏡像存在時監聽，處理論壇直接寫入 value 而未觸發 input 的情況。
    state.syncTimer = window.setInterval(function () { syncFromSource(state, false); }, SOURCE_SYNC_INTERVAL);
  }

  function requestPageKeypress(state, event) {
    if (!state || !state.sourceToken) return;
    document.dispatchEvent(new CustomEvent(PAGE_KEYPRESS_REQUEST_EVENT, {
      detail: JSON.stringify({
        sourceToken: state.sourceToken,
        key: event.key,
        code: event.code,
        location: event.location,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        repeat: event.repeat
      })
    }));
  }

  function bindMirror(state) {
    var sourceTextarea = getTextarea(state.source);
    var mirrorTextarea = getTextarea(state.mirror);
    if (sourceTextarea && mirrorTextarea) {
      if (state.sourceInputHandler) sourceTextarea.removeEventListener('input', state.sourceInputHandler);
      state.sourceInputHandler = function () {
        syncFromSource(state, true);
      };
      sourceTextarea.addEventListener('input', state.sourceInputHandler);
      mirrorTextarea.addEventListener('input', function () {
        if (state.isSyncing) return;
        resizeMirrorTextarea(mirrorTextarea);
        sourceTextarea.value = mirrorTextarea.value;
        sourceTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
      mirrorTextarea.addEventListener('keypress', function (event) {
        // 論壇的 initCommentInput() 正是在 keypress 用 which/keyCode === 13 呼叫 G() 送出。
        var keyCode = event.which || event.keyCode || (event.key === 'Enter' ? 13 : 0);
        if (keyCode !== 13 || event.isComposing) return;
        sourceTextarea.value = mirrorTextarea.value;
        sourceTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        requestPageKeypress(state, event);
        // 與官方 handler 相同：Enter 一律不在 textarea 內插入換行。
        event.preventDefault();
      });
    }

    state.mirror.addEventListener('click', function (event) {
      var control = event.target && event.target.closest && event.target.closest('button, a, input, select');
      if (!control) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      forwardControlClick(state, control);
    }, true);
  }

  function removeMirror(state) {
    if (!state) return;
    var sourceTextarea = getTextarea(state.source);
    if (sourceTextarea && state.sourceToken &&
      sourceTextarea.getAttribute('data-comment-thread-reply-source-token') === state.sourceToken) {
      sourceTextarea.removeAttribute('data-comment-thread-reply-source-token');
    }
    if (sourceTextarea && state.sourceInputHandler) {
      sourceTextarea.removeEventListener('input', state.sourceInputHandler);
    }
    state.sourceInputHandler = null;
    state.sourceToken = '';
    if (state.syncTimer) window.clearInterval(state.syncTimer);
    state.syncTimer = null;
    state.lastSourceValue = null;
    if (state.mirror) state.mirror.remove();
    state.mirror = null;
    state.targetItem = null;
    state.marker = '';
  }

  function focusMirror(state) {
    var sourceTextarea = getTextarea(state.source);
    var mirrorTextarea = getTextarea(state.mirror);
    if (!sourceTextarea || !mirrorTextarea) return;
    var start = sourceTextarea.selectionStart;
    var end = sourceTextarea.selectionEnd;
    try {
      mirrorTextarea.focus({ preventScroll: true });
    } catch (error) {
      mirrorTextarea.focus();
    }
    if (Number.isInteger(start) && Number.isInteger(end)) {
      mirrorTextarea.setSelectionRange(start, end);
    }
  }

  function restoreScrollPosition(position) {
    if (!position) return;
    window.scrollTo(position.x, position.y);
  }

  function setCurrentReplyMarker(source, marker) {
    var textarea = getTextarea(source);
    if (!textarea || !marker) return;
    textarea.value = marker + ' ';
    // 官方回覆函式已完成後才同步，使論壇內部編輯器狀態與顯示文字一致。
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function createMirror(state, item, token, scrollPosition, marker) {
    if (!state || state.token !== token || !states.has(state.host)) return;
    var source = getDirectEditor(state.host);
    var footer = getFooter(item);
    if (!source || !footer) return;

    removeMirror(state);
    state.source = source;
    state.marker = marker;
    state.sourceToken = 'reply-source-' + Date.now() + '-' + (++sourceSequence);
    var sourceTextarea = getTextarea(source);
    if (sourceTextarea) sourceTextarea.setAttribute('data-comment-thread-reply-source-token', state.sourceToken);
    setCurrentReplyMarker(source, marker);

    var wrapper = document.createElement('div');
    wrapper.className = MIRROR_CLASS;
    var mirror = source.cloneNode(true);
    removeIds(mirror);
    // source token 僅供 MAIN world 定位官方原始 textarea，不能隨 clone 複製到鏡像。
    Array.prototype.forEach.call(mirror.querySelectorAll('[data-comment-thread-reply-source-token]'), function (element) {
      element.removeAttribute('data-comment-thread-reply-source-token');
    });
    wrapper.appendChild(mirror);
    footer.appendChild(wrapper);

    state.mirror = wrapper;
    state.targetItem = item;
    syncControls(source, wrapper);
    resizeMirrorTextarea(getTextarea(wrapper));
    bindMirror(state);
    startSourceSync(state);
    focusMirror(state);
    // 官方回覆流程會定位到原始 editor；鏡像模式維持使用者原本正在閱讀的位置。
    restoreScrollPosition(scrollPosition);
    window.setTimeout(function () {
      restoreScrollPosition(scrollPosition);
    }, 80);
  }

  function scheduleMirror(host, item, scrollPosition, marker) {
    var state = states.get(host);
    if (!state || !item) return;
    state.token += 1;
    var token = state.token;
    window.requestAnimationFrame(function () {
      createMirror(state, item, token, scrollPosition, marker);
    });
  }

  function getReplyMarker(button) {
    var match = String(button.getAttribute('onclick') || '').match(
      /Forum\.C\.replyToFloor\s*\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
    );
    return match ? '#B' + match[2] + ':' + match[1] + '#' : '';
  }

  function installClickListener() {
    if (clickListenerInstalled) return;
    clickListenerInstalled = true;
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest && event.target.closest('button.tag');
      if (!button || !/Forum\.C\.replyToFloor\s*\(/.test(button.getAttribute('onclick') || '')) return;
      var host = button.closest('.c-post__footer.c-reply');
      var item = button.closest(tools.selectors.item);
      if (!host || !item || !states.has(host)) return;
      // 捕獲階段可避開官方事件停止冒泡；下一幀讓 inline onclick 先完成後再正規化標記。
      scheduleMirror(host, item, { x: window.scrollX, y: window.scrollY }, getReplyMarker(button));
    }, true);
  }

  function apply(list, enabled) {
    var host = list && list.parentElement;
    if (!host) return;
    var state = states.get(host);
    if (!enabled) {
      removeMirror(state);
      states.delete(host);
      return;
    }

    addStyles();
    if (!state) {
      state = {
        host: host,
        source: null,
        mirror: null,
        targetItem: null,
        marker: '',
        sourceInputHandler: null,
        sourceToken: '',
        isSyncing: false,
        syncTimer: null,
        lastSourceValue: null,
        token: 0
      };
      states.set(host, state);
    }
    installClickListener();
  }

  function dismiss(host) {
    // 供其他獨立留言操作取消目前鏡像，並同時停止同步計時器與事件監聽。
    var state = states.get(host);
    if (state) removeMirror(state);
  }

  tools.features = tools.features || {};
  tools.features.replyEditorFollow = { apply: apply, dismiss: dismiss };
})(window, document);
