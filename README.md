# 巴哈留言優化工具

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
