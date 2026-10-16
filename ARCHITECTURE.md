# 巴哈留言優化工具：架構與維護指南

## 載入範圍

`manifest.json` 只會在 `https://forum.gamer.com.tw/C.php*` 與
`https://forum.gamer.com.tw/Co.php*` 載入內容腳本，其他 `forum.gamer.com.tw` 頁面不會觸發。擴充功能僅申請 `storage` 權限，沒有背景
service worker。

腳本依 manifest 的陣列順序執行；不要任意調換順序。

```text
comment-parser → structure-validator → sorting → threading / username-footer / avatar / floor-avatar / image-preview / relative-time / footer-collapse / reaction-inline / reply-annotation → info-modal / control-menu → settings → main
```

所有模組共用 `window.BahamutCommentTools` 命名空間，但不會污染論壇頁面的其他名稱。

## 多瀏覽器封裝

共用功能原始碼維持於專案根目錄的 `content/`、`icons/`，以及 Chrome 開發用的 `manifest.json`；不會因
平台封裝而搬移或複製功能模組。`browser/` 只負責封裝資訊：Chrome 直接使用根目錄 Manifest，Firefox 與
Edge 各有自己的 MV3 Manifest，Tampermonkey 使用中繼資料產生單一 userscript。

執行 `node browser/build.js <chrome|firefox|edge|tampermonkey|all> [--package]` 可建立指定目標。
建置目錄為 `dist/browser/<目標>/`；加上 `--package` 時，三個擴充功能會在 `dist/` 產生商店可上傳的 ZIP，
Tampermonkey 會產生可直接安裝的 `.user.js`。完整操作與輸出清單見 `browser/README.md`。

Tampermonkey 版本沿用相同的內容腳本順序，透過 `GM_getValue`／`GM_setValue` 保存設定；擴充功能版本則仍使用
`chrome.storage.local`。兩者都只會匹配 C.php 與 Co.php。

擴充功能圖示放在 `icons/`，目前由 `icon16.png`、`icon32.png`、`icon48.png` 與 `icon128.png`
組成，並由 `manifest.json` 的 `icons` 欄位引用。

GitHub Pages 原始頁面位於 `docs/`：`index.html` 會導向 `privacy-policy.html`。將 GitHub Pages 設為
從 `main` 分支的 `/docs` 目錄發布後，隱私權網址為
`https://ni-null.github.io/Bahamut-Comment-Enhancer/privacy-policy.html`。

## 模組責任

| 檔案 | 責任 | 不應放入 |
| --- | --- | --- |
| `content/core/comment-parser.js` | 選擇器、留言 ID、回覆父 ID 的解析 | DOM 重排、設定讀寫、UI |
| `content/core/structure-validator.js` | 驗證官方留言容器、清單與展開／未展開結構，回傳可安全掛載的容器與原因 | DOM 修改、選單顯示、功能套用 |
| `content/features/threading.js` | 最多三層的留言階層化與攤平 | 選單、儲存、AJAX 觀察器 |
| `content/features/sorting.js` | 提供原始與熱門度比較器；僅階層模式會以 0.6 權重將子分支熱門度回饋父分支 | 選單、儲存 |
| `content/features/username-footer.js` | 將用戶名移至 footer 的樓層號後方，並以 placeholder 還原原位置與樣式 | 留言階層、設定讀寫 |
| `content/features/avatar.js` | 控制留言頭像顯示方式與圓形／方形樣式 | 選單、設定讀寫、AJAX observer |
| `content/features/floor-avatar.js` | 懸停頭像時以樓層數字覆蓋圖片，並相容還原舊版樓層徽章 | 選單、設定讀寫、頭像顯示模式 |
| `content/features/image-preview.js` | 控制留言內文圖片縮小預覽與 Hover 時模擬原圖點擊 | 選單、設定讀寫、圖片放大器實作 |
| `content/features/relative-time.js` | 在預設日期與相對時間間切換，並保留原始文字以供還原 | 選單、設定讀寫、AJAX observer |
| `content/features/footer-collapse.js` | 摺疊整個 footer，並點擊留言非互動區切換收合 | 選單、設定讀寫、留言內容解析 |
| `content/features/reaction-inline.js` | 將原生推、推數、噓、噓數移至留言內容右側，並可依 placeholder 還原 | 選單、設定讀寫、推噓事件實作 |
| `content/features/reply-annotation.js` | 階層模式下隱藏內容開頭的 `B樓層(用戶名)` 回覆樓層標注 | 階層開關與選單狀態 |
| `content/ui/info-modal.js` | 顯示版本、介紹與文件說明的資訊 Modal | 留言功能、設定讀寫、AJAX observer |
| `content/ui/control-menu.js` | 齒輪主選單、開關／下拉控制項、外部點擊關閉與還原預設動作 | 設定儲存、留言功能套用 |
| `content/services/settings.js` | `chrome.storage.local` 的 schema、預設值、讀寫與容錯 | 頁面 DOM |
| `content/main.js` | 設定狀態協調、功能組合、低成本 AJAX observer 與 UI 回呼 | 選單、Modal、留言關聯解析細節 |

## 設定 schema

設定鍵為 `commentThreadSettings`，儲存在擴充功能自己的
`chrome.storage.local`：

```json
{
  "threadingEnabled": false,
  "showThreadSeparators": true,
  "userNameAtBottomEnabled": false,
  "avatarDisplay": "default",
  "avatarShape": "round",
  "imageSmallPreviewEnabled": false,
  "imageHoverPreviewEnabled": false,
  "timeDisplay": "default",
  "footerInteractionCollapseEnabled": false,
  "reactionInlineEnabled": false,
  "floorAtAvatarEnabled": false,
  "hideReplyAnnotation": false,
  "commentSortMode": "default"
}
```

新增選項時，先修改 `content/services/settings.js` 的 `DEFAULTS` 與 `normalize()`；
再於 `content/ui/control-menu.js` 增加選單控制，並於 `content/main.js` 增加功能套用。不要直接讀寫 `chrome.storage`。
選單的「還原預設」會透過同一 service 套用並儲存 `DEFAULTS`。

頁面啟動時必須先完成 `settings.load()`，再掛載齒輪與套用功能；因此使用者的
已儲存偏好會直接生效，不需要再次切換開關。

## 選單與功能行為

齒輪按鈕固定在 `.c-post__footer.c-reply` 容器的右上角。選單採雙欄寬版面，所有分類卡片皆跨滿
兩欄；每張卡片內的功能項目也以雙欄並排，依序為「留言與排序」、「顯示」與「圖片」；
窄螢幕會改為單欄。未來新增控制項應優先放入對應群組；點擊選單外部會自動關閉。

功能掛載前會嚴格驗證：留言清單必須是 `Commendlist_數字`、位於
`.c-post__footer.c-reply` 容器內且為其直屬元素；容器還必須有直屬的
`.c-reply__head.nocontent`（官方已展開留言）或 `.c-reply__editor`（留言較少、未顯示展開按鈕）。
任一條件不符時，不會套用任何留言功能；若容器仍可安全辨識，
齒輪選單會顯示「驗證失敗，功能暫時停用」。容器的直屬節點或 `class`／`id` 改變時會重新驗證；
若原本已套用功能，會先還原再停用。

| 群組 | 控制項 | 行為 |
| --- | --- | --- |
| 階層留言 | `階層留言` | 最多三層；關閉時會攤平回原本 DOM 順序。 |
| 階層留言 | `遮蔽樓層標注` | 次級選項，僅階層留言開啟時可操作；隱藏內文第一個 `Forum.C.openCommentDialog` 連結（例如 `B12(william)`）。關閉階層時不刪除其偏好值。 |
| 階層留言 | `顯示階層分隔線` | 次級選項，預設顯示子留言左側的階層分隔線；取消勾選即可隱藏。 |
| 排序 | `原始`、`熱門排序` | 獨立於階層功能；原始排序還原初見的留言順序。 |
| 顯示 | `用戶名至底` | 將 `.reply-content__user` 放在 `name="comment_floor"` 的樓層號後方，套用 `float: left`、右側 `5px` 間距、12px 與灰色文字。 |
| 顯示 | `頭像顯示` | `預設`、`縮小`（20×20 px）、`none`（隱藏）。 |
| 顯示 | `頭像樣式` | 預設為`圓形`，可切換為`方形`。 |
| 顯示 | `Hover 顯示樓層` | 滑鼠懸停頭像時，以 `name="comment_floor"` 的樓層數字覆蓋頭像；footer 的原始樓層仍維持顯示。 |
| 顯示 | `時間顯示` | `預設時間`或`相對時間`（例如 `3 小時前`）；相對時間啟用時每分鐘更新一次。 |
| 顯示 | `摺疊留言底欄` | 收起整個 `.reply-content__footer`；點擊留言非互動區可展開或再次收合，推噓、回覆、連結、頭像與圖片仍保留原本操作。 |
| 留言與排序 | `推噓移至右側` | 搬移原生的推、推數、噓、噓數到 `.reply-content` 右側；不複製節點，因此沿用論壇的推噓事件與即時計數，關閉時完整還原到 buttonbar。 |
| 圖片 | `縮小預覽` | 圖片區塊下的二級選項；對留言內文的圖片加上 `max-width: 28px` 與 `max-height: 28px`。 |
| 圖片 | `Hover 顯示` | 圖片區塊下的二級選項；游標持續停留 0.5 秒後才模擬原圖的 click，提前移開會取消，沿用論壇既有的圖片放大效果。 |
| 動作 | `還原預設` | 儲存所有預設值：關閉全部功能、頭像改為預設、排序改為原始。 |
| 動作 | `info` 圖示 | 開啟可由關閉按鈕、遮罩或 Esc 關閉的 Modal，顯示目前版本、Manifest V3 開發資訊與功能簡介。 |

選單中的開關採 switch 視覺，啟用色為 `#117e96`。新增選項時應使用既有的
`comment-thread-control-menu` 結構與 class，避免覆蓋論壇原有按鈕樣式。

## 排序規則

`sorting.js` 在每則留言第一次看見時記錄
`data-comment-thread-original-order`，用於可靠還原「原始」排序。

- 未開啟階層時，熱門排序只依該留言的 `a[data-gp]` 讚數排序。
- 已開啟階層時，每一層的兄弟留言依「分支熱門度」排序：
  `自身讚數 + 所有直接子分支熱門度 × 0.6`。
- 權重會遞迴計算，因此熱門子留言可提升父留言與整個討論串，但不會破壞父子關係。
- 同分時保留初始出現順序，讓排序穩定。

## 新增一項可開關功能

1. 在 `content/features/` 建立一個只處理該 DOM 功能的檔案，匯出 `apply(list)` 與必要的 `restore(list)`。
2. 在 `manifest.json` 中將新檔案放在 `content/main.js` 前面。
3. 將功能預設值與資料驗證加入 settings service。
4. 在 `main.js` 的 `applyListState()` 中依設定呼叫功能，並在 `ui/control-menu.js` 加入選單項目。
5. 判斷該功能是否要參與 `needsCommentObserver()`；只有 AJAX 新留言需要即時處理時才加入。

若功能會改變既有 DOM，必須同時實作可逆的 `restore()`；切換功能、還原預設、
清單重繪時都須能回到論壇原本外觀與順序。

## AJAX 與效能

- 每個留言清單最多一個 `MutationObserver`；只有至少一項功能啟用時才運作。
- 連續 DOM 更新以 `requestAnimationFrame` 合併成一次重繪。
- 主清單被替換時，只觀察其直接父容器，不使用永久的全頁 subtree observer。
- 直接父容器會一併觀察其直屬節點的 `class` 與 `id`，僅用來重新驗證結構與安全停用。
- 頁面初始尚無留言清單時，才暫時使用探索 observer；找到後立即停止。

## 手動驗證清單

匿名化測試 fixture 位於 `example/example.html`（已展開結構）與
`example/example-not-open.html`（未展開結構）。兩者保留外掛所需的 DOM 與回覆關係，但不含真實
帳號、頭像來源或留言內容。

1. 在 `chrome://extensions` 重新載入未封裝擴充功能。
2. 開啟符合路徑的 `forum.gamer.com.tw/C.php` 或 `forum.gamer.com.tw/Co.php` 頁面，確認留言區右上角齒輪出現；其他論壇頁面不應注入任何控制項。
3. 分別切換每個功能後重整頁面，確認儲存的設定會直接生效。
4. 開啟／關閉階層留言，確認最多三層、關閉後會還原平面順序；並確認遮蔽樓層標注僅於階層模式生效。
5. 在平面模式驗證熱門排序只看本身讚數；在階層模式驗證熱門子留言會以 0.6 權重提升父分支。
6. 測試用戶名是否位於 `B33` 等樓層號後方、頭像顯示與圓形／方形樣式、樓層徽章位置、圖片縮小與 Hover 顯示、預設／相對時間切換、互動區摺疊與展開；並確認推、推數、噓、噓數可移至留言右側且關閉後完整回到 buttonbar。
7. 使用「還原預設」，確認所有功能關閉、頭像回預設、排序回原始。
8. 點擊選單外部確認自動關閉；載入舊留言或發送／接收 AJAX 新留言，確認新留言沿用目前設定。
