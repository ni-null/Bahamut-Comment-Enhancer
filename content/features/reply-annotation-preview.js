/**
 * 功能簡介：強化官方編輯器的 #B樓層:留言ID# 標記，提供預覽、逐一刪除與清除全部標記。
 * 不修改官方輸入框結構或回覆流程；只以 input 事件同步 textarea 內容。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var PREVIEW_CLASS = 'comment-thread-reply-marker-preview';
  var FLOOR_MARKER_CLASS = PREVIEW_CLASS + '__floor-add';
  var STYLE_ID = 'comment-thread-reply-marker-preview-styles';
  var states = new WeakMap();
  var textareaHandlers = new WeakMap();
  var floorHandlers = new WeakMap();
  var replyClickListenerInstalled = false;
  var editorRestoreListenerInstalled = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.' + PREVIEW_CLASS + ' { display:flex; flex-wrap:wrap; align-items:center; gap:5px; margin-top:6px; font-size:12px; line-height:1.4; }',
      '.' + PREVIEW_CLASS + '__title { color:#777; }',
      '.' + PREVIEW_CLASS + '__tag { position:relative; display:inline-flex; align-items:center; gap:3px; padding:2px 3px 2px 6px; border:1px solid rgba(17,126,150,.35); border-radius:999px; background:rgba(17,126,150,.08); color:#117e96; }',
      '.' + PREVIEW_CLASS + '__tag-avatar { width:16px; height:16px; border-radius:50%; object-fit:cover; }',
      '.' + PREVIEW_CLASS + '__tag-tooltip { position:absolute; z-index:20; left:0; bottom:calc(100% + 6px); width:max-content; max-width:min(360px,80vw); padding:6px 8px; border-radius:5px; background:rgba(28,42,46,.96); color:#fff; box-shadow:0 2px 10px rgba(0,0,0,.2); font-size:12px; line-height:1.45; white-space:normal; pointer-events:none; visibility:hidden; opacity:0; }',
      '.' + PREVIEW_CLASS + '__tag:hover > .' + PREVIEW_CLASS + '__tag-tooltip,.' + PREVIEW_CLASS + '__tag:focus-within > .' + PREVIEW_CLASS + '__tag-tooltip { visibility:visible; opacity:1; }',
      '.' + PREVIEW_CLASS + '__remove,.' + PREVIEW_CLASS + '__clear { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border:0; padding:0; background:transparent; color:inherit; cursor:pointer; }',
      '.' + PREVIEW_CLASS + '__remove { border-radius:50%; }',
      '.' + PREVIEW_CLASS + '__clear { border-radius:4px; color:#699ea9; }',
      '.' + PREVIEW_CLASS + '__remove:hover,.' + PREVIEW_CLASS + '__remove:focus-visible,.' + PREVIEW_CLASS + '__clear:hover,.' + PREVIEW_CLASS + '__clear:focus-visible { background:rgba(17,126,150,.18); outline:none; }',
      '.' + PREVIEW_CLASS + '__remove > .material-icons { font-size:14px; }',
      '.' + PREVIEW_CLASS + '__clear > .material-icons { font-size:20px; }',
      '.' + FLOOR_MARKER_CLASS + ' { position:relative; border-radius:3px; color:#699ea9; cursor:pointer; }',
      '.' + FLOOR_MARKER_CLASS + ':hover,.' + FLOOR_MARKER_CLASS + ':focus-visible { background:rgba(105,158,169,.14); outline:none; }',
      '.' + FLOOR_MARKER_CLASS + '::after { content:attr(data-comment-thread-marker-tooltip); position:absolute; z-index:20; left:50%; bottom:calc(100% + 5px); transform:translateX(-50%); padding:3px 6px; border-radius:3px; background:rgba(28,42,46,.96); color:#fff; font-size:11px; line-height:1.3; white-space:nowrap; pointer-events:none; visibility:hidden; opacity:0; }',
      '.' + FLOOR_MARKER_CLASS + ':hover::after,.' + FLOOR_MARKER_CLASS + ':focus-visible::after { visibility:visible; opacity:1; }',
      '.' + FLOOR_MARKER_CLASS + '[aria-pressed="true"] { color:#699ea9; font-weight:700; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getMarkers(value) {
    var markers = [], seen = Object.create(null), pattern = /#B(\d+):(\d+)#/ig, match;
    while ((match = pattern.exec(value))) {
      if (seen[match[0]]) continue;
      seen[match[0]] = true;
      markers.push({ raw: match[0], floor: match[1], commentId: match[2] });
    }
    return markers;
  }

  function getMarkerUser(host, marker) {
    var item = host.querySelector('#Commendcontent_' + marker.commentId);
    var user = item && item.querySelector('.reply-content__user');
    var avatar = item && item.querySelector('.reply-avatar img');
    var content = item && item.querySelector('.comment_content');
    return {
      name: user ? user.textContent.trim() : '',
      avatarUrl: avatar && (avatar.currentSrc || avatar.getAttribute('src') || avatar.getAttribute('data-src')),
      content: content ? content.textContent.trim().replace(/\s+/g, ' ') : ''
    };
  }

  function createIcon(name) {
    var icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = name;
    return icon;
  }

  function updateTextarea(textarea, value) {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function stripMarkerWithSpace(value, raw) {
    var index = value.indexOf(raw);
    while (index !== -1) {
      var start = index, end = index + raw.length;
      // 新增標記時固定在尾端補一個空格；移除時優先取回這個空格。
      if (/[ \t]/.test(value.charAt(end))) end += 1;
      else if (start > 0 && /[ \t]/.test(value.charAt(start - 1))) start -= 1;
      value = value.slice(0, start) + value.slice(end);
      index = value.indexOf(raw);
    }
    return value;
  }

  function removeMarker(textarea, raw) {
    var nextValue = stripMarkerWithSpace(textarea.value, raw);
    if (nextValue !== textarea.value) updateTextarea(textarea, nextValue);
  }

  function appendMarkers(textarea, markers, shouldFocus) {
    var nextValue = textarea.value;
    markers.forEach(function (marker) {
      if (nextValue.indexOf(marker.raw) === -1) {
        nextValue += (nextValue && !/\s$/.test(nextValue) ? ' ' : '') + marker.raw + ' ';
      }
    });
    if (nextValue === textarea.value) return;
    updateTextarea(textarea, nextValue);
    if (shouldFocus !== false) {
      textarea.focus();
      textarea.setSelectionRange(nextValue.length, nextValue.length);
    }
  }

  function removeMarkers(textarea, markers, shouldFocus) {
    var nextValue = textarea.value;
    markers.forEach(function (marker) { nextValue = stripMarkerWithSpace(nextValue, marker.raw); });
    if (nextValue === textarea.value) return;
    updateTextarea(textarea, nextValue);
    if (shouldFocus !== false) {
      textarea.focus();
      textarea.setSelectionRange(nextValue.length, nextValue.length);
    }
  }

  function isOfficialEditor(host, editor) { return editor.parentElement === host; }

  function getOfficialEditor(host) {
    return Array.prototype.find.call(host.children, function (child) {
      return child.classList && child.classList.contains('c-reply__editor');
    }) || null;
  }

  function getFloorMarker(floor) {
    var item = floor.closest('.c-reply__item[id^="Commendcontent_"]');
    var floorMatch = floor.textContent.trim().match(/^B(\d+)$/i);
    var commentId = item && item.id.replace(/^Commendcontent_/, '');
    return floorMatch && commentId
      ? { raw: '#B' + floorMatch[1] + ':' + commentId + '#', floor: floorMatch[1], commentId: commentId }
      : null;
  }

  function syncFloorMarkers(host) {
    var editor = getOfficialEditor(host);
    var textarea = editor && editor.querySelector('textarea');
    if (!textarea) return;
    Array.prototype.forEach.call(host.querySelectorAll('.' + FLOOR_MARKER_CLASS), function (floor) {
      var marked = textarea.value.indexOf(floor.dataset.marker || '') !== -1;
      floor.setAttribute('aria-pressed', String(marked));
    });
  }

  function renderFloorMarkers(host) {
    var editor = getOfficialEditor(host);
    var textarea = editor && editor.querySelector('textarea');
    if (!textarea) return;
    Array.prototype.forEach.call(host.querySelectorAll('[name="comment_floor"]'), function (floor) {
      var marker = getFloorMarker(floor);
      if (!marker || floorHandlers.has(floor)) return;
      floor.classList.add(FLOOR_MARKER_CLASS);
      floor.dataset.marker = marker.raw;
      floor.dataset.commentThreadMarkerTooltip = '添加標記';
      floor.dataset.commentThreadMarkerOriginalTitle = floor.getAttribute('title') || '';
      floor.setAttribute('title', '添加標記');
      floor.setAttribute('role', 'button');
      floor.setAttribute('tabindex', '0');
      floor.setAttribute('aria-label', '添加 B' + marker.floor + ' 標記');
      floor.setAttribute('aria-pressed', 'false');
      var addMarker = function (event) {
        event.preventDefault();
        event.stopPropagation();
        // 追加而非取代，可連續選取多位用戶；不聚焦底部輸入框，避免中斷閱讀位置。
        appendMarkers(textarea, [marker], false);
        // 新增額外標記代表不再是單一留言回覆，將官方 editor 還原到底部。
        var replyEditorFollow = tools.features && tools.features.replyEditorFollow;
        if (replyEditorFollow && typeof replyEditorFollow.dismiss === 'function') {
          replyEditorFollow.dismiss(host);
        }
        syncFloorMarkers(host);
      };
      var onKeydown = function (event) {
        if (event.key === 'Enter' || event.key === ' ') addMarker(event);
      };
      floor.addEventListener('click', addMarker);
      floor.addEventListener('keydown', onKeydown);
      floorHandlers.set(floor, { addMarker: addMarker, onKeydown: onKeydown });
    });
    syncFloorMarkers(host);
  }

  function removeFloorMarkers(host) {
    Array.prototype.forEach.call(host.querySelectorAll('.' + FLOOR_MARKER_CLASS), function (floor) {
      var handlers = floorHandlers.get(floor);
      if (handlers) {
        floor.removeEventListener('click', handlers.addMarker);
        floor.removeEventListener('keydown', handlers.onKeydown);
        floorHandlers.delete(floor);
      }
      floor.classList.remove(FLOOR_MARKER_CLASS);
      if (floor.dataset.commentThreadMarkerOriginalTitle) floor.setAttribute('title', floor.dataset.commentThreadMarkerOriginalTitle);
      else floor.removeAttribute('title');
      ['marker', 'commentThreadMarkerTooltip', 'commentThreadMarkerOriginalTitle'].forEach(function (name) { delete floor.dataset[name]; });
      floor.removeAttribute('role');
      floor.removeAttribute('tabindex');
      floor.removeAttribute('aria-label');
      floor.removeAttribute('aria-pressed');
    });
  }

  function renderPreview(host, textarea, preview) {
    var markers = getMarkers(textarea.value);
    preview.replaceChildren();
    preview.hidden = !markers.length;
    if (preview.hidden) return;

    var title = document.createElement('span');
    title.className = PREVIEW_CLASS + '__title';
    title.textContent = '標記：';
    preview.appendChild(title);
    markers.forEach(function (marker) {
      var tag = document.createElement('span');
      tag.className = PREVIEW_CLASS + '__tag';
      var user = getMarkerUser(host, marker);
      if (user.content) {
        var tooltip = 'B' + marker.floor + (user.name ? ' ' + user.name : '') + '：' + user.content;
        tag.setAttribute('aria-label', tooltip);
        var tooltipElement = document.createElement('span');
        tooltipElement.className = PREVIEW_CLASS + '__tag-tooltip';
        tooltipElement.setAttribute('role', 'tooltip');
        tooltipElement.textContent = tooltip;
        tag.appendChild(tooltipElement);
      }
      if (user.avatarUrl) {
        var avatar = document.createElement('img');
        avatar.className = PREVIEW_CLASS + '__tag-avatar';
        avatar.src = user.avatarUrl;
        avatar.alt = '';
        tag.appendChild(avatar);
      }
      tag.appendChild(document.createTextNode('B' + marker.floor + (user.name ? ' ' + user.name : '')));
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = PREVIEW_CLASS + '__remove';
      remove.setAttribute('aria-label', '刪除 B' + marker.floor + ' 的回覆標記');
      remove.title = '刪除回覆標記';
      remove.appendChild(createIcon('close'));
      remove.addEventListener('mousedown', function (event) { event.preventDefault(); });
      remove.addEventListener('click', function () { removeMarker(textarea, marker.raw); });
      tag.appendChild(remove);
      preview.appendChild(tag);
    });

    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = PREVIEW_CLASS + '__clear';
    clear.setAttribute('aria-label', '清除全部回覆標記');
    clear.title = '清除全部回覆標記';
    clear.appendChild(createIcon('delete'));
    clear.addEventListener('mousedown', function (event) { event.preventDefault(); });
    clear.addEventListener('click', function () {
      // 清除標記時不搶走目前閱讀或輸入焦點。
      removeMarkers(textarea, getMarkers(textarea.value), false);
    });
    preview.appendChild(clear);
  }

  function getPreview(editor) {
    var preview = editor.querySelector(':scope > .' + PREVIEW_CLASS);
    if (preview) return preview;
    preview = document.createElement('div');
    preview.className = PREVIEW_CLASS;
    preview.hidden = true;
    editor.appendChild(preview);
    return preview;
  }

  function prepareEditor(host, editor) {
    var textarea = editor.querySelector('textarea');
    if (!textarea) return;
    var preview = getPreview(editor);
    if (!textareaHandlers.has(textarea)) {
      var handler = function () {
        renderPreview(host, textarea, preview);
        syncFloorMarkers(host);
      };
      textarea.addEventListener('input', handler);
      textareaHandlers.set(textarea, handler);
    }
    renderPreview(host, textarea, preview);
  }

  function removePreview(editor) {
    if (!editor) return;
    Array.prototype.forEach.call(editor.querySelectorAll(':scope > .' + PREVIEW_CLASS), function (preview) {
      var textarea = editor.querySelector('textarea');
      var handler = textarea && textareaHandlers.get(textarea);
      if (textarea && handler) textarea.removeEventListener('input', handler);
      if (textarea) textareaHandlers.delete(textarea);
      preview.remove();
    });
  }

  function removePreviews(host) {
    Array.prototype.forEach.call(host.querySelectorAll('.c-reply__editor'), removePreview);
  }

  function refreshHost(host) {
    var state = states.get(host);
    if (!state) return;
    if (state.previewEnabled) {
      Array.prototype.forEach.call(host.querySelectorAll('.c-reply__editor'), function (editor) {
        // 鏡像回覆框只負責輸入與送出；標記管理固定留在官方底部 editor。
        if (isOfficialEditor(host, editor)) prepareEditor(host, editor);
        else removePreview(editor);
      });
    } else removePreviews(host);
    if (state.quickMarkerButtonsEnabled) renderFloorMarkers(host);
    else removeFloorMarkers(host);
  }

  function installReplyClickListener() {
    if (replyClickListenerInstalled) return;
    replyClickListenerInstalled = true;
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest && event.target.closest('button.tag');
      if (!button || !/Forum\.C\.replyToFloor\s*\(/.test(button.getAttribute('onclick') || '')) return;
      var host = button.closest('.c-post__footer.c-reply');
      if (!host || !states.has(host)) return;
      window.requestAnimationFrame(function () { refreshHost(host); });
      window.setTimeout(function () { refreshHost(host); }, 80);
    });
  }

  function installEditorRestoreListener() {
    if (editorRestoreListenerInstalled) return;
    editorRestoreListenerInstalled = true;
    document.addEventListener('bahamut-comment-reply-editor-restored', function (event) {
      var host = event.detail && event.detail.host;
      // editor 回到底部後，由標記強化本身依當前 DOM 結構重新建立預覽。
      if (host && states.has(host)) refreshHost(host);
    });
  }

  function apply(list, previewEnabled, quickMarkerButtonsEnabled) {
    var host = list && list.parentElement;
    if (!host) return;
    if (!previewEnabled && !quickMarkerButtonsEnabled) {
      removePreviews(host);
      removeFloorMarkers(host);
      states.delete(host);
      return;
    }
    addStyles();
    states.set(host, { previewEnabled: Boolean(previewEnabled), quickMarkerButtonsEnabled: Boolean(quickMarkerButtonsEnabled) });
    if (previewEnabled) {
      installReplyClickListener();
      installEditorRestoreListener();
    }
    refreshHost(host);
  }

  tools.features = tools.features || {};
  tools.features.replyAnnotationPreview = { apply: apply };
})(window, document);
