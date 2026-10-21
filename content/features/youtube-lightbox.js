/**
 * 功能簡介：將官方留言中的 YouTube 影片連結改為可關閉的燈箱播放。
 * 只在使用者點擊時建立 youtube-nocookie iframe；修飾鍵或中鍵點擊仍沿用原本另開分頁行為。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var LINK_SELECTOR = '.forum-reply-video[href]';
  var MODAL_CLASS = 'comment-thread-youtube-lightbox';
  var STYLE_ID = 'comment-thread-youtube-lightbox-styles';
  var HANDLER_KEY = '_commentThreadYouTubeLightboxHandler';
  var modal = null;
  var activeTrigger = null;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.' + MODAL_CLASS + ' { position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; padding: 20px; }',
      '.' + MODAL_CLASS + '[hidden] { display: none; }',
      '.' + MODAL_CLASS + '__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, .72); }',
      '.' + MODAL_CLASS + '__dialog { position: relative; width: min(960px, 100%); max-height: 100%; aspect-ratio: 16 / 9; background: #000; box-shadow: 0 16px 48px rgba(0, 0, 0, .5); }',
      '.' + MODAL_CLASS + '__player { width: 100%; height: 100%; border: 0; vertical-align: top; }',
      '.' + MODAL_CLASS + '__close { position: absolute; z-index: 1; top: -38px; right: 0; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 0; border-radius: 50%; padding: 0; background: rgba(0, 0, 0, .55); color: #fff; cursor: pointer; }',
      '.' + MODAL_CLASS + '__close:hover, .' + MODAL_CLASS + '__close:focus-visible { background: #117e96; outline: 2px solid #fff; outline-offset: 2px; }',
      '@media (max-width: 600px) { .' + MODAL_CLASS + ' { padding: 12px; } .' + MODAL_CLASS + '__close { top: 6px; right: 6px; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function close() {
    if (!modal || modal.hidden) return;
    var player = modal.querySelector('.' + MODAL_CLASS + '__player');
    if (player) {
      player.src = 'about:blank';
      player.remove();
    }
    modal.hidden = true;
    if (activeTrigger && activeTrigger.isConnected) activeTrigger.focus();
    activeTrigger = null;
  }

  function createModal() {
    if (modal) return modal;
    addStyles();
    modal = document.createElement('div');
    modal.className = MODAL_CLASS;
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'YouTube 影片播放器');
    var backdrop = document.createElement('div');
    backdrop.className = MODAL_CLASS + '__backdrop';
    var dialog = document.createElement('section');
    dialog.className = MODAL_CLASS + '__dialog';
    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = MODAL_CLASS + '__close';
    closeButton.setAttribute('aria-label', '關閉影片');
    closeButton.title = '關閉影片';
    var icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'close';
    closeButton.appendChild(icon);
    dialog.appendChild(closeButton);
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    backdrop.addEventListener('click', close);
    closeButton.addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
    (document.body || document.documentElement).appendChild(modal);
    return modal;
  }

  function getVideoId(href) {
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }
    var hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    var videoId = null;
    if (hostname === 'youtu.be') videoId = url.pathname.split('/')[1];
    else if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v');
      else if (/^\/(?:shorts|embed|live)\//.test(url.pathname)) videoId = url.pathname.split('/')[2];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId || '') ? videoId : null;
  }

  function open(link, videoId) {
    var nextModal = createModal();
    close();
    var player = document.createElement('iframe');
    player.className = MODAL_CLASS + '__player';
    player.title = 'YouTube 影片播放器';
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
    nextModal.querySelector('.' + MODAL_CLASS + '__dialog').appendChild(player);
    activeTrigger = link;
    nextModal.hidden = false;
    nextModal.querySelector('.' + MODAL_CLASS + '__close').focus();
  }

  function enableList(list) {
    if (list[HANDLER_KEY]) return;
    var handler = function (event) {
      var link = event.target.closest(LINK_SELECTOR);
      if (!link || !list.contains(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var videoId = getVideoId(link.href);
      if (!videoId) return;
      event.preventDefault();
      open(link, videoId);
    };
    list[HANDLER_KEY] = handler;
    list.addEventListener('click', handler);
  }

  function disableList(list) {
    if (!list[HANDLER_KEY]) return;
    list.removeEventListener('click', list[HANDLER_KEY]);
    delete list[HANDLER_KEY];
    if (activeTrigger && list.contains(activeTrigger)) close();
  }

  function apply(list, enabled) {
    if (!list) return;
    if (enabled) enableList(list);
    else disableList(list);
  }

  tools.features = tools.features || {};
  tools.features.youtubeLightbox = { apply: apply };
})(window, document);
