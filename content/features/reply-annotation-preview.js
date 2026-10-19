/**
 * 功能簡介：強化官方編輯器的 #B樓層:留言ID# 標記，提供預覽、刪除、用戶選擇與全部標記。
 * 不修改官方輸入框結構或回覆流程；只以 input 事件同步 textarea 內容。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var PREVIEW_CLASS = 'comment-thread-reply-marker-preview';
  var STYLE_ID = 'comment-thread-reply-marker-preview-styles';
  var states = new WeakMap();
  var textareaHandlers = new WeakMap();
  var replyClickListenerInstalled = false;
  var pickerOutsideListenerInstalled = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.' + PREVIEW_CLASS + ' {',
      '  display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 6px;',
      '  font-size: 12px; line-height: 1.4;',
      '}',
      '.' + PREVIEW_CLASS + '__title { color: #777; }',
      '.' + PREVIEW_CLASS + '__tag {',
      '  display: inline-flex; align-items: center; gap: 3px; padding: 2px 3px 2px 6px;',
      '  border: 1px solid rgba(17,126,150,.35); border-radius: 999px;',
      '  background: rgba(17,126,150,.08); color: #117e96;',
      '}',
      '.' + PREVIEW_CLASS + '__remove, .' + PREVIEW_CLASS + '__add {',
      '  display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px;',
      '  border: 0; border-radius: 50%; padding: 0; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.' + PREVIEW_CLASS + '__add { border: 1px dashed rgba(17,126,150,.65); }',
      '.' + PREVIEW_CLASS + '__remove:hover, .' + PREVIEW_CLASS + '__remove:focus-visible,',
      '.' + PREVIEW_CLASS + '__add:hover, .' + PREVIEW_CLASS + '__add:focus-visible {',
      '  background: rgba(17,126,150,.18); outline: none;',
      '}',
      '.' + PREVIEW_CLASS + '__remove > .material-icons, .' + PREVIEW_CLASS + '__add > .material-icons { font-size: 14px; }',
      '.' + PREVIEW_CLASS + '__picker {',
      '  flex: 1 0 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));',
      '  gap: 8px; max-height: 236px; overflow: auto; padding: 8px; border: 1px solid rgba(17,126,150,.28);',
      '  border-radius: 6px; background: Canvas; box-shadow: 0 3px 10px rgba(0,0,0,.14);',
      '}',
      '.' + PREVIEW_CLASS + '__picker-all { grid-column: 1 / -1; }',
      '.' + PREVIEW_CLASS + '__picker-user, .' + PREVIEW_CLASS + '__picker-all {',
      '  display: flex; align-items: center; gap: 5px; min-width: 0; padding: 4px 6px;',
      '  border: 1px solid rgba(127,127,127,.28); border-radius: 4px; background: transparent; color: inherit;',
      '  font-size: 12px; text-align: left; cursor: pointer; transition: border-color .15s ease, background .15s ease;',
      '}',
      '.' + PREVIEW_CLASS + '__picker-user:hover, .' + PREVIEW_CLASS + '__picker-user:focus-visible,',
      '.' + PREVIEW_CLASS + '__picker-all:hover, .' + PREVIEW_CLASS + '__picker-all:focus-visible {',
      '  border-color: #117e96; background: rgba(17,126,150,.08); outline: none;',
      '}',
      '.' + PREVIEW_CLASS + '__picker-user img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }',
      '.' + PREVIEW_CLASS + '__picker-user-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.' + PREVIEW_CLASS + '__picker-user-group { min-width: 0; padding: 5px; border: 1px solid rgba(127,127,127,.18); border-radius: 5px; background: rgba(127,127,127,.035); }',
      '.' + PREVIEW_CLASS + '__picker-user-group.is-marked { border-color: rgba(17,126,150,.45); background: rgba(17,126,150,.055); }',
      '.' + PREVIEW_CLASS + '__picker-user { width: 100%; }',
      '.' + PREVIEW_CLASS + '__picker-user.is-marked, .' + PREVIEW_CLASS + '__picker-all.is-marked { border-color: #117e96; color: #117e96; background: rgba(17,126,150,.1); }',
      '.' + PREVIEW_CLASS + '__picker-status { margin-left: auto; font-size: 14px; }',
      '.' + PREVIEW_CLASS + '__picker-floors { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px 0 0 25px; }',
      '.' + PREVIEW_CLASS + '__picker-floor {',
      '  border: 1px solid rgba(17,126,150,.3); border-radius: 3px; padding: 1px 4px;',
      '  display: inline-flex; align-items: center; gap: 1px; background: rgba(17,126,150,.05); color: #117e96; font-size: 11px; cursor: pointer;',
      '}',
      '.' + PREVIEW_CLASS + '__picker-floor:hover, .' + PREVIEW_CLASS + '__picker-floor:focus-visible {',
      '  border-color: #117e96; background: rgba(17,126,150,.15); outline: none;',
      '}',
      '.' + PREVIEW_CLASS + '__picker-floor.is-marked { border-color: #117e96; background: #117e96; color: #fff; }',
      '.' + PREVIEW_CLASS + '__picker-floor > .material-icons { font-size: 12px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getMarkers(value) {
    var markers = [];
    var seen = Object.create(null);
    var pattern = /#B(\d+):(\d+)#/ig;
    var match;
    while ((match = pattern.exec(value))) {
      var raw = match[0];
      if (seen[raw]) continue;
      seen[raw] = true;
      markers.push({ raw: raw, floor: match[1], commentId: match[2] });
    }
    return markers;
  }

  function getUserName(host, marker) {
    var item = host.querySelector('#Commendcontent_' + marker.commentId);
    var user = item && item.querySelector('.reply-content__user');
    return user ? user.textContent.trim() : '';
  }

  function getMarkableUserGroups(host) {
    var groups = Object.create(null);
    var orderedGroups = [];
    Array.prototype.forEach.call(host.querySelectorAll('.c-reply__item[id^="Commendcontent_"]'), function (item) {
      var floor = item.querySelector('[name="comment_floor"]');
      var user = item.querySelector('.reply-content__user');
      var avatar = item.querySelector('.reply-avatar img');
      var commentId = item.id.replace(/^Commendcontent_/, '');
      var floorText = floor ? floor.textContent.trim() : '';
      var floorNumber = floorText.match(/^B(\d+)$/i);
      if (!floorNumber || !commentId) return;
      var userName = user ? user.textContent.trim() : '';
      var key = (user && user.getAttribute('href')) || userName || commentId;
      var group = groups[key];
      if (!group) {
        group = groups[key] = {
          userName: userName,
          avatarUrl: avatar && (avatar.currentSrc || avatar.getAttribute('src') || avatar.getAttribute('data-src')),
          markers: []
        };
        orderedGroups.push(group);
      }
      group.markers.push({
        raw: '#B' + floorNumber[1] + ':' + commentId + '#',
        floor: 'B' + floorNumber[1]
      });
    });
    return orderedGroups;
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

  function removeMarker(textarea, raw) {
    var value = textarea.value;
    var index = value.indexOf(raw);
    if (index === -1) return;
    var nextValue = value.slice(0, index) + value.slice(index + raw.length);
    updateTextarea(textarea, nextValue);
    var nextSelection = Math.min(index, nextValue.length);
    textarea.focus();
    textarea.setSelectionRange(nextSelection, nextSelection);
  }

  function appendMarkers(textarea, markers) {
    var nextValue = textarea.value;
    markers.forEach(function (marker) {
      if (nextValue.indexOf(marker.raw) !== -1) return;
      nextValue += (nextValue && !/\s$/.test(nextValue) ? ' ' : '') + marker.raw + ' ';
    });
    if (nextValue === textarea.value) return;
    updateTextarea(textarea, nextValue);
    textarea.focus();
    textarea.setSelectionRange(nextValue.length, nextValue.length);
  }

  function removeMarkers(textarea, markers) {
    var nextValue = textarea.value;
    markers.forEach(function (marker) {
      nextValue = nextValue.split(marker.raw).join('');
    });
    if (nextValue === textarea.value) return;
    updateTextarea(textarea, nextValue);
    textarea.focus();
    textarea.setSelectionRange(nextValue.length, nextValue.length);
  }

  function toggleMarkers(textarea, markers) {
    var allMarked = markers.length && markers.every(function (marker) {
      return textarea.value.indexOf(marker.raw) !== -1;
    });
    if (allMarked) removeMarkers(textarea, markers);
    else appendMarkers(textarea, markers);
  }

  function isOfficialEditor(host, editor) {
    return editor.parentElement === host;
  }

  function createPicker(host, textarea, preview) {
    var picker = document.createElement('div');
    picker.className = PREVIEW_CLASS + '__picker';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', '選擇要標記的用戶');
    var groups = getMarkableUserGroups(host);
    var markerCount = groups.reduce(function (count, group) {
      return count + group.markers.length;
    }, 0);
    var marked = Object.create(null);
    getMarkers(textarea.value).forEach(function (marker) { marked[marker.raw] = true; });

    var allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = PREVIEW_CLASS + '__picker-all';
    allButton.appendChild(createIcon('group_add'));
    allButton.appendChild(document.createTextNode('全部標記（' + markerCount + '）'));
    if (markerCount && groups.every(function (group) {
      return group.markers.every(function (marker) { return marked[marker.raw]; });
    })) {
      allButton.classList.add('is-marked');
      allButton.appendChild(createIcon('check'));
    }
    allButton.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleMarkers(textarea, groups.reduce(function (markers, group) {
        return markers.concat(group.markers);
      }, []));
    });
    picker.appendChild(allButton);

    groups.forEach(function (group) {
      var groupElement = document.createElement('div');
      groupElement.className = PREVIEW_CLASS + '__picker-user-group';
      var groupMarkedCount = group.markers.filter(function (marker) { return marked[marker.raw]; }).length;
      if (groupMarkedCount) groupElement.classList.add('is-marked');
      var userButton = document.createElement('button');
      userButton.type = 'button';
      userButton.className = PREVIEW_CLASS + '__picker-user';
      userButton.title = '標記此用戶的全部樓層';
      if (group.avatarUrl) {
        var avatar = document.createElement('img');
        avatar.src = group.avatarUrl;
        avatar.alt = '';
        userButton.appendChild(avatar);
      }
      var label = document.createElement('span');
      label.className = PREVIEW_CLASS + '__picker-user-label';
      label.textContent = group.userName || '未知用戶';
      userButton.appendChild(label);
      if (groupMarkedCount) {
        userButton.classList.add('is-marked');
        userButton.setAttribute('aria-label', (group.userName || '未知用戶') + '，已標記 ' + groupMarkedCount + ' 個樓層');
        var status = createIcon(groupMarkedCount === group.markers.length ? 'check_circle' : 'check');
        status.className += ' ' + PREVIEW_CLASS + '__picker-status';
        userButton.appendChild(status);
      }
      userButton.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleMarkers(textarea, group.markers);
      });
      groupElement.appendChild(userButton);

      var floors = document.createElement('div');
      floors.className = PREVIEW_CLASS + '__picker-floors';
      group.markers.forEach(function (marker) {
        var floorButton = document.createElement('button');
        floorButton.type = 'button';
        floorButton.className = PREVIEW_CLASS + '__picker-floor';
        floorButton.textContent = marker.floor;
        floorButton.title = '只標記 ' + marker.floor;
        if (marked[marker.raw]) {
          floorButton.classList.add('is-marked');
          floorButton.setAttribute('aria-pressed', 'true');
          floorButton.appendChild(createIcon('check'));
        } else {
          floorButton.setAttribute('aria-pressed', 'false');
        }
        floorButton.addEventListener('click', function (event) {
          event.stopPropagation();
          toggleMarkers(textarea, [marker]);
        });
        floors.appendChild(floorButton);
      });
      groupElement.appendChild(floors);
      picker.appendChild(groupElement);
    });
    return picker;
  }

  function appendAddButton(host, textarea, preview) {
    var add = document.createElement('button');
    add.type = 'button';
    add.className = PREVIEW_CLASS + '__add';
    add.setAttribute('aria-label', '新增回覆標記');
    add.setAttribute('aria-expanded', 'false');
    add.title = '新增回覆標記';
    add.appendChild(createIcon('add'));
    add.addEventListener('mousedown', function (event) { event.preventDefault(); });
    add.addEventListener('click', function (event) {
      event.stopPropagation();
      preview._commentThreadPickerOpen = !preview._commentThreadPickerOpen;
      renderPreview(host, textarea, preview, true);
    });
    preview.appendChild(add);
  }

  function renderPreview(host, textarea, preview, showAddButton) {
    var markers = getMarkers(textarea.value);
    preview.replaceChildren();
    preview.hidden = !showAddButton && !markers.length;
    if (preview.hidden) return;

    var title = document.createElement('span');
    title.className = PREVIEW_CLASS + '__title';
    title.textContent = '標記：';
    preview.appendChild(title);
    markers.forEach(function (marker) {
      var tag = document.createElement('span');
      tag.className = PREVIEW_CLASS + '__tag';
      var userName = getUserName(host, marker);
      tag.appendChild(document.createTextNode('B' + marker.floor + (userName ? ' ' + userName : '')));
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
    if (showAddButton) appendAddButton(host, textarea, preview);
    if (showAddButton && preview._commentThreadPickerOpen) {
      preview.appendChild(createPicker(host, textarea, preview));
    }
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
    var showAddButton = isOfficialEditor(host, editor);
    if (!textareaHandlers.has(textarea)) {
      var handler = function () { renderPreview(host, textarea, preview, showAddButton); };
      textarea.addEventListener('input', handler);
      textareaHandlers.set(textarea, handler);
    }
    renderPreview(host, textarea, preview, showAddButton);
  }

  function refreshHost(host) {
    if (!states.get(host)) return;
    Array.prototype.forEach.call(host.querySelectorAll('.c-reply__editor'), function (editor) {
      prepareEditor(host, editor);
    });
  }

  function removePreviews(host) {
    Array.prototype.forEach.call(host.querySelectorAll('.' + PREVIEW_CLASS), function (preview) {
      var editor = preview.parentElement;
      var textarea = editor && editor.querySelector('textarea');
      var handler = textarea && textareaHandlers.get(textarea);
      if (textarea && handler) textarea.removeEventListener('input', handler);
      if (textarea) textareaHandlers.delete(textarea);
      preview.remove();
    });
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

  function installPickerOutsideListener() {
    if (pickerOutsideListenerInstalled) return;
    pickerOutsideListenerInstalled = true;
    document.addEventListener('click', function (event) {
      Array.prototype.forEach.call(document.querySelectorAll('.' + PREVIEW_CLASS), function (preview) {
        if (!preview._commentThreadPickerOpen || preview.contains(event.target)) return;
        preview._commentThreadPickerOpen = false;
        var editor = preview.parentElement;
        var textarea = editor && editor.querySelector('textarea');
        var host = preview.closest('.c-post__footer.c-reply');
        if (host && textarea) renderPreview(host, textarea, preview, isOfficialEditor(host, editor));
      });
    });
  }

  function apply(list, enabled) {
    var host = list && list.parentElement;
    if (!host) return;
    if (!enabled) {
      removePreviews(host);
      states.delete(host);
      return;
    }
    addStyles();
    states.set(host, true);
    installReplyClickListener();
    installPickerOutsideListener();
    refreshHost(host);
  }

  tools.features = tools.features || {};
  tools.features.replyAnnotationPreview = { apply: apply };
})(window, document);
