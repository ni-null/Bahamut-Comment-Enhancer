/**
 * 功能簡介：預設留言主題及其預設功能組合。
 * 此檔是預設主題的唯一設定來源；首次使用、切回預設主題與還原預設都會套用 defaultSettings。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var STYLE_ID = 'comment-thread-default-comment-style';
  var STYLE_NAME = 'default';
  var HOST_ATTRIBUTE = 'data-comment-thread-comment-style-host';
  var DEFAULT_THEME = Object.freeze({
    name: STYLE_NAME,
    label: '預設',
    disabledSettings: [],
    defaultSettings: {
      // 階層留言：預設以父子關係重組留言。
      threadingEnabled: true,
      // 階層分隔線：預設隱藏子留言的連接線。
      showThreadSeparators: false,
      // 收合階層：預設先收起回覆分支。
      collapseThreadingEnabled: true,
      // 用戶名至底：預設維持作者位於留言上方。
      userNameAtBottomEnabled: false,
      // 頭像大小：預設使用論壇原始尺寸。
      avatarDisplay: 'default',
      // 頭像樣式：預設使用圓形頭像。
      avatarShape: 'round',
      // 圖片縮小預覽：預設不縮小留言圖片。
      imageSmallPreviewEnabled: false,
      // 自訂圖片燈箱：預設以頁面內圖片燈箱取代官方預覽。
      imageLightboxEnabled: true,
      // YouTube 燈箱播放：預設直接在留言頁面開啟官方影片。
      youtubeLightboxEnabled: true,
      // 留言區高度：預設不限制外層留言區高度。
      commentAreaHeightMode: 'unlimited',
      // 留言區自訂高度：選擇自訂時預設為 600px。
      commentAreaCustomHeight: 600,
      // 時間顯示：預設使用相對時間。
      timeDisplay: 'relative',
      // 收合底欄：預設完整顯示互動列。
      footerInteractionCollapseEnabled: false,
      // 回覆框跟隨留言：預設將回覆框移至目標留言。
      replyEditorFollowEnabled: true,
      // 標記優化：預設啟用樓層標記與預覽。
      markerEnhancementEnabled: true,
      // 推噓移至右側：預設保留原始互動列位置。
      reactionInlineEnabled: false,
      // 停懸顯示樓層：預設不在頭像覆蓋樓層。
      floorAtAvatarEnabled: false,
      // 遮蔽樓層標記：預設隱藏已被階層關係取代的標記。
      hideReplyAnnotation: true,
      // 自動展開所有留言：預設不主動載入舊留言。
      autoExpandCommentsEnabled: false,
      // 隱藏熱門標籤：預設移除官方熱門標籤。
      hideHotTagEnabled: true,
      // 排序方式：預設保留原始留言順序。
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
      // 回覆框跟隨留言：僅移除已放入留言 footer 的回覆框內距，讓它與留言內容對齊。
      '.c-post__footer.c-reply[' + HOST_ATTRIBUTE + '="' + STYLE_NAME + '"] .reply-content__footer > .c-reply__editor { padding: 0 !important; }'
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

  tools.commentStyles.register(DEFAULT_THEME.name, DEFAULT_THEME);
})(window, document);
