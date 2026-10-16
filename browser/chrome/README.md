# Chrome

Chrome 版本直接以專案根目錄的 `manifest.json` 作為開發與發佈來源。這是既有的唯一 Chrome Manifest，
不在此複製一份，避免兩個檔案的版本或內容腳本順序失同步。

執行 `node browser/build.js chrome --package` 建立上傳 Chrome 線上應用程式商店的 ZIP。
