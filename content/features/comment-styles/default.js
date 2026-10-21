/**
 * 功能簡介：預設留言主題及其預設功能組合。
 * 此檔是預設主題的唯一設定來源；首次使用、切回預設主題與還原預設都會套用 defaultSettings。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var DEFAULT_THEME = Object.freeze({
    name: 'default',
    label: '預設',
    disabledSettings: [],
    defaultSettings: {
      // 階層留言：預設以父子關係重組留言。
      threadingEnabled: true,
      // 階層分隔線：預設顯示子留言的連接線。
      showThreadSeparators: true,
      // 收合階層：預設直接顯示回覆分支。
      collapseThreadingEnabled: false,
      // 用戶名至底：預設維持作者位於留言上方。
      userNameAtBottomEnabled: false,
      // 頭像大小：預設使用論壇原始尺寸。
      avatarDisplay: 'default',
      // 頭像樣式：預設使用圓形頭像。
      avatarShape: 'round',
      // 圖片縮小預覽：預設不縮小留言圖片。
      imageSmallPreviewEnabled: false,
      // 圖片 Hover 顯示：預設不以停懸開啟圖片。
      imageHoverPreviewEnabled: false,
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
    apply: function () {},
    restore: function () {}
  });

  tools.commentStyles.register(DEFAULT_THEME.name, DEFAULT_THEME);
})(window);
