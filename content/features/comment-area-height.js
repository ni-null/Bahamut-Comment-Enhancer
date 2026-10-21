/**
 * 功能簡介：限制 Commendlist 留言清單高度，讓超出的留言內容以垂直捲軸閱讀。
 * 僅修改清單的 inline style；選擇不限制或卸載時會完整還原原本樣式。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var HEIGHTS = Object.freeze({ compact: 480, large: 720 });
  var STYLE_ID = 'comment-thread-area-height-styles';
  var LIMITED_ATTRIBUTE = 'data-comment-thread-area-height-limited';
  var originalStyles = new WeakMap();

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '[' + LIMITED_ATTRIBUTE + '="true"] { scrollbar-width: thin; scrollbar-color: rgba(96, 112, 112, .28) transparent; }',
      '[' + LIMITED_ATTRIBUTE + '="true"]::-webkit-scrollbar { width: 8px; height: 8px; }',
      '[' + LIMITED_ATTRIBUTE + '="true"]::-webkit-scrollbar-track { background: transparent; }',
      '[' + LIMITED_ATTRIBUTE + '="true"]::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 999px; background: rgba(96, 112, 112, .2); background-clip: content-box; }',
      '[' + LIMITED_ATTRIBUTE + '="true"]:hover::-webkit-scrollbar-thumb { background-color: rgba(96, 112, 112, .38); }',
      '[' + LIMITED_ATTRIBUTE + '="true"]::-webkit-scrollbar-thumb:active { background-color: rgba(17, 126, 150, .58); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function rememberOriginalStyle(list) {
    if (originalStyles.has(list)) return;
    originalStyles.set(list, {
      maxHeight: list.style.maxHeight,
      overflowY: list.style.overflowY,
      overflowX: list.style.overflowX,
      padding: list.style.padding
    });
  }

  function restore(list) {
    if (!list) return;
    list.removeAttribute(LIMITED_ATTRIBUTE);
    if (!originalStyles.has(list)) return;
    var original = originalStyles.get(list);
    list.style.maxHeight = original.maxHeight;
    list.style.overflowY = original.overflowY;
    list.style.overflowX = original.overflowX;
    list.style.padding = original.padding;
    originalStyles.delete(list);
  }

  function getHeight(mode, customHeight) {
    if (HEIGHTS[mode]) return HEIGHTS[mode];
    return mode === 'custom' ? customHeight : null;
  }

  function apply(list, mode, customHeight) {
    addStyles();
    var height = getHeight(mode, customHeight);
    if (!height) {
      restore(list);
      return;
    }
    rememberOriginalStyle(list);
    list.style.maxHeight = height + 'px';
    list.style.overflowY = 'auto';
    list.style.overflowX = 'hidden';
    list.style.padding = '10px';
    list.setAttribute(LIMITED_ATTRIBUTE, 'true');
  }

  tools.features = tools.features || {};
  tools.features.commentAreaHeight = { apply: apply, restore: restore };
})(window);
