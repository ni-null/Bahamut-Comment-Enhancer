/**
 * 功能簡介：使用者點擊官方「回覆」後，在該留言 footer 下方建立官方編輯器的鏡像介面。
 * 原始編輯器保持原樣；文字雙向同步，鏡像控制項轉送至原始控制項，關閉時只移除鏡像。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var MIRROR_ATTRIBUTE = 'data-comment-thread-reply-editor-mirror';
  var MIRROR_CLASS = 'comment-thread-reply-editor-mirror';
  var STYLE_ID = 'comment-thread-reply-editor-follow-styles';
  var states = new WeakMap();
  var clickListenerInstalled = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.' + MIRROR_CLASS + ' { clear: both; width: 100%; margin-top: 8px; }';
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
    var sourceControls = source.querySelectorAll('input, textarea, select');
    var mirrorControls = mirror.querySelectorAll('input, textarea, select');
    Array.prototype.forEach.call(mirrorControls, function (control, index) {
      var original = sourceControls[index];
      if (!original) return;
      if ('checked' in control) control.checked = original.checked;
      if ('value' in control) control.value = original.value;
    });
  }

  function forwardControlClick(state, mirrorControl) {
    var mirrorControls = Array.prototype.slice.call(state.mirror.querySelectorAll('button, a, input, select'));
    var sourceControls = state.source.querySelectorAll('button, a, input, select');
    var index = mirrorControls.indexOf(mirrorControl);
    var sourceControl = index === -1 ? null : sourceControls[index];
    if (sourceControl && typeof sourceControl.click === 'function') sourceControl.click();
    window.requestAnimationFrame(function () {
      if (state.mirror && state.source) syncControls(state.source, state.mirror);
    });
  }

  function bindMirror(state) {
    var sourceTextarea = getTextarea(state.source);
    var mirrorTextarea = getTextarea(state.mirror);
    if (sourceTextarea && mirrorTextarea) {
      sourceTextarea.addEventListener('input', function () {
        mirrorTextarea.value = sourceTextarea.value;
      });
      mirrorTextarea.addEventListener('input', function () {
        sourceTextarea.value = mirrorTextarea.value;
        sourceTextarea.dispatchEvent(new Event('input', { bubbles: true }));
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
    if (state.mirror) state.mirror.remove();
    state.mirror = null;
    state.targetItem = null;
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
    setCurrentReplyMarker(source, marker);

    var wrapper = document.createElement('div');
    wrapper.className = MIRROR_CLASS;
    var mirror = source.cloneNode(true);
    mirror.setAttribute(MIRROR_ATTRIBUTE, 'true');
    removeIds(mirror);
    wrapper.appendChild(mirror);
    footer.appendChild(wrapper);

    state.mirror = wrapper;
    state.targetItem = item;
    syncControls(source, wrapper);
    bindMirror(state);
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
      state = { host: host, source: null, mirror: null, targetItem: null, token: 0 };
      states.set(host, state);
    }
    installClickListener();
  }

  tools.features = tools.features || {};
  tools.features.replyEditorFollow = { apply: apply };
})(window, document);
