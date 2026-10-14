/**
 * 功能簡介：將 Chrome Manifest V3 擴充功能封裝成可上傳 Chrome 線上應用程式商店的 ZIP。
 * ZIP 根目錄會直接包含 manifest.json，只收錄擴充功能執行所需檔案，不含範例與文件。
 */
'use strict';

var fs = require('fs');
var path = require('path');

var CURRENT_DIRECTORY = process.cwd();
var PROJECT_ROOT = fs.existsSync(path.join(CURRENT_DIRECTORY, 'manifest.json'))
  ? CURRENT_DIRECTORY
  : path.resolve(__dirname, '..');
var OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, 'dist');
var INCLUDE_PATHS = ['manifest.json', 'content', 'icons', 'assets', '_locales'];

function createCrcTable() {
  var table = new Uint32Array(256);
  for (var index = 0; index < 256; index += 1) {
    var value = index;
    for (var bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
}

var CRC_TABLE = createCrcTable();

function crc32(buffer) {
  var value = 0xffffffff;
  for (var index = 0; index < buffer.length; index += 1) {
    value = CRC_TABLE[(value ^ buffer[index]) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date) {
  var year = Math.max(date.getFullYear(), 1980);
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

function collectFiles(sourcePath, archivePath, files) {
  var stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    files.push({ sourcePath: sourcePath, archivePath: archivePath.replace(/\\/g, '/') });
    return;
  }

  fs.readdirSync(sourcePath, { withFileTypes: true }).forEach(function (entry) {
    collectFiles(path.join(sourcePath, entry.name), path.posix.join(archivePath, entry.name), files);
  });
}

function createZip(entries) {
  var chunks = [];
  var centralDirectory = [];
  var offset = 0;

  entries.forEach(function (entry) {
    var name = Buffer.from(entry.archivePath, 'utf8');
    var data = fs.readFileSync(entry.sourcePath);
    var stat = fs.statSync(entry.sourcePath);
    var dos = getDosDateTime(stat.mtime);
    var checksum = crc32(data);

    var localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dos.time, 10);
    localHeader.writeUInt16LE(dos.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    chunks.push(localHeader, name, data);

    var centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dos.time, 12);
    centralHeader.writeUInt16LE(dos.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectory.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  });

  var centralDirectoryOffset = offset;
  var centralDirectoryBuffer = Buffer.concat(centralDirectory);
  var endOfDirectory = Buffer.alloc(22);
  endOfDirectory.writeUInt32LE(0x06054b50, 0);
  endOfDirectory.writeUInt16LE(0, 4);
  endOfDirectory.writeUInt16LE(0, 6);
  endOfDirectory.writeUInt16LE(entries.length, 8);
  endOfDirectory.writeUInt16LE(entries.length, 10);
  endOfDirectory.writeUInt32LE(centralDirectoryBuffer.length, 12);
  endOfDirectory.writeUInt32LE(centralDirectoryOffset, 16);
  endOfDirectory.writeUInt16LE(0, 20);
  return Buffer.concat(chunks.concat([centralDirectoryBuffer, endOfDirectory]));
}

function main() {
  var manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
  var manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.manifest_version !== 3 || !manifest.version) {
    throw new Error('manifest.json 必須包含 manifest_version: 3 與 version。');
  }

  var files = [];
  INCLUDE_PATHS.forEach(function (relativePath) {
    var sourcePath = path.join(PROJECT_ROOT, relativePath);
    if (fs.existsSync(sourcePath)) collectFiles(sourcePath, relativePath, files);
  });
  if (!files.some(function (file) { return file.archivePath === 'manifest.json'; })) {
    throw new Error('找不到 manifest.json，無法建立商店封裝。');
  }

  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  var outputPath = path.join(OUTPUT_DIRECTORY, 'bahamut-comment-tools-' + manifest.version + '-chrome-web-store.zip');
  fs.writeFileSync(outputPath, createZip(files));
  console.log('已建立 Chrome 商店封裝：' + path.relative(PROJECT_ROOT, outputPath));
  console.log('共收錄 ' + files.length + ' 個檔案，ZIP 根目錄包含 manifest.json。');
}

try {
  main();
} catch (error) {
  console.error('打包失敗：' + error.message);
  process.exitCode = 1;
}
