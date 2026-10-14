/**
 * 功能簡介：建立留言右上角齒輪主選單、設定控制項與選單互動。
 * 此模組只呈現介面並將操作回傳頁面控制器，不直接讀寫設定或套用留言功能。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  tools.ui = tools.ui || {};
  var CONTROL_CLASS = 'comment-thread-control';
  var CONTROL_BAR_CLASS = 'comment-thread-controls';
  var CONTROL_MENU_CLASS = 'comment-thread-control-menu';

  function addStyles() {
    if (document.getElementById('comment-thread-controls-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-controls-styles';
    style.textContent = [
      '.comment-thread-controls-host { position: relative; }',
      '.comment-thread-controls-host > .' + CONTROL_BAR_CLASS + ' {',
      '  position: absolute; z-index: 11; top: 8px; right: 8px; display: inline-flex;',
      '}',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ' {',
      '  border: 0; padding: 2px 4px; background: none; color: inherit;',
      '  cursor: pointer; line-height: 1; opacity: .55;',
      '}',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ':hover,',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ':focus-visible,',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + '[aria-expanded="true"] { opacity: 1; }',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ' > .material-icons { font-size: 18px; padding-top: 5px; }',
      '.' + CONTROL_MENU_CLASS + ' {',
      '  position: absolute; z-index: 10; top: calc(100% + 4px); right: 0;',
      '  width: min(412px, calc(100vw - 24px)); padding: 10px; border: 1px solid rgba(127,127,127,.45);',
      '  border-radius: 4px; background: Canvas; color: CanvasText;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,.18);',
      '}',
      '.' + CONTROL_MENU_CLASS + '__validation { padding: 6px 4px; }',
      '.' + CONTROL_MENU_CLASS + '__validation-title { margin: 0 0 4px; color: #117e96; font-weight: 600; }',
      '.' + CONTROL_MENU_CLASS + '__validation-message { margin: 0; font-size: .92em; line-height: 1.55; }',
      '.' + CONTROL_MENU_CLASS + '__layout {',
      '  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__group {',
      '  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px 10px;',
      '  padding: 8px; border: 1px solid rgba(127,127,127,.22);',
      '  border-radius: 5px; background: rgba(127,127,127,.06);',
      '}',
      '.' + CONTROL_MENU_CLASS + '__layout > .' + CONTROL_MENU_CLASS + '__group { grid-column: 1 / -1; }',
      '.' + CONTROL_MENU_CLASS + '__group-title {',
      '  grid-column: 1 / -1; padding: 1px 3px; color: #117e96; font-size: .86em; font-weight: 600; letter-spacing: .04em;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__item {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  min-height: 28px; gap: 12px; padding: 2px 3px; white-space: nowrap; cursor: pointer;',
      '}',
      '@media (max-width: 480px) {',
      '  .' + CONTROL_MENU_CLASS + '__layout { grid-template-columns: minmax(0, 1fr); }',
      '  .' + CONTROL_MENU_CLASS + '__group { grid-template-columns: minmax(0, 1fr); }',
      '}',
      '.' + CONTROL_MENU_CLASS + '__subitem { padding-left: 3px; font-size: .92em; }',
      '.' + CONTROL_MENU_CLASS + '__item.is-disabled { opacity: .5; cursor: default; }',
      '.' + CONTROL_MENU_CLASS + '__switch {',
      '  position: absolute; width: 1px; height: 1px; margin: -1px; opacity: 0;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__switch-track {',
      '  position: relative; flex: 0 0 auto; width: 34px; height: 18px;',
      '  border: 1px solid rgba(127,127,127,.65); border-radius: 999px;',
      '  background: rgba(127,127,127,.45); transition: background .15s ease, border-color .15s ease;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__switch-track::after {',
      '  content: ""; position: absolute; top: 3px; left: 2px; width: 12px; height: 12px;',
      '  border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25);',
      '  transition: transform .15s ease;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__switch:checked + .' + CONTROL_MENU_CLASS + '__switch-track {',
      '  border-color: #117e96; background: #117e96;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__switch:checked + .' + CONTROL_MENU_CLASS + '__switch-track::after { transform: translateX(16px); }',
      '.' + CONTROL_MENU_CLASS + '__switch:focus-visible + .' + CONTROL_MENU_CLASS + '__switch-track {',
      '  outline: 2px solid #117e96; outline-offset: 2px;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__select {',
      '  min-width: 76px; border: 1px solid rgba(127,127,127,.55); border-radius: 4px;',
      '  padding: 3px 5px; background: Canvas; color: CanvasText;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__select:focus { border-color: #117e96; outline: 2px solid rgba(17,126,150,.3); }',
      '.' + CONTROL_MENU_CLASS + '__actions {',
      '  margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(127,127,127,.25);',
      '}',
      '.' + CONTROL_MENU_CLASS + '__actions-row { display: flex; gap: 6px; }',
      '.' + CONTROL_MENU_CLASS + '__reset {',
      '  display: inline-flex; align-items: center; justify-content: center; gap: 5px;',
      '  flex: 1 1 auto; min-height: 30px; border: 1px solid rgba(127,127,127,.55);',
      '  border-radius: 4px; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__info {',
      '  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 30px;',
      '  min-height: 30px; padding: 0; border: 1px solid rgba(127,127,127,.55);',
      '  border-radius: 4px; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__info > .material-icons { font-size: 18px; }',
      '.' + CONTROL_MENU_CLASS + '__reset:hover,',
      '.' + CONTROL_MENU_CLASS + '__reset:focus-visible {',
      '  border-color: #117e96; background: rgba(17,126,150,.1); color: #117e96;',
      '  outline: none;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__info:hover,',
      '.' + CONTROL_MENU_CLASS + '__info:focus-visible,',
      '.' + CONTROL_MENU_CLASS + '__info[aria-expanded="true"] {',
      '  border-color: #117e96; background: rgba(17,126,150,.1); color: #117e96;',
      '  outline: none;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createMenuToggle(labelText, settingName, state, onSettingChange, options) {
    options = options || {};
    var label = document.createElement('label');
    label.className = CONTROL_MENU_CLASS + '__item' + (options.secondary ? ' ' + CONTROL_MENU_CLASS + '__subitem' : '');
    label.appendChild(document.createTextNode(labelText));

    var toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = CONTROL_MENU_CLASS + '__switch';
    toggle.dataset.commentThreadSetting = settingName;
    toggle.setAttribute('role', 'switch');
    toggle.checked = Boolean(state[settingName]);
    toggle.setAttribute('aria-checked', String(toggle.checked));
    toggle.disabled = Boolean(options.disabled);
    label.classList.toggle('is-disabled', toggle.disabled);
    toggle.addEventListener('change', function () {
      onSettingChange(settingName, toggle.checked);
    });
    label.appendChild(toggle);

    var track = document.createElement('span');
    track.className = CONTROL_MENU_CLASS + '__switch-track';
    track.setAttribute('aria-hidden', 'true');
    label.appendChild(track);
    return label;
  }

  function createMenuSelect(labelText, settingName, options, state, onSettingChange, config) {
    config = config || {};
    var label = document.createElement('label');
    label.className = CONTROL_MENU_CLASS + '__item' + (config.secondary ? ' ' + CONTROL_MENU_CLASS + '__subitem' : '');
    label.appendChild(document.createTextNode(labelText));

    var select = document.createElement('select');
    select.className = CONTROL_MENU_CLASS + '__select';
    select.dataset.commentThreadSetting = settingName;
    options.forEach(function (option) {
      var element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      select.appendChild(element);
    });
    select.value = state[settingName];
    select.disabled = Boolean(config.disabled);
    label.classList.toggle('is-disabled', select.disabled);
    select.addEventListener('change', function () {
      onSettingChange(settingName, select.value);
    });
    label.appendChild(select);
    return label;
  }

  function createGroupTitle(titleText) {
    var title = document.createElement('div');
    title.className = CONTROL_MENU_CLASS + '__group-title';
    title.textContent = titleText;
    return title;
  }

  function createActions(onReset) {
    var actions = document.createElement('div');
    actions.className = CONTROL_MENU_CLASS + '__actions';
    var row = document.createElement('div');
    row.className = CONTROL_MENU_CLASS + '__actions-row';

    var resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = CONTROL_MENU_CLASS + '__reset';
    resetButton.title = '還原所有顯示設定為預設值';
    resetButton.innerHTML = '<i class="material-icons" aria-hidden="true">refresh</i>還原預設';
    resetButton.addEventListener('click', onReset);
    row.appendChild(resetButton);

    var infoButton = document.createElement('button');
    infoButton.type = 'button';
    infoButton.className = CONTROL_MENU_CLASS + '__info';
    infoButton.setAttribute('aria-label', '查看開發者資訊與功能介紹');
    infoButton.setAttribute('aria-expanded', 'false');
    infoButton.title = '開發者資訊與功能介紹';
    infoButton.innerHTML = '<i class="material-icons" aria-hidden="true">info</i>';
    infoButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var infoModal = tools.ui && tools.ui.infoModal;
      if (!infoModal || typeof infoModal.open !== 'function') {
        window.console.warn('[巴哈留言優化工具] 開發者資訊視窗尚未載入。');
        return;
      }
      infoModal.open(infoButton);
    });
    row.appendChild(infoButton);
    actions.appendChild(row);
    return actions;
  }

  function closeMenus(exceptMenu) {
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS), function (menu) {
      if (menu === exceptMenu) return;
      menu.hidden = true;
      var gear = menu.parentElement.querySelector('button.' + CONTROL_CLASS);
      if (gear) gear.setAttribute('aria-expanded', 'false');
    });
  }

  function installOutsideMenuClose() {
    if (document._commentThreadOutsideMenuCloseInstalled) return;
    document._commentThreadOutsideMenuCloseInstalled = true;
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (target && target.closest && target.closest('.' + CONTROL_BAR_CLASS)) return;
      closeMenus();
    });
  }

  function getDirectControls(host) {
    return Array.prototype.find.call(host.children, function (child) {
      return child.classList.contains(CONTROL_BAR_CLASS);
    });
  }

  function createValidationMessage(reason) {
    var validation = document.createElement('div');
    validation.className = CONTROL_MENU_CLASS + '__validation';
    validation.setAttribute('role', 'status');
    validation.innerHTML = [
      '<p class="' + CONTROL_MENU_CLASS + '__validation-title">驗證失敗，功能暫時停用</p>',
      '<p class="' + CONTROL_MENU_CLASS + '__validation-message">' + reason + ' 頁面結構恢復後會自動重新檢查。</p>'
    ].join('');
    return validation;
  }

  function mount(host, options) {
    if (!host) return;

    addStyles();
    host.classList.add('comment-thread-controls-host');
    var existingControls = getDirectControls(host);
    if (existingControls) existingControls.remove();
    var isValid = !options.validation || options.validation.valid;
    var state = isValid ? options.getState() : null;
    var controls = document.createElement('div');
    controls.className = CONTROL_BAR_CLASS;

    var gear = document.createElement('button');
    gear.type = 'button';
    gear.className = CONTROL_CLASS;
    gear.setAttribute('aria-label', '留言顯示設定');
    gear.setAttribute('aria-expanded', 'false');
    gear.title = isValid ? '留言顯示設定' : '頁面結構驗證失敗，功能暫時停用';
    gear.innerHTML = '<i class="material-icons" aria-hidden="true">settings</i>';

    var menu = document.createElement('div');
    menu.className = CONTROL_MENU_CLASS;
    menu.hidden = true;

    if (!isValid) {
      menu.appendChild(createValidationMessage(options.validation.reason));
      controls.appendChild(gear);
      controls.appendChild(menu);
      host.appendChild(controls);
      installOutsideMenuClose();
      gear.addEventListener('click', function () {
        var shouldOpen = menu.hidden;
        closeMenus(menu);
        menu.hidden = !shouldOpen;
        gear.setAttribute('aria-expanded', String(shouldOpen));
      });
      return;
    }

    var commentGroup = document.createElement('div');
    commentGroup.className = CONTROL_MENU_CLASS + '__group';
    commentGroup.appendChild(createGroupTitle('留言與排序'));
    commentGroup.appendChild(createMenuToggle('階層留言', 'threadingEnabled', state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('階層時遮蔽樓層', 'hideReplyAnnotation', state, options.onSettingChange, {
      secondary: true,
      disabled: !state.threadingEnabled
    }));
    commentGroup.appendChild(createMenuToggle('顯示階層分隔線', 'showThreadSeparators', state, options.onSettingChange, {
      secondary: true,
      disabled: !state.threadingEnabled
    }));
    commentGroup.appendChild(createMenuSelect('排序方式', 'commentSortMode', [
      { value: 'default', label: '原始' },
      { value: 'hot', label: '熱門排序' }
    ], state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('摺疊留言底欄', 'footerInteractionCollapseEnabled', state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('推噓移至右側', 'reactionInlineEnabled', state, options.onSettingChange));

    var displayGroup = document.createElement('div');
    displayGroup.className = CONTROL_MENU_CLASS + '__group';
    displayGroup.appendChild(createGroupTitle('顯示'));
    displayGroup.appendChild(createMenuToggle('用戶名至底', 'userNameAtBottomEnabled', state, options.onSettingChange));
    displayGroup.appendChild(createMenuSelect('頭像大小', 'avatarDisplay', [
      { value: 'default', label: '預設' },
      { value: 'small', label: '縮小' },
      { value: 'none', label: '隱藏' }
    ], state, options.onSettingChange));
    displayGroup.appendChild(createMenuSelect('頭像樣式', 'avatarShape', [
      { value: 'round', label: '圓形' },
      { value: 'square', label: '方形' }
    ], state, options.onSettingChange));
    displayGroup.appendChild(createMenuToggle('停懸顯示樓層', 'floorAtAvatarEnabled', state, options.onSettingChange));
    displayGroup.appendChild(createMenuSelect('時間顯示', 'timeDisplay', [
      { value: 'default', label: '預設時間' },
      { value: 'relative', label: '相對時間' }
    ], state, options.onSettingChange));

    var imageGroup = document.createElement('div');
    imageGroup.className = CONTROL_MENU_CLASS + '__group';
    imageGroup.appendChild(createGroupTitle('圖片'));
    imageGroup.appendChild(createMenuToggle('縮小預覽', 'imageSmallPreviewEnabled', state, options.onSettingChange, { secondary: true }));
    imageGroup.appendChild(createMenuToggle('停懸顯示', 'imageHoverPreviewEnabled', state, options.onSettingChange, { secondary: true }));

    var layout = document.createElement('div');
    layout.className = CONTROL_MENU_CLASS + '__layout';
    layout.appendChild(commentGroup);
    layout.appendChild(displayGroup);
    layout.appendChild(imageGroup);
    menu.appendChild(layout);
    menu.appendChild(createActions(options.onReset));

    controls.appendChild(gear);
    controls.appendChild(menu);
    host.appendChild(controls);
    installOutsideMenuClose();
    gear.addEventListener('click', function () {
      var shouldOpen = menu.hidden;
      closeMenus(menu);
      menu.hidden = !shouldOpen;
      gear.setAttribute('aria-expanded', String(shouldOpen));
    });
  }

  function sync(state) {
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__switch'), function (toggle) {
      var enabled = Boolean(state[toggle.dataset.commentThreadSetting]);
      toggle.checked = enabled;
      toggle.setAttribute('aria-checked', String(enabled));
      var isThreadingChild = ['hideReplyAnnotation', 'showThreadSeparators']
        .indexOf(toggle.dataset.commentThreadSetting) !== -1;
      toggle.disabled = isThreadingChild && !state.threadingEnabled;
      toggle.closest('label').classList.toggle('is-disabled', toggle.disabled);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__select'), function (select) {
      select.value = state[select.dataset.commentThreadSetting];
      select.disabled = false;
      select.closest('label').classList.remove('is-disabled');
    });
  }

  tools.ui.controlMenu = {
    mount: mount,
    sync: sync
  };
})(window, document);
