/**
 * 功能簡介：GNN 留言主題。沿用預設主題的功能組合，提供簡潔的討論串排版。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var STYLE_ID = 'comment-thread-gnn-comment-style';
  var STYLE_NAME = 'gnn';
  var HOST_ATTRIBUTE = 'data-comment-thread-comment-style-host';
  var SCOPE = '[data-comment-thread-comment-style="' + STYLE_NAME + '"]';
  var GNN_THEME = Object.freeze({
    name: STYLE_NAME,
    label: 'GNN',
    disabledSettings: [],
    // GNN 以預設主題為基礎，保留同一組互動與顯示偏好。
    defaultSettings: {
      threadingEnabled: true,
      showThreadSeparators: false,
      collapseThreadingEnabled: true,
      userNameAtBottomEnabled: false,
      avatarDisplay: 'default',
      avatarShape: 'round',
      imageSmallPreviewEnabled: false,
      imageLightboxEnabled: true,
      youtubeLightboxEnabled: true,
      commentAreaHeightMode: 'unlimited',
      commentAreaCustomHeight: 600,
      timeDisplay: 'relative',
      footerInteractionCollapseEnabled: false,
      replyEditorFollowEnabled: true,
      markerEnhancementEnabled: true,
      reactionInlineEnabled: false,
      floorAtAvatarEnabled: false,
      hideReplyAnnotation: true,
      autoExpandCommentsEnabled: false,
      hideHotTagEnabled: true,
      commentSortMode: 'default'
    },
    apply: apply,
    restore: restore
  });

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      // GNN 主題：以無卡片邊框的白底留言串呈現，保留論壇既有 DOM 與互動行為。
      SCOPE + ' { padding: 0; background: #fff; color: #1f2933; }',
      '.c-post__footer[' + HOST_ATTRIBUTE + '="' + STYLE_NAME + '"] { background: #fff; border-top: 1px dotted #ccc; }',
      SCOPE + ' > .c-reply__item { position: relative; margin: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }',
      // 階層留言：沿用區塊化主題的直屬項目與 inner 層縮排，避免破壞巢狀階層結構。
      SCOPE + ' .comment-thread-children > .comment-thread-children__inner > .c-reply__item { position: relative; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }',
      SCOPE + ' .comment-thread-children > .comment-thread-children__inner { margin-top: 0; padding-left: 20px; }',
      SCOPE + ' .c-reply__item > div { position: relative; display: grid; grid-template-columns: 36px minmax(0, 1fr); column-gap: 10px; align-items: start; }',
      SCOPE + ' .c-reply__item > div > a.reply-avatar.user--sm { grid-column: 1; grid-row: 1; width: 36px; height: 36px; min-width: 36px; min-height: 36px; margin: 0; overflow: hidden; }',
      SCOPE + ' .c-reply__item > div > a.reply-avatar.user--sm > img { width: 100%; height: 100%; object-fit: cover; }',
      SCOPE + ' .reply-content { position: relative; display: grid; grid-column: 2; grid-row: 1; grid-template-columns: minmax(0, 1fr) auto auto; column-gap: 8px; row-gap: 3px; min-width: 0; }',
      SCOPE + ' .reply-content__user,',
      SCOPE + ' .reply-content__footer > a.reply-content__user { display: inline-block; grid-column: 1; grid-row: 1; color: #111827 !important; font-size: 15px; font-weight: 700; line-height: 20px; }',
      SCOPE + ' .reply-content__article.c-article { grid-column: 1 / -1; grid-row: 2; margin: 0; color: #24313c; font-size: 15px; line-height: 1.55; }',
      SCOPE + ' .reply-content__footer { display: contents; }',
      // 收合底欄：保留 GNN 首行的樓層與時間，只收起互動列及回覆框。
      SCOPE + ' .reply-content[data-comment-thread-footer-collapse="collapsed"] > .reply-content__footer { display: contents !important; }',
      SCOPE + ' .reply-content[data-comment-thread-footer-collapse="collapsed"] > .reply-content__footer > .buttonbar,',
      SCOPE + ' .reply-content[data-comment-thread-footer-collapse="collapsed"] > .reply-content__footer > .c-reply__editor { display: none !important; }',
      SCOPE + ' .reply-content__footer > [name="comment_floor"] { display: inline-flex; grid-column: 2; grid-row: 1; align-items: center; justify-self: start; align-self: center; margin: 0 !important; color: #8b99a5; font-size: 12px; }',
      SCOPE + ' .reply-content__footer > .edittime:not([name="comment_floor"]) { grid-column: 3; grid-row: 1; justify-self: end; align-self: center; margin: 0 !important; color: #8b99a5; font-size: 12px; line-height: 20px; white-space: nowrap; }',
      SCOPE + ' .reply-content__footer > .buttonbar { display: inline-flex; grid-column: 1 / -1; grid-row: 3; align-items: center; justify-self: start; gap: 8px; margin: 4px 0 0; float: none !important; }',
      SCOPE + ' .reply-content__footer .buttonbar > button,',
      SCOPE + ' .reply-content__footer .buttonbar > a { color: #8b99a5; }',
      // 回覆框跟隨留言：讓移入 footer 的官方回覆框貼齊 GNN 留言內容。
      SCOPE + ' .reply-content__footer > .c-reply__editor { margin-top: 10px; padding: 0 !important; }',
      SCOPE + ' .reply-content > .comment-thread-children-toggle { grid-column: 1 / -1; }',
      SCOPE + ' .reply-content__footer > .c-reply__editor { grid-column: 1 / -1; grid-row: 4; margin-top: 8px; padding: 0 !important; }',
      '@media (max-width: 600px) {',
      '  ' + SCOPE + ' .c-reply__item > div { grid-template-columns: 32px minmax(0, 1fr); column-gap: 8px; }',
      '  ' + SCOPE + ' .c-reply__item > div > a.reply-avatar.user--sm { width: 32px; height: 32px; min-width: 32px; min-height: 32px; }',
      '  ' + SCOPE + ' .reply-content { padding-right: 54px; }',
      '  ' + SCOPE + ' .comment-thread-children > .comment-thread-children__inner { margin-left: 10px; padding-left: 14px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function apply(list) {
    addStyles();
    var host = list.closest('.c-post__footer.c-reply');
    if (host) host.setAttribute(HOST_ATTRIBUTE, STYLE_NAME);
  }

  function restore(list) {
    var host = list.closest('.c-post__footer.c-reply');
    if (host) host.removeAttribute(HOST_ATTRIBUTE);
  }

  tools.commentStyles.register(GNN_THEME.name, GNN_THEME);
})(window, document);
