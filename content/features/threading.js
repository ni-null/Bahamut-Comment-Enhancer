  /**
 * 功能簡介：將平面留言重組為最多三層的階層留言，並提供攤平還原功能。
 * 會保留原站留言本體結構，避免影響每筆留言右側的原生操作按鈕。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var parser = tools.parser;
  var sorting = tools.features.sorting;
  var CHILDREN_CLASS = 'comment-thread-children';
  var CHILDREN_INNER_CLASS = CHILDREN_CLASS + '__inner';
  var THREAD_COPY_SELECTOR = '[data-comment-thread-copy="true"]';
  var HIDE_SEPARATOR_ATTRIBUTE = 'data-comment-thread-hide-separators';
  var COLLAPSED_ATTRIBUTE = 'data-comment-thread-children-collapsed';
  var ITEM_COLLAPSE_STATE_ATTRIBUTE = 'data-comment-thread-children-state';
  var COLLAPSE_BUTTON_CLASS = 'comment-thread-children-toggle';
  var COLLAPSE_AVATARS_CLASS = COLLAPSE_BUTTON_CLASS + '__avatars';
  var COLLAPSE_AVATAR_CLASS = COLLAPSE_BUTTON_CLASS + '__avatar';
  var COLLAPSE_LABEL_CLASS = COLLAPSE_BUTTON_CLASS + '__label';
  var COLLAPSE_META_CLASS = COLLAPSE_BUTTON_CLASS + '__meta';
  var COLLAPSE_ICON_CLASS = COLLAPSE_BUTTON_CLASS + '__icon';
  var MAX_DEPTH = 3;

  function addStyles() {
    if (document.getElementById('comment-threading-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-threading-styles';
    style.textContent = [
      '.' + CHILDREN_CLASS + ' {',
      '  display: grid;',
      '  clear: both;',
      '  grid-template-rows: 1fr;',
      '  transition: grid-template-rows .3s ease;',
      '}',
      '.' + CHILDREN_CLASS + ' > .' + CHILDREN_INNER_CLASS + ' {',
      '  min-height: 0;',
      '  overflow: hidden;',
      '  margin: 8px 0 0 36px;',
      '  padding-left: 12px;',
      '  border-left: 2px solid rgba(125, 125, 125, .28);',
      '}',
      '[' + HIDE_SEPARATOR_ATTRIBUTE + '="true"] .' + CHILDREN_CLASS + ' > .' + CHILDREN_INNER_CLASS + ' { border-left-color: transparent; }',
      '.' + CHILDREN_CLASS + ' > .' + CHILDREN_INNER_CLASS + ' > .c-reply__item { margin-top: 8px; }',
      '.' + CHILDREN_CLASS + '[' + COLLAPSED_ATTRIBUTE + '="true"] { grid-template-rows: 0fr; }',
      '.' + CHILDREN_CLASS + '[' + COLLAPSED_ATTRIBUTE + '="true"] > .' + CHILDREN_INNER_CLASS + ' { margin-top: 0; border-left-color: transparent; }',
      '.' + COLLAPSE_BUTTON_CLASS + ' { display: flex; clear: both; align-items: center; gap: 9px; box-sizing: border-box; width: 100%; margin-top: 12px; padding: 10px 0 0; border: 0; border-top: 1px solid rgba(125, 125, 125, .24); background: none; color: #117e96; font: inherit; font-size: 13px; line-height: 24px; text-align: left; cursor: pointer; }',
      '.' + COLLAPSE_BUTTON_CLASS + ':hover .' + COLLAPSE_LABEL_CLASS + ', .' + COLLAPSE_BUTTON_CLASS + ':focus-visible .' + COLLAPSE_LABEL_CLASS + ' { text-decoration: underline; }',
      '.' + COLLAPSE_BUTTON_CLASS + ':focus-visible { outline: 2px solid currentColor; outline-offset: 3px; border-radius: 4px; }',
      '.' + COLLAPSE_AVATARS_CLASS + ' { display: flex; flex: 0 0 auto; padding-left: 8px; }',
      '.' + COLLAPSE_AVATAR_CLASS + ' { box-sizing: border-box; width: 24px; height: 24px; margin-left: -8px; border: 2px solid Canvas; border-radius: 50%; object-fit: cover; background: rgba(125, 125, 125, .2); }',
      '.' + COLLAPSE_LABEL_CLASS + ' { font-weight: 600; }',
      '.' + COLLAPSE_META_CLASS + ' { color: rgba(90, 105, 105, .9); font-weight: 400; }',
      '.' + COLLAPSE_ICON_CLASS + ' { margin-left: auto; transition: transform .2s ease; }',
      '.' + COLLAPSE_BUTTON_CLASS + '[aria-expanded="true"] .' + COLLAPSE_ICON_CLASS + ' { transform: rotate(180deg); }',
      '@media (max-width: 600px) {',
      '  .' + CHILDREN_CLASS + ' > .' + CHILDREN_INNER_CLASS + ' { margin-left: 18px; padding-left: 8px; }',
      '  .' + COLLAPSE_BUTTON_CLASS + ' { gap: 7px; font-size: 12px; }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .' + CHILDREN_CLASS + ' { transition: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeEmptyContainers(list) {
    Array.prototype.slice.call(list.querySelectorAll('.' + CHILDREN_CLASS)).forEach(function (container) {
      if (!collectThreadItems(container).length) container.remove();
    });
  }

  function moveTooltipRootOutsideThread(root) {
    if (!root.matches('[data-tippy-root]') ||
      !root.closest('.' + CHILDREN_INNER_CLASS) || !document.body) return;

    // Tippy 會把選單插在觸發按鈕附近；階層留言內層為了收合動畫使用 overflow:hidden，
    // 會裁切選單。移至 body 可保留原定位，同時避開階層容器與留言清單的裁切範圍。
    document.body.appendChild(root);
  }

  function moveNestedTooltipRoots(nodes) {
    nodes.forEach(function (node) {
      if (node.nodeType !== 1) return;
      if (node.matches('[data-tippy-root]')) moveTooltipRootOutsideThread(node);
      Array.prototype.forEach.call(node.querySelectorAll('[data-tippy-root]'), function (root) {
        moveTooltipRootOutsideThread(root);
      });
    });
  }

  function stopTooltipObserver(list) {
    if (!list._commentThreadTooltipObserver) return;
    list._commentThreadTooltipObserver.disconnect();
    delete list._commentThreadTooltipObserver;
  }

  function observeNestedTooltips(list) {
    stopTooltipObserver(list);
    moveNestedTooltipRoots([list]);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        moveNestedTooltipRoots(Array.prototype.slice.call(mutation.addedNodes));
      });
    });
    observer.observe(list, { childList: true, subtree: true });
    list._commentThreadTooltipObserver = observer;
  }

  function collectThreadItems(container) {
    // 收合功能讀取階層重組後的結果：原始留言保留 id，多樓標記的複製留言則以 data attribute 識別。
    return Array.prototype.slice.call(container.querySelectorAll(tools.selectors.item + ', ' + THREAD_COPY_SELECTOR));
  }

  function getChildrenContent(container) {
    var content = container.querySelector(':scope > .' + CHILDREN_INNER_CLASS);
    if (content) return content;

    content = document.createElement('div');
    content.className = CHILDREN_INNER_CLASS;
    while (container.firstChild) content.appendChild(container.firstChild);
    container.appendChild(content);
    return content;
  }

  function removeCollapseControls(list, clearState) {
    Array.prototype.forEach.call(list.querySelectorAll('.' + COLLAPSE_BUTTON_CLASS), function (button) {
      button.remove();
    });
    Array.prototype.forEach.call(list.querySelectorAll('.' + CHILDREN_CLASS), function (container) {
      container.removeAttribute(COLLAPSED_ATTRIBUTE);
    });
    if (clearState) {
      parser.collectItems(list).forEach(function (item) {
        item.removeAttribute(ITEM_COLLAPSE_STATE_ATTRIBUTE);
      });
    }
  }

  function setBranchCollapsed(container, collapsed) {
    // 多樓標記建立的複製留言也在子容器內，必須與第一層分支同步收合或展開。
    Array.prototype.forEach.call([container].concat(Array.prototype.slice.call(
      container.querySelectorAll('.' + CHILDREN_CLASS)
    )), function (branch) {
      branch.setAttribute(COLLAPSED_ATTRIBUTE, String(collapsed));
    });
  }

  function setCollapsed(parent, container, button, collapsed, replyInfo) {
    parent.setAttribute(ITEM_COLLAPSE_STATE_ATTRIBUTE, collapsed ? 'collapsed' : 'expanded');
    setBranchCollapsed(container, collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', (collapsed ? '展開' : '收合') + ' ' + replyInfo.count + ' 則回覆');
    button.querySelector('.' + COLLAPSE_LABEL_CLASS).textContent = collapsed
      ? replyInfo.count + ' 則回覆'
      : '收合回覆';
    button.querySelector('.' + COLLAPSE_META_CLASS).textContent = collapsed && replyInfo.latestTime
      ? '· 最新 ' + replyInfo.latestTime
      : '';
  }

  function getReplyInfo(container) {
    var replies = collectThreadItems(container);
    var avatars = [];
    var seenAvatarUrls = Object.create(null);

    replies.forEach(function (reply) {
      var image = reply.querySelector(':scope > div > a.reply-avatar.user--sm img');
      var source = getAvatarSource(image);
      if (!source || seenAvatarUrls[source] || avatars.length === 3) return;
      seenAvatarUrls[source] = true;
      avatars.push(source);
    });

    var latestReply = replies[replies.length - 1];
    var latestTime = latestReply && latestReply.querySelector('.reply-content__footer .edittime:not([name="comment_floor"])');
    return {
      count: replies.length,
      avatars: avatars,
      latestTime: latestTime ? latestTime.textContent.trim() : ''
    };
  }

  function getAvatarSource(image) {
    if (!image) return '';
    return image.currentSrc || image.getAttribute('src') || image.getAttribute('data-src') ||
      image.getAttribute('data-original') || image.getAttribute('data-lazy-src') || '';
  }

  function renderAvatarStack(avatarStack, avatars) {
    avatarStack.textContent = '';
    avatars.forEach(function (source) {
      var avatar = document.createElement('img');
      avatar.className = COLLAPSE_AVATAR_CLASS;
      avatar.src = source;
      avatar.alt = '';
      avatarStack.appendChild(avatar);
    });
  }

  function createCollapseButton(replyInfo) {
    var button = document.createElement('button');
    var avatarStack = document.createElement('span');
    var label = document.createElement('span');
    var meta = document.createElement('span');
    var icon = document.createElement('i');

    button.type = 'button';
    button.className = COLLAPSE_BUTTON_CLASS;
    avatarStack.className = COLLAPSE_AVATARS_CLASS;
    avatarStack.setAttribute('aria-hidden', 'true');
    renderAvatarStack(avatarStack, replyInfo.avatars);
    label.className = COLLAPSE_LABEL_CLASS;
    meta.className = COLLAPSE_META_CLASS;
    icon.className = 'material-icons ' + COLLAPSE_ICON_CLASS;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'expand_more';
    button.appendChild(avatarStack);
    button.appendChild(label);
    button.appendChild(meta);
    button.appendChild(icon);
    return button;
  }

  function getFirstLevelChildrenContainers(list) {
    // 階層整理完成後，僅以最終 DOM 的第一層兄弟關係判斷收合分支。
    // 多樓標記的複製留言已在此時放入正確分支，不需再檢查來源留言的 depth 或 parent 資料。
    return Array.prototype.filter.call(list.children, function (node) {
      return node.classList && node.classList.contains(CHILDREN_CLASS) &&
        node.previousElementSibling && node.previousElementSibling.matches(tools.selectors.item);
    });
  }

  function refreshCollapseControls(list) {
    getFirstLevelChildrenContainers(list).forEach(function (container) {
      var parent = container.previousElementSibling;
      var button = parent.querySelector(':scope > div > .reply-content > .' + COLLAPSE_BUTTON_CLASS);
      if (!button) return;

      var replyInfo = getReplyInfo(container);
      if (!replyInfo.count) return;
      renderAvatarStack(button.querySelector('.' + COLLAPSE_AVATARS_CLASS), replyInfo.avatars);
      setCollapsed(
        parent,
        container,
        button,
        container.getAttribute(COLLAPSED_ATTRIBUTE) !== 'false',
        replyInfo
      );
    });
  }

  function observeCollapseAvatars(list) {
    if (list._commentThreadCollapseAvatarObserver) return;

    var queued = false;
    var onImageLoad = function (event) {
      var image = event.target;
      if (!image.matches || !image.matches('.' + CHILDREN_CLASS + ' .reply-avatar.user--sm img')) return;
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        if (list.isConnected) refreshCollapseControls(list);
      });
    };
    list.addEventListener('load', onImageLoad, true);
    list._commentThreadCollapseAvatarObserver = onImageLoad;
  }

  function applyCollapseControls(list, enabled) {
    removeCollapseControls(list, !enabled);
    if (!enabled) return;
    observeCollapseAvatars(list);

    getFirstLevelChildrenContainers(list).forEach(function (container) {
      var parent = container.previousElementSibling;
      var replyInfo = getReplyInfo(container);
      if (!replyInfo.count) return;

      var button = createCollapseButton(replyInfo);
      var collapsed = parent.getAttribute(ITEM_COLLAPSE_STATE_ATTRIBUTE) !== 'expanded';
      setCollapsed(parent, container, button, collapsed, replyInfo);
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var nextCollapsed = container.getAttribute(COLLAPSED_ATTRIBUTE) !== 'true';
        setCollapsed(parent, container, button, nextCollapsed, replyInfo);
      });
      var replyContent = parent.querySelector(':scope > div > .reply-content');
      if (replyContent) replyContent.appendChild(button);
      else container.insertAdjacentElement('beforebegin', button);
    });
    // 官方「展開全部留言」會非同步補入頭像；下一個 frame 再讀一次即可更新既有收合列。
    window.requestAnimationFrame(function () {
      if (list.isConnected) refreshCollapseControls(list);
    });
  }

  function flatten(list, preserveCollapseState) {
    stopTooltipObserver(list);
    removeCollapseControls(list, !preserveCollapseState);
    var editor = list.querySelector(':scope > .c-reply__editor');
    Array.prototype.slice.call(list.querySelectorAll('[data-comment-thread-copy="true"]')).forEach(function (copy) {
      copy.remove();
    });
    parser.collectItems(list).forEach(function (item) {
      list.insertBefore(item, editor || null);
      delete item.dataset.threadDepth;
      delete item.dataset.threadParent;
      item.removeAttribute('data-thread-truncated');
    });
    removeEmptyContainers(list);
    list.removeAttribute(HIDE_SEPARATOR_ATTRIBUTE);
  }

  function apply(list, sortMode, showSeparators, collapseEnabled) {
    addStyles();
    var items = parser.collectItems(list);
    var editor = list.querySelector(':scope > .c-reply__editor');
    var byId = Object.create(null);
    var records = items.map(function (item, index) {
      var record = {
        id: parser.getCommentId(item),
        item: item,
        index: index,
        parentIds: parser.getParentIds(item),
        parentId: null,
        depth: null
      };
      byId[record.id] = record;
      return record;
    });

    records.forEach(function (record) {
      record.parentId = record.parentIds.find(function (parentId) {
        return Boolean(byId[parentId]);
      }) || record.parentIds[0] || null;
    });

    flatten(list, true);
    if (showSeparators === false) list.setAttribute(HIDE_SEPARATOR_ATTRIBUTE, 'true');

    function getDepth(record, visiting) {
      if (record.depth !== null) return record.depth;
      if (!record.parentId || !byId[record.parentId] || visiting[record.id]) {
        record.depth = 1;
        return record.depth;
      }
      visiting[record.id] = true;
      record.depth = getDepth(byId[record.parentId], visiting) + 1;
      delete visiting[record.id];
      return record.depth;
    }

    function getVisualParent(record, parentId) {
      if (!parentId || !byId[parentId]) return null;

      var parent = byId[parentId];
      var ancestors = Object.create(null);
      ancestors[record.id] = true;
      for (var cursor = parent; cursor; cursor = cursor.parentId ? byId[cursor.parentId] : null) {
        if (ancestors[cursor.id]) return null;
        ancestors[cursor.id] = true;
      }
      while (parent && getDepth(parent, Object.create(null)) >= MAX_DEPTH) {
        parent = parent.parentId ? byId[parent.parentId] : null;
      }
      return parent || null;
    }

    function createThreadCopy(record, parent, depth) {
      var copy = record.item.cloneNode(true);
      copy.removeAttribute('id');
      copy.setAttribute('data-comment-thread-copy', 'true');
      copy.dataset.threadDepth = String(depth);
      copy.dataset.threadParent = parent.id;
      copy.removeAttribute('data-thread-truncated');
      getChildrenContent(getChildrenContainer(parent)).appendChild(copy);
    }

    function getChildrenContainer(parent) {
      var container = parent.item.nextElementSibling;
      if (!container || !container.classList.contains(CHILDREN_CLASS)) {
        container = document.createElement('div');
        container.className = CHILDREN_CLASS;
        parent.item.insertAdjacentElement('afterend', container);
      }
      return container;
    }

    var compareRecords = sorting.createComparator(records, byId, sortMode || 'default', true);
    records.slice().sort(function (left, right) {
      var difference = getDepth(left, Object.create(null)) - getDepth(right, Object.create(null));
      return difference || compareRecords(left, right);
    }).forEach(function (record) {
      var actualDepth = getDepth(record, Object.create(null));
      var parent = getVisualParent(record, record.parentId);
      record.item.dataset.threadDepth = String(parent ? Math.min(actualDepth, MAX_DEPTH) : 1);
      record.item.dataset.threadParent = record.parentIds.join(',');
      record.item.toggleAttribute('data-thread-truncated', actualDepth > MAX_DEPTH);
      if (parent) getChildrenContent(getChildrenContainer(parent)).appendChild(record.item);
      else list.insertBefore(record.item, editor || null);

      var copiedParents = Object.create(null);
      if (parent) copiedParents[parent.id] = true;
      record.parentIds.forEach(function (parentId) {
        if (parentId === record.parentId) return;
        var copyParent = getVisualParent(record, parentId);
        if (!copyParent || copiedParents[copyParent.id]) return;
        copiedParents[copyParent.id] = true;
        createThreadCopy(record, copyParent, Math.min(getDepth(copyParent, Object.create(null)) + 1, MAX_DEPTH));
      });
    });
    applyCollapseControls(list, collapseEnabled);
    observeNestedTooltips(list);
  }

  tools.features = tools.features || {};
  tools.features.threading = {
    apply: apply,
    flatten: flatten,
    maxDepth: MAX_DEPTH
  };
})(window, document);
