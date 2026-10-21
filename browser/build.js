/**
 * 功能簡介：使用根目錄共用程式碼，建立四種瀏覽器平台的可安裝或可發佈輸出。
 * 使用方式：node browser/build.js <chrome|firefox|edge|tampermonkey|all> [--package]
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var terser;

var BROWSER_DIRECTORY = __dirname;
var PROJECT_ROOT = path.resolve(BROWSER_DIRECTORY, '..');
var DIST_DIRECTORY = path.join(PROJECT_ROOT, 'dist');
var TEMP_DIRECTORY = fs.mkdtempSync(path.join(os.tmpdir(), 'bahamut-comment-enhancer-build-'));
var EXTENSION_TARGETS = ['chrome', 'firefox', 'edge'];
var TARGETS = EXTENSION_TARGETS.concat(['tampermonkey']);

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function cleanDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  ensureDirectory(directory);
}

function copyDirectory(source, destination) {
  ensureDirectory(destination);
  fs.readdirSync(source, { withFileTypes: true }).forEach(function (entry) {
    var sourcePath = path.join(source, entry.name);
    var destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      return;
    }
    fs.copyFileSync(sourcePath, destinationPath);
  });
}

function getManifest(target) {
  var manifestPath = target === 'chrome'
    ? path.join(PROJECT_ROOT, 'manifest.json')
    : path.join(BROWSER_DIRECTORY, target, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function getTerser() {
  if (!terser) {
    try {
      terser = require('terser');
    } catch (error) {
      throw new Error('找不到 Terser，請先執行 npm install。');
    }
  }
  return terser;
}

async function minifyJavaScript(source, filename) {
  var minifier = getTerser();
  var result = await minifier.minify({ [filename]: source }, {
    compress: true,
    mangle: true,
    format: {
      comments: false
    }
  });
  if (!result.code) throw new Error('無法壓縮 JavaScript：' + filename);
  return result.code;
}

async function minifyDirectory(directory) {
  var entries = fs.readdirSync(directory, { withFileTypes: true });
  for (var index = 0; index < entries.length; index += 1) {
    var entry = entries[index];
    var entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await minifyDirectory(entryPath);
    } else if (entry.isFile() && path.extname(entry.name) === '.js') {
      var source = fs.readFileSync(entryPath, 'utf8');
      fs.writeFileSync(entryPath, await minifyJavaScript(source, entryPath), 'utf8');
    }
  }
}

async function buildExtension(target) {
  var outputPath = path.join(TEMP_DIRECTORY, target);
  cleanDirectory(outputPath);
  fs.writeFileSync(path.join(outputPath, 'manifest.json'), JSON.stringify(getManifest(target), null, 2) + '\n');
  copyDirectory(path.join(PROJECT_ROOT, 'content'), path.join(outputPath, 'content'));
  copyDirectory(path.join(PROJECT_ROOT, 'icons'), path.join(outputPath, 'icons'));
  await minifyDirectory(path.join(outputPath, 'content'));
  return outputPath;
}

function getContentScriptPaths() {
  return getManifest('chrome').content_scripts.reduce(function (paths, contentScript) {
    return paths.concat(contentScript.js || []);
  }, []);
}

function createUserscriptHeader(metadata, version) {
  var lines = [
    '// ==UserScript==',
    '// @name         ' + metadata.name,
    '// @namespace    ' + metadata.namespace,
    '// @version      ' + version,
    '// @description  ' + metadata.description,
    '// @author       ' + metadata.author,
    '// @license      ' + metadata.license
  ];
  metadata.matches.forEach(function (match) {
    lines.push('// @match        ' + match);
  });
  lines.push(
    '// @grant        GM_getValue',
    '// @grant        GM_setValue',
    '// @grant        unsafeWindow',
    '// @run-at       document-idle',
    '// @noframes',
    '// ==/UserScript==',
    '',
    'window.BahamutCommentTools = window.BahamutCommentTools || {};',
    'window.BahamutCommentTools.version = ' + JSON.stringify(version) + ';',
    ''
  );
  return lines.join('\n');
}

async function buildUserscript() {
  var metadata = JSON.parse(fs.readFileSync(path.join(BROWSER_DIRECTORY, 'tampermonkey', 'metadata.json'), 'utf8'));
  var manifest = getManifest('chrome');
  var scriptPath = path.join(DIST_DIRECTORY, 'bahamut-comment-enhancer.user.js');

  var source = [createUserscriptHeader(metadata, manifest.version)];
  for (var index = 0; index < getContentScriptPaths().length; index += 1) {
    var relativePath = getContentScriptPaths()[index];
    source.push(await minifyJavaScript(fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8'), relativePath));
  }
  fs.writeFileSync(scriptPath, source.join('\n\n'), 'utf8');
  return scriptPath;
}

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

function collectFiles(directory, archiveDirectory, files) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach(function (entry) {
    var sourcePath = path.join(directory, entry.name);
    var archivePath = path.posix.join(archiveDirectory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(sourcePath, archivePath, files);
    } else {
      files.push({ sourcePath: sourcePath, archivePath: archivePath });
    }
  });
}

function createZip(entries) {
  var chunks = [];
  var centralDirectory = [];
  var offset = 0;
  entries.forEach(function (entry) {
    var name = Buffer.from(entry.archivePath, 'utf8');
    var data = fs.readFileSync(entry.sourcePath);
    var dos = getDosDateTime(fs.statSync(entry.sourcePath).mtime);
    var checksum = crc32(data);
    var localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(dos.time, 10);
    localHeader.writeUInt16LE(dos.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    chunks.push(localHeader, name, data);
    var centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(dos.time, 12);
    centralHeader.writeUInt16LE(dos.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectory.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  });
  var directory = Buffer.concat(centralDirectory);
  var end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat(chunks.concat([directory, end]));
}

function packageExtension(target, sourceDirectory) {
  var entries = [];
  collectFiles(sourceDirectory, '', entries);
  var outputPath = path.join(DIST_DIRECTORY, 'bahamut-comment-enhancer-' + target + '-' + getManifest(target).version + '.zip');
  fs.writeFileSync(outputPath, createZip(entries));
  return outputPath;
}

async function buildTarget(target, shouldPackage) {
  if (target === 'tampermonkey') {
    console.log('已建立 Tampermonkey userscript：' + path.relative(PROJECT_ROOT, await buildUserscript()));
    return;
  }
  var outputPath = await buildExtension(target);
  if (shouldPackage) {
    console.log('已建立發佈 ZIP：' + path.relative(PROJECT_ROOT, packageExtension(target, outputPath)));
  }
}

async function main() {
  var target = process.argv[2];
  var shouldPackage = process.argv.indexOf('--package') !== -1;
  if (!target || (TARGETS.indexOf(target) === -1 && target !== 'all')) {
    throw new Error('請指定目標：chrome、firefox、edge、tampermonkey 或 all。');
  }
  // 先確認壓縮器可用，避免依賴未安裝時清掉既有發佈檔。
  getTerser();
  cleanDirectory(DIST_DIRECTORY);
  var targets = target === 'all' ? TARGETS : [target];
  for (var index = 0; index < targets.length; index += 1) {
    await buildTarget(targets[index], shouldPackage);
  }
}

main().catch(function (error) {
  console.error('建置失敗：' + error.message);
  process.exitCode = 1;
}).finally(function () {
  fs.rmSync(TEMP_DIRECTORY, { recursive: true, force: true });
});
