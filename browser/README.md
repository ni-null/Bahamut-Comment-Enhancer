# 瀏覽器封裝

此資料夾只存放各瀏覽器的發佈設定與建置工具；網站功能的唯一原始碼仍保留在專案根目錄的
`content/`、`icons/` 與 Chrome 開發用的 `manifest.json`，避免維護時產生多份功能程式。

| 目標 | 設定來源 | 產物 |
| --- | --- | --- |
| Chrome | 根目錄 `manifest.json` | MV3 ZIP |
| Edge | `edge/manifest.json` | MV3 ZIP |
| Firefox | `firefox/manifest.json` | MV3 ZIP |
| Tampermonkey | `tampermonkey/metadata.json` | `.user.js` |

## 建置

在專案根目錄執行：

```bash
npm install
node browser/build.js chrome --package
node browser/build.js edge --package
node browser/build.js firefox --package
node browser/build.js tampermonkey
node browser/build.js all --package
```

建置時的中間檔只會放在系統暫存區，完成後自動刪除。`dist/` 僅保留最終發佈檔：三個擴充功能
ZIP（根目錄直接包含 `manifest.json`）、壓縮版 `bahamut-comment-enhancer.user.js` 與未壓縮版
`bahamut-comment-enhancer.unminified.user.js`，兩者皆可直接拖入 Tampermonkey 安裝。每次建置會先清空舊的
`dist/`；使用 `all --package` 即得到五個發佈檔。

所有目標僅匹配巴哈姆特論壇的 `C.php`、`Co.php` 頁面。Firefox 的 Gecko ID 只供 AMO 發佈識別使用。
發佈產物的 JavaScript 會以 Terser 進行標準壓縮與變數縮短；專案原始碼不會被改寫，且不採用混淆或動態程式碼。
