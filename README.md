# 巴哈留言優化工具

> 讓巴哈姆特論壇留言更容易閱讀、整理與互動的 Chrome 擴充功能。

## 介紹

巴哈留言優化工具專為 `forum.gamer.com.tw` 的 `C.php` 與 `Co.php` 留言區設計。
它不改變論壇原有的推噓、回覆與圖片瀏覽機制，而是在本機瀏覽器中提供可自由開關的閱讀與版面優化，
讓長篇討論、回覆串與熱門留言更容易掌握。

### 主要功能

- 最多三層的階層留言，並可隱藏回覆樓層標注與階層分隔線。
- 原始順序與熱門排序；階層模式會將子留言熱度以權重回饋父留言。
- 推噓操作可移至留言右側，保留論壇原生按鈕與計數行為。
- 頭像大小／圓角、Hover 顯示樓層、用戶名位置與預設／相對時間切換。
- 留言圖片縮小預覽與停留 Hover 顯示，以及留言底欄摺疊。
- 所有設定會記住；可隨時從齒輪選單「還原預設」。

### 隱私與範圍

- 僅在 `https://forum.gamer.com.tw/C.php*` 與 `https://forum.gamer.com.tw/Co.php*` 執行。
- 僅使用 Chrome `storage` 權限保存本機設定。
- 沒有廣告、追蹤統計、背景程序或伺服器資料回傳；所有處理皆在本機完成。
- [隱私權說明](docs/privacy-policy.html)

## 建立 Chrome 商店上傳檔

在專案根目錄執行：

```bash
node scripts/package-chrome-store.js
```

完成後會在 `dist/` 建立帶有目前版本號的 ZIP。壓縮檔根目錄直接包含
`manifest.json`，可上傳至 Chrome 線上應用程式商店。

此為不含背景程序的 Manifest V3 擴充功能。它只會在
`https://forum.gamer.com.tw/C.php*` 與 `https://forum.gamer.com.tw/Co.php*` 注入內容腳本，
提供階層留言、熱門排序與各種留言顯示優化。

## 文件

- [README.md](README.md)：安裝與基本使用說明。
- [ARCHITECTURE.md](ARCHITECTURE.md)：模組責任、設定 schema、效能設計與維護方式。

## 安裝

1. 開啟 `chrome://extensions`。
2. 開啟右上角的「開發人員模式」。
3. 選擇「載入未封裝項目」。
4. 選取此資料夾。

僅使用 `storage` 權限來記住選項；沒有 service worker，也不會在其他網域或巴哈的其他頁面執行。
