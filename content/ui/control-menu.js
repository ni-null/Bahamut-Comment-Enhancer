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
      '.comment-thread-controls-host > .' + CONTROL_BAR_CLASS + ',',
      '.comment-thread-controls-host > .c-reply__head > .' + CONTROL_BAR_CLASS + ' {',
      '  position: static; display: inline-flex;',
      '}',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ' {',
      '  position: absolute; z-index: 11; top: 8px; right: 8px; border: 0; padding: 0; background: none; color: inherit;',
      '  cursor: pointer; line-height: 1; opacity: .55;',
      '}',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ':hover,',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ':focus-visible,',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + '[aria-expanded="true"] { opacity: 1; }',
      '.' + CONTROL_BAR_CLASS + ' > button.' + CONTROL_CLASS + ' > .material-icons { display: block; font-size: 18px; padding: 0; }',
      '.' + CONTROL_MENU_CLASS + ' {',
      '  position: absolute; z-index: 12; top: 34px; right: 8px;',
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
      '.' + CONTROL_MENU_CLASS + '__theme {',
      '  display: flex; align-items: center; justify-content: space-between; min-height: 38px; gap: 12px; margin-bottom: 10px; padding: 5px 8px;',
      '  border: 1px solid rgba(17,126,150,.3); border-radius: 5px; background: rgba(17,126,150,.06); color: #117e96; font-weight: 600;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__theme > .' + CONTROL_MENU_CLASS + '__select { min-width: 132px; color: CanvasText; font-weight: 400; }',
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
      '.' + CONTROL_MENU_CLASS + '__threading-control { position: relative; display: flex; align-items: center; min-width: 0; }',
      '.' + CONTROL_MENU_CLASS + '__threading-control > .' + CONTROL_MENU_CLASS + '__item { flex: 1 1 auto; }',
      '.' + CONTROL_MENU_CLASS + '__threading-settings-button {',
      '  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 26px; width: 26px; height: 26px;',
      '  border: 0; border-radius: 4px; padding: 0; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__threading-settings-button:hover,',
      '.' + CONTROL_MENU_CLASS + '__threading-settings-button:focus-visible,',
      '.' + CONTROL_MENU_CLASS + '__threading-settings-button[aria-expanded="true"] {',
      '  background: rgba(17,126,150,.12); color: #117e96; outline: none;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__threading-settings-button > .material-icons { font-size: 18px; }',
      '.' + CONTROL_MENU_CLASS + '__threading-settings {',
      '  position: absolute; z-index: 20; inset: 0; padding: 0; overflow-y: auto; background: #fff; color: #222;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__threading-settings[hidden] { display: none; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-control { position: relative; display: flex; align-items: center; min-width: 0; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-control-title { flex: 1 1 auto; cursor: default; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings-button {',
      '  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 26px; width: 26px; height: 26px;',
      '  border: 0; border-radius: 4px; padding: 0; background: transparent; color: inherit; cursor: pointer;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings-button:hover,',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings-button:focus-visible,',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings-button[aria-expanded="true"] {',
      '  background: rgba(17,126,150,.12); color: #117e96; outline: none;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings-button > .material-icons { font-size: 18px; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings {',
      '  position: absolute; z-index: 20; inset: 0; padding: 0; overflow-y: auto; background: #fff; color: #222;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__avatar-settings[hidden] { display: none; }',
      '.' + CONTROL_MENU_CLASS + '.avatar-sheet-open > .' + CONTROL_MENU_CLASS + '__theme,',
      '.' + CONTROL_MENU_CLASS + '.avatar-sheet-open > .' + CONTROL_MENU_CLASS + '__tab-row,',
      '.' + CONTROL_MENU_CLASS + '.avatar-sheet-open > .' + CONTROL_MENU_CLASS + '__layout,',
      '.' + CONTROL_MENU_CLASS + '.avatar-sheet-open > .' + CONTROL_MENU_CLASS + '__actions { display: none; }',
      '.' + CONTROL_MENU_CLASS + '.avatar-sheet-open > .' + CONTROL_MENU_CLASS + '__avatar-settings { position: relative; inset: auto; min-height: 360px; }',
      '.' + CONTROL_MENU_CLASS + '.threading-sheet-open > .' + CONTROL_MENU_CLASS + '__theme,',
      '.' + CONTROL_MENU_CLASS + '.threading-sheet-open > .' + CONTROL_MENU_CLASS + '__tab-row,',
      '.' + CONTROL_MENU_CLASS + '.threading-sheet-open > .' + CONTROL_MENU_CLASS + '__layout,',
      '.' + CONTROL_MENU_CLASS + '.threading-sheet-open > .' + CONTROL_MENU_CLASS + '__actions { display: none; }',
      '.' + CONTROL_MENU_CLASS + '.threading-sheet-open > .' + CONTROL_MENU_CLASS + '__threading-settings { position: relative; inset: auto; min-height: 280px; }',
      '.' + CONTROL_MENU_CLASS + '__threading-sheet-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: #eaf4f8; border-bottom: 1px solid #b7d8e4; color: #167f98; font-size: 16px; font-weight: 700; }',
      '.' + CONTROL_MENU_CLASS + '__threading-sheet-body { display: flex; flex-direction: column; gap: 6px; padding: 14px; }',
      '.' + CONTROL_MENU_CLASS + '__threading-sheet-back { margin: 12px 14px 14px; width: calc(100% - 28px); min-height: 40px; border: 1px solid #cfd4da; border-radius: 10px; background: #fff; color: #222; cursor: pointer; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sheet-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: #eaf4f8; border-bottom: 1px solid #b7d8e4; color: #167f98; font-size: 16px; font-weight: 700; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sheet-body { display: flex; flex-direction: column; gap: 14px; padding: 14px; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-options-title { margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 700; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-option { position: relative; display: flex; min-height: 90px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 8px 4px; border: 1px solid #e1e4e8; border-radius: 10px; background: #fff; color: #6b7280; cursor: pointer; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-option:hover { border-color: #b7d8e4; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-option.is-active { border: 2px solid #167f98; background: #eaf4f8; color: #167f98; font-weight: 600; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample { width: 34px; height: 34px; background: linear-gradient(135deg, #5bb5cb, #167f98); }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample.is-small { width: 20px; height: 20px; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample.is-hidden { position: relative; background: transparent; border: 2px dashed #9aa3ab; border-radius: 50%; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample.is-hidden::after { position: absolute; content: ""; width: 24px; height: 2px; top: 7px; left: -4px; transform: rotate(-45deg); background: #9aa3ab; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample.is-round { border-radius: 50%; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sample.is-square { border-radius: 0; }',
      '.' + CONTROL_MENU_CLASS + '__avatar-sheet-back { margin: 12px 14px 14px; width: calc(100% - 28px); min-height: 40px; border: 1px solid #cfd4da; border-radius: 10px; background: #fff; color: #222; cursor: pointer; }',
      '.' + CONTROL_MENU_CLASS + '__shape-preview { display: inline-flex; align-items: center; gap: 5px; margin-left: 6px; }',
      '.' + CONTROL_MENU_CLASS + '__shape-swatch { width: 16px; height: 16px; border: 2px solid #9aa5ad; background: #dce8ec; }',
      '.' + CONTROL_MENU_CLASS + '__shape-swatch[data-shape="round"] { border-radius: 50%; }',
      '.' + CONTROL_MENU_CLASS + '__shape-swatch[data-shape="square"] { border-radius: 3px; }',
      '.' + CONTROL_MENU_CLASS + '__shape-swatch.is-active { border-color: #167f98; background: #b7d8e4; box-shadow: 0 0 0 2px rgba(22,127,152,.16); }',
      '@media (max-width: 480px) {',
      '  .' + CONTROL_MENU_CLASS + '__layout { grid-template-columns: minmax(0, 1fr); }',
      '  .' + CONTROL_MENU_CLASS + '__group { grid-template-columns: minmax(0, 1fr); }',
      '}',
      '.' + CONTROL_MENU_CLASS + '__subitem { padding-left: 3px; font-size: .92em; }',
      '.' + CONTROL_MENU_CLASS + '__item.is-hidden { display: none !important; }',
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
      '.' + CONTROL_MENU_CLASS + '__number {',
      '  width: 82px; border: 1px solid rgba(127,127,127,.55); border-radius: 4px;',
      '  padding: 3px 5px; background: Canvas; color: CanvasText;',
      '}',
      '.' + CONTROL_MENU_CLASS + '__select:focus { border-color: #117e96; outline: 2px solid rgba(17,126,150,.3); }',
      '.' + CONTROL_MENU_CLASS + '__number:focus { border-color: #117e96; outline: 2px solid rgba(17,126,150,.3); }',
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
      '.' + CONTROL_MENU_CLASS + '__rating-star { color: #f5b82e; font-size: 21px; line-height: 1; text-shadow: 0 1px 0 rgba(166,104,0,.28); }',
      '.' + CONTROL_MENU_CLASS + '__info:hover,',
      '.' + CONTROL_MENU_CLASS + '__info:focus-visible,',
      '.' + CONTROL_MENU_CLASS + '__info[aria-expanded="true"] {',
      '  border-color: #117e96; background: rgba(17,126,150,.1); color: #117e96;',
      '  outline: none;',
      '}',
      /* settings-panel.html 視覺：把現有動態控制項放入白色設定卡片。 */
      '.' + CONTROL_MENU_CLASS + ' { width: min(520px, calc(100vw - 24px)); max-height: none; padding: 0; overflow: visible; border: 0; border-radius: 16px; background: #fff; color: #222; box-shadow: 0 8px 30px rgba(0,0,0,.2); font: 15px -apple-system, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif; }',
      '.' + CONTROL_MENU_CLASS + '__theme { position: sticky; top: 0; z-index: 5; min-height: 56px; margin: 0; padding: 10px 16px; border: 0; border-bottom: 1px solid #b7d8e4; border-radius: 16px 16px 0 0; background: #eaf4f8; color: #167f98; font-size: 17px; }',
      '.' + CONTROL_MENU_CLASS + '__theme-label { display: flex; align-items: center; gap: 8px; font-weight: 700; }',
      '.' + CONTROL_MENU_CLASS + '__theme-icon { font-size: 20px; }',
      '.' + CONTROL_MENU_CLASS + '__about { grid-column: 1 / -1; width: 100%; max-height: 65vh; overflow-y: auto; padding: 18px; }',
      '.' + CONTROL_MENU_CLASS + '__about h2 { margin: 0 36px 8px 0; color: #167f98; font-size: 1.1em; }',
      '.' + CONTROL_MENU_CLASS + '__about h3 { margin: 12px 0 4px; color: #167f98; font-size: .95em; }',
      '.' + CONTROL_MENU_CLASS + '__about p { margin: 0; font-size: .92em; line-height: 1.6; overflow-wrap: anywhere; }',
      '.' + CONTROL_MENU_CLASS + '__about p + p { margin-top: 5px; }',
      '.' + CONTROL_MENU_CLASS + '__about a { color: #167f98; }',
      '.' + CONTROL_MENU_CLASS + '__theme > .' + CONTROL_MENU_CLASS + '__select { min-width: 120px; padding: 7px 30px 7px 12px; border: 1px solid #b7d8e4; border-radius: 8px; background-color: #fff; color: #222; font-size: 14px; }',
      '.' + CONTROL_MENU_CLASS + '__layout { display: flex; flex-direction: column; gap: 10px; padding: 12px; }',
      '.' + CONTROL_MENU_CLASS + '__tab-row { display: flex; align-items: stretch; gap: 8px; margin: 12px 14px 0; }',
      '.' + CONTROL_MENU_CLASS + '__tabs { display: flex; flex: 1 1 auto; gap: 4px; margin: 0; padding: 4px; border-radius: 10px; background: #eceff2; }',
      '.' + CONTROL_MENU_CLASS + '__about-button { display: inline-flex; flex: 0 0 42px; align-items: center; justify-content: center; border: 1px solid #cfd4da; border-radius: 10px; background: #fff; color: #6b7280; cursor: pointer; }',
      '.' + CONTROL_MENU_CLASS + '__about-button:hover, .' + CONTROL_MENU_CLASS + '__about-button:focus-visible { border-color: #167f98; background: #eaf4f8; color: #167f98; outline: none; }',
      '.' + CONTROL_MENU_CLASS + '__about-button[aria-pressed="true"] { border-color: #167f98; background: #eaf4f8; color: #167f98; }',
      '.' + CONTROL_MENU_CLASS + '__tab { display: flex; flex: 1 1 0; align-items: center; justify-content: center; gap: 6px; min-width: 0; padding: 8px 6px; border: 0; border-radius: 7px; background: transparent; color: #6b7280; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s, box-shadow .15s; }',
      '.' + CONTROL_MENU_CLASS + '__tab:hover { color: #167f98; }',
      '.' + CONTROL_MENU_CLASS + '__tab[aria-selected="true"] { background: #fff; color: #167f98; box-shadow: 0 1px 3px rgba(0,0,0,.15); }',
      '.' + CONTROL_MENU_CLASS + '__tab-panel { display: none; }',
      '.' + CONTROL_MENU_CLASS + '__tab-panel.is-active { display: block; animation: comment-thread-tab-fade .18s ease; }',
      '@keyframes comment-thread-tab-fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }',
      '.' + CONTROL_MENU_CLASS + '__group { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 16px; padding: 10px 12px 6px; border: 1px solid #e1e4e8; border-radius: 12px; background: #f7f8f9; }',
      '.' + CONTROL_MENU_CLASS + '__group-title { position: relative; padding: 0 0 6px; color: #167f98; font-size: 13px; letter-spacing: .08em; }',
      '.' + CONTROL_MENU_CLASS + '__group-title::after { position: absolute; right: 0; bottom: 12px; left: 46px; height: 1px; background: #e1e4e8; content: ""; }',
      '.' + CONTROL_MENU_CLASS + '__item { min-width: 0; min-height: 40px; gap: 6px; padding: 2px 0; color: #222; white-space: normal; font-size: 14px; }',
      '.' + CONTROL_MENU_CLASS + '__switch-track { width: 46px; height: 26px; border: 0; background: #c4c7cc; }',
      '.' + CONTROL_MENU_CLASS + '__switch-track::after { top: 3px; left: 3px; width: 20px; height: 20px; }',
      '.' + CONTROL_MENU_CLASS + '__switch:checked + .' + CONTROL_MENU_CLASS + '__switch-track { border-color: #167f98; background: #167f98; }',
      '.' + CONTROL_MENU_CLASS + '__switch:checked + .' + CONTROL_MENU_CLASS + '__switch-track::after { transform: translateX(20px); }',
      '.' + CONTROL_MENU_CLASS + '__select, .' + CONTROL_MENU_CLASS + '__number { min-width: 0; max-width: 125px; padding: 6px 24px 6px 8px; border: 1px solid #cfd4da; border-radius: 8px; background-color: #fff; color: #222; font-size: 12px; }',
      '.' + CONTROL_MENU_CLASS + '__actions { margin: 0; padding: 12px 14px 14px; border-top: 1px solid #e1e4e8; background: #fff; }',
      '.' + CONTROL_MENU_CLASS + '__reset, .' + CONTROL_MENU_CLASS + '__info { min-height: 42px; border: 1px solid #cfd4da; border-radius: 10px; background: #fff; }',
      '.' + CONTROL_MENU_CLASS + '__info { flex-basis: 44px; }',
      '@media (prefers-color-scheme: dark) {',
      '  .' + CONTROL_MENU_CLASS + ' { background: #1d2125; color: #e8eaed; }',
      '  .' + CONTROL_MENU_CLASS + '__theme { background: #1f3a44; border-color: #2f5967; color: #3fb2cc; }',
      '  .' + CONTROL_MENU_CLASS + '__group { background: #262b30; border-color: #383e45; }',
      '  .' + CONTROL_MENU_CLASS + '__tabs { background: #14171a; }',
      '  .' + CONTROL_MENU_CLASS + '__tab[aria-selected="true"] { background: #262b30; }',
      '  .' + CONTROL_MENU_CLASS + '__group-title { color: #3fb2cc; }',
      '  .' + CONTROL_MENU_CLASS + '__group-title::after { background: #383e45; }',
      '  .' + CONTROL_MENU_CLASS + '__item { color: #e8eaed; }',
      '  .' + CONTROL_MENU_CLASS + '__select, .' + CONTROL_MENU_CLASS + '__number { background-color: #1d2125; color: #e8eaed; border-color: #444b53; }',
      '  .' + CONTROL_MENU_CLASS + '__actions { background: #1d2125; }',
      '  .' + CONTROL_MENU_CLASS + '__reset, .' + CONTROL_MENU_CLASS + '__info { background: #1d2125; color: #e8eaed; border-color: #444b53; }',
      '}',
      '@media (max-width: 600px) {',
      '  .' + CONTROL_MENU_CLASS + ' { width: min(440px, calc(100vw - 16px)); }',
      '  .' + CONTROL_MENU_CLASS + '__group { grid-template-columns: minmax(0, 1fr); }',
      '  .' + CONTROL_MENU_CLASS + '__item { min-height: 38px; }',
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

  function createThreadingControl(state, onSettingChange) {
    var control = document.createElement('div');
    control.className = CONTROL_MENU_CLASS + '__threading-control';
    control.appendChild(createMenuToggle('階層留言', 'threadingEnabled', state, onSettingChange));

    var settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = CONTROL_MENU_CLASS + '__threading-settings-button';
    settingsButton.setAttribute('aria-label', '展開階層留言設定');
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.title = '階層留言設定';
    settingsButton.appendChild(createMaterialIcon('tune'));

    var settings = document.createElement('div');
    settings.className = CONTROL_MENU_CLASS + '__threading-settings';
    settings._commentThreadThreadingControl = control;
    settings._commentThreadThreadingButton = settingsButton;
    settings.hidden = true;
    var sheetHead = document.createElement('div');
    sheetHead.className = CONTROL_MENU_CLASS + '__threading-sheet-head';
    var backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = CONTROL_MENU_CLASS + '__threading-settings-button';
    backButton.setAttribute('aria-label', '返回設定');
    backButton.appendChild(createMaterialIcon('arrow_back'));
    sheetHead.appendChild(backButton);
    sheetHead.appendChild(document.createTextNode('階層留言設定'));
    settings.appendChild(sheetHead);
    var sheetBody = document.createElement('div');
    sheetBody.className = CONTROL_MENU_CLASS + '__threading-sheet-body';
    sheetBody.appendChild(createMenuToggle('階層時遮蔽樓層', 'hideReplyAnnotation', state, onSettingChange, {
      disabled: !state.threadingEnabled
    }));
    sheetBody.appendChild(createMenuToggle('顯示階層分隔線', 'showThreadSeparators', state, onSettingChange, {
      disabled: !state.threadingEnabled
    }));
    sheetBody.appendChild(createMenuToggle('收合階層', 'collapseThreadingEnabled', state, onSettingChange, {
      disabled: !state.threadingEnabled
    }));
    settings.appendChild(sheetBody);
    var returnButton = document.createElement('button');
    returnButton.type = 'button';
    returnButton.className = CONTROL_MENU_CLASS + '__threading-sheet-back';
    returnButton.textContent = '返回設定';
    settings.appendChild(returnButton);
    function closeSheet() {
      restoreThreadingSheet(settings);
      settingsButton.focus();
    }
    backButton.addEventListener('click', closeSheet);
    returnButton.addEventListener('click', closeSheet);

    settingsButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var shouldOpen = settings.hidden;
      closeSettingsPanels(control.closest('.' + CONTROL_MENU_CLASS), shouldOpen ? settings : null);
      if (shouldOpen) control.closest('.' + CONTROL_MENU_CLASS).appendChild(settings);
      settings.hidden = !shouldOpen;
      control.closest('.' + CONTROL_MENU_CLASS).classList.toggle('threading-sheet-open', shouldOpen);
      settingsButton.setAttribute('aria-expanded', String(shouldOpen));
    });
    control.appendChild(settingsButton);
    control.appendChild(settings);
    return control;
  }

  function restoreThreadingSheet(settings) {
    if (!settings || !settings._commentThreadThreadingControl) return;
    var control = settings._commentThreadThreadingControl;
    var menu = control.closest('.' + CONTROL_MENU_CLASS);
    control.appendChild(settings);
    settings.hidden = true;
    if (menu) menu.classList.remove('threading-sheet-open');
    if (settings._commentThreadThreadingButton) {
      settings._commentThreadThreadingButton.setAttribute('aria-expanded', 'false');
    }
  }

  function createAvatarControl(state, onSettingChange) {
    var control = document.createElement('div');
    control.className = CONTROL_MENU_CLASS + '__avatar-control';

    var title = document.createElement('div');
    title.className = CONTROL_MENU_CLASS + '__item ' + CONTROL_MENU_CLASS + '__avatar-control-title';
    title.textContent = '頭像樣式';
    control.appendChild(title);

    var settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = CONTROL_MENU_CLASS + '__avatar-settings-button';
    settingsButton.setAttribute('aria-label', '展開頭像樣式設定');
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.title = '頭像樣式設定';
    settingsButton.appendChild(createMaterialIcon('tune'));

    var settings = document.createElement('div');
    settings.className = CONTROL_MENU_CLASS + '__avatar-settings';
    settings._commentThreadAvatarControl = control;
    settings._commentThreadAvatarButton = settingsButton;
    settings.hidden = true;
    var sheetHead = document.createElement('div');
    sheetHead.className = CONTROL_MENU_CLASS + '__avatar-sheet-head';
    var backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = CONTROL_MENU_CLASS + '__avatar-settings-button';
    backButton.setAttribute('aria-label', '返回設定');
    backButton.appendChild(createMaterialIcon('arrow_back'));
    sheetHead.appendChild(backButton);
    sheetHead.appendChild(document.createTextNode('頭像樣式'));
    settings.appendChild(sheetHead);
    var body = document.createElement('div');
    body.className = CONTROL_MENU_CLASS + '__avatar-sheet-body';
    var sizeGroup = createAvatarOptionGroup('頭像大小', 'avatarDisplay', [
      { value: 'default', label: '預設', sample: 'large' },
      { value: 'small', label: '縮小', sample: 'small' },
      { value: 'none', label: '隱藏', sample: 'hidden' }
    ], state.avatarDisplay, onSettingChange);
    var shapeGroup = createAvatarOptionGroup('頭像形狀', 'avatarShape', [
      { value: 'round', label: '圓形', sample: 'round' },
      { value: 'square', label: '方形', sample: 'square' }
    ], state.avatarShape, onSettingChange);
    body.appendChild(sizeGroup);
    body.appendChild(shapeGroup);
    body.appendChild(createMenuToggle('停懸顯示樓層', 'floorAtAvatarEnabled', state, onSettingChange));
    settings.appendChild(body);
    var returnButton = document.createElement('button');
    returnButton.type = 'button';
    returnButton.className = CONTROL_MENU_CLASS + '__avatar-sheet-back';
    returnButton.textContent = '返回設定';
    settings.appendChild(returnButton);
    function closeSheet() {
      restoreAvatarSheet(settings);
      settingsButton.focus();
    }
    backButton.addEventListener('click', closeSheet);
    returnButton.addEventListener('click', closeSheet);

    settingsButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var shouldOpen = settings.hidden;
      closeSettingsPanels(control.closest('.' + CONTROL_MENU_CLASS), shouldOpen ? settings : null);
      if (shouldOpen) control.closest('.' + CONTROL_MENU_CLASS).appendChild(settings);
      settings.hidden = !shouldOpen;
      control.closest('.' + CONTROL_MENU_CLASS).classList.toggle('avatar-sheet-open', shouldOpen);
      settingsButton.setAttribute('aria-expanded', String(shouldOpen));
    });
    control.appendChild(settingsButton);
    control.appendChild(settings);
    return control;
  }

  function restoreAvatarSheet(settings) {
    if (!settings || !settings._commentThreadAvatarControl) return;
    var control = settings._commentThreadAvatarControl;
    var menu = control.closest('.' + CONTROL_MENU_CLASS);
    control.appendChild(settings);
    settings.hidden = true;
    if (menu) menu.classList.remove('avatar-sheet-open');
    if (settings._commentThreadAvatarButton) {
      settings._commentThreadAvatarButton.setAttribute('aria-expanded', 'false');
    }
  }

  function createAvatarOptionGroup(titleText, settingName, options, selectedValue, onSettingChange) {
    var group = document.createElement('section');
    var title = document.createElement('p');
    title.className = CONTROL_MENU_CLASS + '__avatar-options-title';
    title.textContent = titleText;
    group.appendChild(title);
    var grid = document.createElement('div');
    grid.className = CONTROL_MENU_CLASS + '__avatar-options';
    options.forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = CONTROL_MENU_CLASS + '__avatar-option';
      button.dataset.commentThreadSetting = settingName;
      button.dataset.commentThreadValue = option.value;
      button.classList.toggle('is-active', option.value === selectedValue);
      button.setAttribute('aria-pressed', String(option.value === selectedValue));
      var sample = document.createElement('span');
      sample.className = CONTROL_MENU_CLASS + '__avatar-sample is-' + option.sample;
      if (settingName === 'avatarShape') sample.classList.add('is-' + option.value);
      sample.setAttribute('aria-hidden', 'true');
      button.appendChild(sample);
      button.appendChild(document.createTextNode(option.label));
      button.addEventListener('click', function () {
        Array.prototype.forEach.call(grid.children, function (sibling) {
          var selected = sibling === button;
          sibling.classList.toggle('is-active', selected);
          sibling.setAttribute('aria-pressed', String(selected));
        });
        onSettingChange(settingName, option.value);
      });
      grid.appendChild(button);
    });
    group.appendChild(grid);
    return group;
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

  function createMenuNumber(labelText, settingName, state, onSettingChange, config) {
    config = config || {};
    var label = document.createElement('label');
    label.className = CONTROL_MENU_CLASS + '__item' + (config.secondary ? ' ' + CONTROL_MENU_CLASS + '__subitem' : '');
    if (config.visibleWhen) label.dataset.commentThreadVisibleWhen = config.visibleWhen.setting + ':' + config.visibleWhen.value;
    label.appendChild(document.createTextNode(labelText));

    var input = document.createElement('input');
    input.type = 'number';
    input.className = CONTROL_MENU_CLASS + '__number';
    input.dataset.commentThreadSetting = settingName;
    input.min = String(config.min || 1);
    input.max = String(config.max || 9999);
    input.step = String(config.step || 1);
    input.value = String(state[settingName]);
    input.addEventListener('change', function () {
      onSettingChange(settingName, Number(input.value));
    });
    label.appendChild(input);
    return label;
  }

  function createGroupTitle(titleText) {
    var title = document.createElement('div');
    title.className = CONTROL_MENU_CLASS + '__group-title';
    title.textContent = titleText;
    return title;
  }

  function createMaterialIcon(name) {
    var icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = name;
    return icon;
  }

  function getReviewUrl() {
    var userAgent = window.navigator && window.navigator.userAgent || '';
    if (/Firefox\//i.test(userAgent)) {
      return 'https://addons.mozilla.org/zh-TW/firefox/addon/%E5%B7%B4%E5%93%88%E7%95%99%E8%A8%80%E5%84%AA%E5%8C%96%E5%B7%A5%E5%85%B7/';
    }
    if (/Edg\//i.test(userAgent)) {
      return 'https://microsoftedge.microsoft.com/addons/detail/%E5%B7%B4%E5%93%88%E7%95%99%E8%A8%80%E5%84%AA%E5%8C%96%E5%B7%A5%E5%85%B7/egcajbhfhbcjlomacfpildafplkcpfah';
    }
    return 'https://chromewebstore.google.com/detail/%E5%B7%B4%E5%93%88%E7%95%99%E8%A8%80%E5%84%AA%E5%8C%96%E5%B7%A5%E5%85%B7/nbllccpklpphcngdiboanikcpjiicckp';
  }

  function createAboutButton(onOpen) {
    var aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = CONTROL_MENU_CLASS + '__about-button';
    aboutButton.setAttribute('aria-label', '查看開發者資訊與功能介紹');
    aboutButton.setAttribute('aria-pressed', 'false');
    aboutButton.title = '關於';
    aboutButton.appendChild(createMaterialIcon('info'));
    aboutButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      onOpen(aboutButton);
    });
    return aboutButton;
  }

  function createAboutPanel() {
    var group = document.createElement('section');
    group.className = CONTROL_MENU_CLASS + '__group';
    var version = tools.version || (window.chrome && window.chrome.runtime && window.chrome.runtime.getManifest
      ? window.chrome.runtime.getManifest().version
      : '—');
    var details = document.createElement('div');
    details.className = CONTROL_MENU_CLASS + '__about';
    var versionText = document.createElement('p');
    versionText.textContent = '版本：' + version + '・瀏覽器擴充功能／Userscript';
    var developer = document.createElement('p');
    developer.textContent = '開發者：ninull';
    var project = document.createElement('p');
    project.appendChild(document.createTextNode('專案網址：'));
    var projectLink = document.createElement('a');
    projectLink.href = 'https://github.com/ni-null/Bahamut-Comment-Enhancer';
    projectLink.target = '_blank';
    projectLink.rel = 'noopener noreferrer';
    projectLink.textContent = 'github.com/ni-null/Bahamut-Comment-Enhancer';
    project.appendChild(projectLink);
    var introduction = document.createElement('p');
    introduction.textContent = '支援預設、區塊化與 GNN 主題，並提供階層留言、排序、顯示與媒體工具。功能僅在巴哈姆特 C.php、Co.php 頁面運作。';
    details.appendChild(versionText);
    details.appendChild(developer);
    details.appendChild(project);
    details.appendChild(introduction);
    group.appendChild(details);
    return group;
  }

  function createActions() {
    var actions = document.createElement('div');
    actions.className = CONTROL_MENU_CLASS + '__actions';
    var row = document.createElement('div');
    row.className = CONTROL_MENU_CLASS + '__actions-row';

    var resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = CONTROL_MENU_CLASS + '__reset';
    resetButton.title = '前往擴充功能商店留下評價';
    var ratingStar = createMaterialIcon('star');
    ratingStar.className += ' ' + CONTROL_MENU_CLASS + '__rating-star';
    resetButton.appendChild(ratingStar);
    resetButton.appendChild(document.createTextNode('無廣告無營利，給個好評吧'));
    resetButton.setAttribute('type', 'button');
    resetButton.addEventListener('click', function () {
      window.open(getReviewUrl(), '_blank', 'noopener');
    });
    row.appendChild(resetButton);

    actions.appendChild(row);
    return actions;
  }

  function closeSettingsPanels(container, exceptSettings) {
    if (!container) return;
    Array.prototype.forEach.call(container.querySelectorAll(
        '.' + CONTROL_MENU_CLASS + '__threading-settings, .' + CONTROL_MENU_CLASS + '__avatar-settings'
      ), function (settings) {
      if (settings === exceptSettings) return;
      if (settings.classList.contains(CONTROL_MENU_CLASS + '__threading-settings')) {
        restoreThreadingSheet(settings);
        return;
      }
      if (settings.classList.contains(CONTROL_MENU_CLASS + '__avatar-settings')) {
        restoreAvatarSheet(settings);
        return;
      }
      settings.hidden = true;
      var settingsButton = settings.previousElementSibling;
      if (settingsButton) settingsButton.setAttribute('aria-expanded', 'false');
    });
  }

  function closeMenus(exceptMenu) {
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS), function (menu) {
      if (menu !== exceptMenu) {
        menu.hidden = true;
        var gear = menu.parentElement.querySelector('button.' + CONTROL_CLASS);
        if (gear) gear.setAttribute('aria-expanded', 'false');
      }
      closeSettingsPanels(menu);
    });
  }

  function installOutsideMenuClose() {
    if (document._commentThreadOutsideMenuCloseInstalled) return;
    document._commentThreadOutsideMenuCloseInstalled = true;
    document.addEventListener('click', function (event) {
      var target = event.target;
      var controls = target && target.closest && target.closest('.' + CONTROL_BAR_CLASS);
      if (!controls) {
        closeMenus();
        return;
      }
      if (!target.closest(
          '.' + CONTROL_MENU_CLASS + '__threading-control, .' + CONTROL_MENU_CLASS + '__threading-settings, .' + CONTROL_MENU_CLASS + '__avatar-control, .' + CONTROL_MENU_CLASS + '__avatar-settings'
        )) {
        closeSettingsPanels(controls);
      }
    });
  }

  function getDirectControls(host) {
    var controls = Array.prototype.find.call(host.children, function (child) {
      return child.classList.contains(CONTROL_BAR_CLASS);
    });
    if (controls) return controls;
    var replyHead = Array.prototype.find.call(host.children, function (child) {
      return child.matches('.c-reply__head');
    });
    return replyHead && Array.prototype.find.call(replyHead.children, function (child) {
      return child.classList.contains(CONTROL_BAR_CLASS);
    });
  }

  function removeLegacyControlsHeader(host) {
    var legacyHeader = Array.prototype.find.call(host.children, function (child) {
      return child.classList.contains('comment-thread-controls-header');
    });
    if (!legacyHeader) return;
    var replyHead = Array.prototype.find.call(legacyHeader.children, function (child) {
      return child.matches('.c-reply__head');
    });
    if (replyHead) host.insertBefore(replyHead, legacyHeader);
    legacyHeader.remove();
  }

  function getControlsTarget(host) {
    return Array.prototype.find.call(host.children, function (child) {
      return child.matches('.c-reply__head');
    }) || host;
  }

  function createValidationMessage(reason) {
    var validation = document.createElement('div');
    validation.className = CONTROL_MENU_CLASS + '__validation';
    validation.setAttribute('role', 'status');
    var title = document.createElement('p');
    title.className = CONTROL_MENU_CLASS + '__validation-title';
    title.textContent = '驗證失敗，功能暫時停用';
    var message = document.createElement('p');
    message.className = CONTROL_MENU_CLASS + '__validation-message';
    message.textContent = reason + ' 頁面結構恢復後會自動重新檢查。';
    validation.appendChild(title);
    validation.appendChild(message);
    return validation;
  }

  function mount(host, options) {
    if (!host) return;

    addStyles();
    host.classList.add('comment-thread-controls-host');
    var existingControls = getDirectControls(host);
    if (existingControls) existingControls.remove();
    removeLegacyControlsHeader(host);
    var controlsTarget = getControlsTarget(host);
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
    gear.appendChild(createMaterialIcon('settings'));

    var menu = document.createElement('div');
    menu.className = CONTROL_MENU_CLASS;
    menu.hidden = true;

    if (!isValid) {
      menu.appendChild(createValidationMessage(options.validation.reason));
      controls.appendChild(gear);
      controls.appendChild(menu);
      controlsTarget.appendChild(controls);
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
    commentGroup.appendChild(createThreadingControl(state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('自動展開所有留言', 'autoExpandCommentsEnabled', state, options.onSettingChange));
    commentGroup.appendChild(createMenuSelect('排序方式', 'commentSortMode', [
      { value: 'default', label: '原始' },
      { value: 'hot', label: '熱門排序' }
    ], state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('收合底欄', 'footerInteractionCollapseEnabled', state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('回覆框跟隨留言', 'replyEditorFollowEnabled', state, options.onSettingChange));
    commentGroup.appendChild(createMenuToggle('標記優化', 'markerEnhancementEnabled', state, options.onSettingChange));

    var displayGroup = document.createElement('div');
    displayGroup.className = CONTROL_MENU_CLASS + '__group';
    displayGroup.appendChild(createMenuToggle('用戶名至底', 'userNameAtBottomEnabled', state, options.onSettingChange));
    displayGroup.appendChild(createAvatarControl(state, options.onSettingChange));
    displayGroup.appendChild(createMenuSelect('時間顯示', 'timeDisplay', [
      { value: 'default', label: '預設時間' },
      { value: 'full', label: '完整時間' },
      { value: 'relative', label: '相對時間' }
    ], state, options.onSettingChange));
    displayGroup.appendChild(createMenuToggle('隱藏 HOT 標籤', 'hideHotTagEnabled', state, options.onSettingChange));
    displayGroup.appendChild(createMenuToggle('推噓移至右側', 'reactionInlineEnabled', state, options.onSettingChange));
    displayGroup.appendChild(createMenuSelect('留言區高度', 'commentAreaHeightMode', [
      { value: 'unlimited', label: '不限制' },
      { value: 'compact', label: '480px' },
      { value: 'large', label: '720px' },
      { value: 'custom', label: '自訂高度' }
    ], state, options.onSettingChange));
    displayGroup.appendChild(createMenuNumber('自訂高度 (px)', 'commentAreaCustomHeight', state, options.onSettingChange, {
      min: 120,
      max: 5000,
      step: 10,
      visibleWhen: { setting: 'commentAreaHeightMode', value: 'custom' }
    }));

    var imageGroup = document.createElement('div');
    imageGroup.className = CONTROL_MENU_CLASS + '__group';
    imageGroup.appendChild(createMenuToggle('縮小預覽', 'imageSmallPreviewEnabled', state, options.onSettingChange, { secondary: true }));
    imageGroup.appendChild(createMenuToggle('自訂圖片燈箱', 'imageLightboxEnabled', state, options.onSettingChange, { secondary: true }));
    imageGroup.appendChild(createMenuToggle('YouTube 燈箱播放', 'youtubeLightboxEnabled', state, options.onSettingChange, { secondary: true }));
    var aboutGroup = createAboutPanel();

    var layout = document.createElement('div');
    layout.className = CONTROL_MENU_CLASS + '__layout';
    var tabs = document.createElement('div');
    tabs.className = CONTROL_MENU_CLASS + '__tabs';
    tabs.setAttribute('role', 'tablist');
    var tabDefinitions = [
      { id: 'comment', label: '留言', icon: 'forum', group: commentGroup },
      { id: 'display', label: '顯示', icon: 'visibility', group: displayGroup },
      { id: 'media', label: '媒體', icon: 'image', group: imageGroup }
    ];
    var tabPanels = [];
    var aboutPanel = document.createElement('div');
    aboutPanel.className = CONTROL_MENU_CLASS + '__tab-panel';
    aboutPanel.setAttribute('role', 'tabpanel');
    aboutPanel.appendChild(aboutGroup);
    var aboutButton;
    function showSettingsPanel(index) {
      Array.prototype.forEach.call(tabs.children, function (sibling, siblingIndex) {
        sibling.setAttribute('aria-selected', String(siblingIndex === index));
      });
      tabPanels.forEach(function (tabPanel, panelIndex) {
        tabPanel.classList.toggle('is-active', panelIndex === index);
      });
      aboutPanel.classList.remove('is-active');
      if (aboutButton) aboutButton.setAttribute('aria-pressed', 'false');
    }
    tabDefinitions.forEach(function (definition, index) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = CONTROL_MENU_CLASS + '__tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(index === 0));
      tab.appendChild(createMaterialIcon(definition.icon));
      tab.appendChild(document.createTextNode(definition.label));
      var panel = document.createElement('div');
      panel.className = CONTROL_MENU_CLASS + '__tab-panel' + (index === 0 ? ' is-active' : '');
      panel.setAttribute('role', 'tabpanel');
      panel.appendChild(definition.group);
      tab.addEventListener('click', function () {
        showSettingsPanel(index);
      });
      tabs.appendChild(tab);
      tabPanels.push(panel);
    });
    tabPanels.forEach(function (panel) { layout.appendChild(panel); });
    layout.appendChild(aboutPanel);
    var themeControl = document.createElement('div');
    themeControl.className = CONTROL_MENU_CLASS + '__theme';
    var themeLabel = document.createElement('div');
    themeLabel.className = CONTROL_MENU_CLASS + '__theme-label';
    var themeIcon = createMaterialIcon('palette');
    themeIcon.className += ' ' + CONTROL_MENU_CLASS + '__theme-icon';
    themeLabel.appendChild(themeIcon);
    themeLabel.appendChild(document.createTextNode('主題'));
    themeControl.appendChild(themeLabel);
    var themeSelect = createMenuSelect(
      '',
      'commentStyle',
      tools.features.commentStyles.getOptions(),
      state,
      options.onSettingChange
    );
    themeSelect.classList.add(CONTROL_MENU_CLASS + '__theme-select-control');
    themeControl.appendChild(themeSelect.querySelector('select'));
    var tabRow = document.createElement('div');
    tabRow.className = CONTROL_MENU_CLASS + '__tab-row';
    tabRow.appendChild(tabs);
    aboutButton = createAboutButton(function () {
      Array.prototype.forEach.call(tabs.children, function (tab) {
        tab.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(function (panel) { panel.classList.remove('is-active'); });
      aboutPanel.classList.add('is-active');
      aboutButton.setAttribute('aria-pressed', 'true');
    });
    tabRow.appendChild(aboutButton);
    menu.appendChild(themeControl);
    menu.appendChild(tabRow);
    menu.appendChild(layout);
    menu.appendChild(createActions());

    controls.appendChild(gear);
    controls.appendChild(menu);
    controlsTarget.appendChild(controls);
    installOutsideMenuClose();
    gear.addEventListener('click', function () {
      var shouldOpen = menu.hidden;
      closeMenus(menu);
      menu.hidden = !shouldOpen;
      gear.setAttribute('aria-expanded', String(shouldOpen));
    });
    sync(state, options.getDisabledSettings ? options.getDisabledSettings() : []);
  }

  function sync(state, disabledSettings) {
    disabledSettings = disabledSettings || [];
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__avatar-option'), function (option) {
      var selected = state[option.dataset.commentThreadSetting] === option.dataset.commentThreadValue;
      option.classList.toggle('is-active', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__switch'), function (toggle) {
      var enabled = Boolean(state[toggle.dataset.commentThreadSetting]);
      toggle.checked = enabled;
      toggle.setAttribute('aria-checked', String(enabled));
      var isThreadingChild = ['hideReplyAnnotation', 'showThreadSeparators', 'collapseThreadingEnabled']
        .indexOf(toggle.dataset.commentThreadSetting) !== -1;
      var disabledByStyle = disabledSettings.indexOf(toggle.dataset.commentThreadSetting) !== -1;
      toggle.disabled = (isThreadingChild && !state.threadingEnabled) || disabledByStyle;
      var toggleLabel = toggle.closest('label');
      // 主題衝突的功能不應佔用選單版面；階層留言未開啟的次選項則維持可見但停用。
      toggleLabel.hidden = false;
      toggleLabel.classList.toggle('is-hidden', disabledByStyle);
      toggleLabel.classList.toggle('is-disabled', toggle.disabled && !disabledByStyle);
      toggleLabel.title = '';
    });
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__select'), function (select) {
      select.value = state[select.dataset.commentThreadSetting];
      var disabledByStyle = disabledSettings.indexOf(select.dataset.commentThreadSetting) !== -1;
      select.disabled = disabledByStyle;
      var selectLabel = select.closest('label');
      if (selectLabel) {
        selectLabel.hidden = false;
        selectLabel.classList.toggle('is-hidden', disabledByStyle);
        selectLabel.classList.toggle('is-disabled', false);
        selectLabel.title = '';
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.' + CONTROL_MENU_CLASS + '__number'), function (input) {
      input.value = String(state[input.dataset.commentThreadSetting]);
      var disabledByStyle = disabledSettings.indexOf(input.dataset.commentThreadSetting) !== -1;
      input.disabled = disabledByStyle;
      var numberLabel = input.closest('label');
      numberLabel.classList.toggle('is-hidden', disabledByStyle);
      numberLabel.classList.toggle('is-disabled', false);
      numberLabel.title = '';
    });
    Array.prototype.forEach.call(document.querySelectorAll('label[data-comment-thread-visible-when]'), function (label) {
      var rule = label.dataset.commentThreadVisibleWhen.split(':');
      var isVisible = state[rule[0]] === rule[1];
      label.classList.toggle('is-hidden', !isVisible || disabledSettings.indexOf(label.querySelector('[data-comment-thread-setting]').dataset.commentThreadSetting) !== -1);
    });
  }

  tools.ui.controlMenu = {
    mount: mount,
    sync: sync
  };
})(window, document);
