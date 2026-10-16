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
node browser/build.js chrome --package
node browser/build.js edge --package
node browser/build.js firefox --package
node browser/build.js tampermonkey
node browser/build.js all --package
```

建置目錄會放在 `dist/browser/<目標>/`。三個擴充功能 ZIP 會放在 `dist/`，其根目錄直接包含
`manifest.json`；Tampermonkey 版本則輸出單一 `bahamut-comment-enhancer.user.js`，可直接拖入
Tampermonkey 安裝。

所有目標僅匹配巴哈姆特論壇的 `C.php`、`Co.php` 頁面。Firefox 的 Gecko ID 只供 AMO 發佈識別使用。
