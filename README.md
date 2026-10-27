# 巴哈留言優化工具

> 讓巴哈姆特論壇留言更容易閱讀、整理與互動的瀏覽器擴充功能與 Userscript。
 <img width="1400" height="560" alt="c9d7cfe6a356fb6951fb3fedde1bddb2" src="https://github.com/user-attachments/assets/1768807e-0edd-4009-865c-4a16ec822299" />

## 介紹

巴哈留言優化工具專為 `forum.gamer.com.tw` 的 `C.php` 與 `Co.php` 留言區設計。
它不改變論壇原有的推噓、回覆與圖片瀏覽機制，而是在本機瀏覽器中提供可自由開關的閱讀與版面優化，
讓長篇討論、回覆串與熱門留言更容易掌握。

### 主要功能

- 最多三層的階層留言，並可隱藏回覆樓層標注與階層分隔線。
- 原始順序與熱門排序；階層模式會將子留言熱度以權重回饋父留言。
- 推噓操作可移至留言右側，保留論壇原生按鈕與計數行為。
- 頭像大小／圓角、Hover 顯示樓層、用戶名位置、預設／完整／相對時間與預設／區塊化留言主題切換。
- 留言圖片縮小預覽，以及留言底欄摺疊。
- 所有設定會記住；可隨時從齒輪選單「還原預設」，設定組合由各主題模組管理。

### 隱私與範圍

- 僅在 `https://forum.gamer.com.tw/C.php*` 與 `https://forum.gamer.com.tw/Co.php*` 執行。
- 擴充功能版本僅使用瀏覽器 `storage` 權限保存本機設定；Tampermonkey 版本使用其本機腳本儲存空間。
- 沒有廣告、追蹤統計、背景程序或伺服器資料回傳；所有處理皆在本機完成。
- [隱私權說明](docs/privacy-policy.html)

## 開發方式

日常開發以 Chrome 未封裝擴充功能為主，不需要先執行打包指令：

1. 在 Chrome 開啟 `chrome://extensions`。
2. 開啟右上角的「開發人員模式」。
3. 點選「載入未封裝項目」，並選取專案根目錄（包含 `manifest.json` 的資料夾）。
4. 修改 `content/`、`manifest.json` 或 `icons/` 後，回到擴充功能頁面按「重新載入」。
5. 開啟巴哈姆特 `C.php` 或 `Co.php` 測試；瀏覽器開發者工具的 Console 可查看腳本錯誤。

Chrome 根目錄 Manifest 是開發時的唯一來源；`browser/` 不存放功能程式碼，只負責 Firefox、Edge 與
Tampermonkey 的封裝設定。建議先在 Chrome 驗證功能，再建立各平台發佈檔。

## 多瀏覽器建置

既有開發原始碼維持在根目錄；`browser/` 僅放各平台的封裝設定與建置工具。可建立 Chrome、Firefox、Edge
與 Tampermonkey 版本：

```bash
npm install
node browser/build.js all --package
```

建置只會壓縮 `dist/` 的發佈檔，開發原始碼維持可讀。每次建置都會清空舊的 `dist/`，在
`all --package` 下會產生 Chrome、Edge、Firefox 三個 ZIP，以及壓縮與未壓縮兩份 Tampermonkey `.user.js`。採用 Terser 的一般壓縮與變數縮短，
不使用混淆、動態執行或遠端程式碼，符合一般瀏覽器商店的可審查發佈方式。

各平台指令、輸出位置與發佈用途請見 [browser/README.md](browser/README.md)。

## 文件

- [README.md](README.md)：安裝與基本使用說明。
- [ARCHITECTURE.md](ARCHITECTURE.md)：模組責任、設定 schema、效能設計與維護方式。

## 授權

本專案採用 [MIT License](LICENSE)。

