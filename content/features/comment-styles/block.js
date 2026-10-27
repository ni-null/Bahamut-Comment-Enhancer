/**
 * 功能簡介：區塊化留言卡片樣式。所有規則皆限定於樣式屬性，關閉後立即回到論壇原有外觀。
 */
;(function (window, document) {
  "use strict"

  var tools = window.BahamutCommentTools
  // 區塊化主題的設定與相容性規則集中於此，新增衝突功能時只需在此清單補上設定鍵。
  var BLOCK_THEME = Object.freeze({
    name: "block",
    label: "區塊化",
    disabledSettings: [
      // 用戶名至底會將第一列作者移到 footer，破壞作者、樓層、時間的排列。
      "userNameAtBottomEnabled",
      // 收合底欄會隱藏第三列互動按鈕。
      "footerInteractionCollapseEnabled",
      // 推噓移至右側會將第三列的部分互動按鈕移出按鈕列。
      "reactionInlineEnabled",
    ],
    defaultSettings: {
      // 階層分隔線：區塊化卡片預設不顯示子留言連接線。
      showThreadSeparators: false,
      // 收合階層：區塊化卡片預設先收起回覆分支。
      collapseThreadingEnabled: true,
      // 區塊化主題會將跟隨的回覆框排在互動列下方。
      replyEditorFollowEnabled: true,
      // 自訂圖片燈箱：區塊化留言也使用頁面內圖片預覽。
      imageLightboxEnabled: true,
      // YouTube 燈箱播放：區塊化留言也沿用頁面內影片播放。
      youtubeLightboxEnabled: true,
      // 留言區高度：區塊化主題預設不限制外層留言區高度。
      commentAreaHeightMode: "unlimited",
      // 留言區自訂高度：選擇自訂時預設為 600px。
      commentAreaCustomHeight: 600,
    },
  })
  var STYLE_ID = "comment-thread-block-comment-style"
  var STYLE_NAME = BLOCK_THEME.name
  var ATTRIBUTE = "data-comment-thread-comment-style"
  var HOST_ATTRIBUTE = "data-comment-thread-comment-style-host"
  var SCOPE = "[" + ATTRIBUTE + '="' + STYLE_NAME + '"]'

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return

    var style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = [
      // 區塊化主題：內距加在 Commendlist，避免影響外層控制列與留言輸入框。
      SCOPE +
        " { padding: 10px; --comment-thread-block-border: rgba(88, 112, 112, .2); --comment-thread-block-muted: #718080; --comment-thread-block-accent: #117e96; }",
      SCOPE + " > .c-reply__item,",
      // 階層留言：收合動畫在子容器加上 inner 包裝層，二、三級留言卡片需套用至該層的直屬項目。
      SCOPE + " .comment-thread-children > .comment-thread-children__inner > .c-reply__item {",
      "  position: relative; margin: 10px 0; padding: 14px 16px;",
      "  border-radius: 14px; background: Canvas; color: CanvasText;",
      "}",
      // 階層留言：調整動畫內容層的縮排，並保留階層分隔線功能提供的左側 border。
      SCOPE + " .comment-thread-children > .comment-thread-children__inner { margin-top: 10px; padding-left: 20px; }",
      SCOPE +
        " .c-reply__item > div { position: relative; display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: 12px; min-height: 40px; }",
      SCOPE + " .c-reply__item > div > button.more { position: absolute; z-index: 1; top: 0; right: 0; }",
      SCOPE + " .c-reply__item > div > a.reply-avatar.user--sm {",
      "  grid-column: 1; grid-row: 1; width: 40px; height: 40px; min-width: 40px; min-height: 40px; margin: 0;",
      "  overflow: hidden; border: 2px solid Canvas; box-shadow: 0 0 0 1px var(--comment-thread-block-border);",
      "}",
      SCOPE + " .c-reply__item > div > a.reply-avatar.user--sm > img { width: 100%; height: 100%; object-fit: cover; }",
      SCOPE +
        " .reply-content { display: grid; grid-column: 2; grid-row: 1; grid-template-columns: minmax(0, 1fr) auto auto; column-gap: 8px; row-gap: 7px; min-width: 0; }",
      SCOPE + " .reply-content > a.reply-content__user,",
      SCOPE + " .reply-content__footer > a.reply-content__user {",
      "  grid-column: 1; grid-row: 1; align-self: center; min-width: 0; overflow: hidden; color: CanvasText;",
      "  font-size: 15px; font-weight: 650; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; float: none !important;",
      "}",
      SCOPE + " .reply-content__article.c-article { grid-column: 1 / -1; grid-row: 2; margin: 0; font-size: 15px; line-height: 1.75; }",
      // 標記優化：讓留言內的樓層標記在第二列以膠囊外觀呈現。
      SCOPE + ' .comment_content a[href*="openCommentDialog"] {',
      "  display: inline-block; margin-right: 5px; padding: 0 7px; border-radius: 6px; background: rgba(17,126,150,.1);",
      "  color: var(--comment-thread-block-accent); font-size: .92em; font-weight: 600; text-decoration: none;",
      "}",
      SCOPE + " .reply-content__footer { display: contents; }",
      SCOPE + ' .reply-content__footer > [name="comment_floor"] {',
      "  display: inline-flex; grid-column: 2; grid-row: 1; align-items: center; justify-self: start; align-self: center; margin: 0 !important;",
      "  padding: 1px 8px; border-radius: 999px; background: rgba(88,112,112,.1); color: var(--comment-thread-block-muted); font-size: 12px;",
      "}",
      SCOPE + ' .reply-content__footer > .edittime:not([name="comment_floor"]) {',
      "  grid-column: 3; grid-row: 1; align-self: center; justify-self: end; margin: 0 !important; color: var(--comment-thread-block-muted);",
      "  font-size: 12px; line-height: 20px; white-space: nowrap;",
      "}",
      SCOPE + " .reply-content__footer > .buttonbar {",
      "  display: inline-flex; grid-column: 1 / -1; grid-row: 3; align-items: center; justify-self: start; gap: 4px; margin-top: 3px; float: none !important;",
      "  padding-top: 8px;",
      "}",
      // 收合階層：將第一層留言的收合列放進卡片內容區並跨滿整列。
      SCOPE + " .reply-content > .comment-thread-children-toggle { grid-column: 1 / -1; }",
      // 回覆框跟隨留言：讓移入 footer 的官方回覆框位於互動列下方，並移除論壇原本水平 padding。
      SCOPE + " .reply-content__footer > .c-reply__editor { grid-column: 1 / -1; grid-row: 4; margin-top: 8px; padding: 0 !important; }",
      SCOPE + " .reply-content__footer .buttonbar > button,",
      SCOPE + " .reply-content__footer .buttonbar > a { border-radius: 8px; }",
      SCOPE + " .reply-content__footer .buttonbar > button:hover,",
      SCOPE + " .reply-content__footer .buttonbar > a:hover { background: rgba(17,126,150,.1); color: var(--comment-thread-block-accent); }",
      "@media (max-width: 600px) {",
      "  " +
        SCOPE +
        " > .c-reply__item, " +
        SCOPE +
        " .comment-thread-children > .comment-thread-children__inner > .c-reply__item { padding: 12px; border-radius: 12px; }",
      "  " + SCOPE + " .c-reply__item > div { grid-template-columns: 34px minmax(0, 1fr); column-gap: 10px; }",
      "  " + SCOPE + " .c-reply__item > div > a.reply-avatar.user--sm { width: 34px; height: 34px; min-width: 34px; min-height: 34px; }",
      "  " + SCOPE + " .comment-thread-children > .comment-thread-children__inner { margin-left: 10px; padding-left: 14px; }",
      "}",
    ].join("\n")
    document.head.appendChild(style)
  }

  function apply(list) {
    addStyles()
    var host = list.closest(".c-post__footer.c-reply")
    if (host) host.setAttribute(HOST_ATTRIBUTE, STYLE_NAME)
  }

  function restore(list) {
    var host = list.closest(".c-post__footer.c-reply")
    if (host) host.removeAttribute(HOST_ATTRIBUTE)
  }

  tools.commentStyles.register(STYLE_NAME, {
    label: BLOCK_THEME.label,
    disabledSettings: BLOCK_THEME.disabledSettings,
    apply: apply,
    restore: restore,
  })
})(window, document)
