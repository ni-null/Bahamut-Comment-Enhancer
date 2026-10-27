/**
 * 功能簡介：以自訂燈箱取代官方 Photoswipe 圖片預覽，支援點擊關閉與滾輪縮放。
 * 僅攔截一般點擊；修飾鍵或中鍵點擊仍保留官方圖片連結的另開分頁行為。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var LINK_SELECTOR = '.comment_content a.photoswipe-image[href]';
  var MODAL_CLASS = 'comment-thread-image-lightbox';
  var STYLE_ID = 'comment-thread-image-lightbox-styles';
  var HANDLER_KEY = '_commentThreadImageLightboxHandler';
  var MIN_SCALE = 0.25;
  var MAX_SCALE = 8;
  var modal = null;
  var activeTrigger = null;
  var scale = 1;
  var panX = 0;
  var panY = 0;
  var dragState = null;
  var suppressCloseOnce = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.' + MODAL_CLASS + ' { position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; overflow: hidden; padding: 20px; }',
      '.' + MODAL_CLASS + '[hidden] { display: none; }',
      '.' + MODAL_CLASS + '__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, .82); }',
      '.' + MODAL_CLASS + '__dialog { position: relative; display: grid; place-items: center; width: 100%; height: 100%; overflow: hidden; cursor: pointer; }',
      '.' + MODAL_CLASS + '__dialog.is-pannable { cursor: grab; }',
      '.' + MODAL_CLASS + '__dialog.is-dragging { cursor: grabbing; }',
      '.' + MODAL_CLASS + '__image { display: block; max-width: 100%; max-height: 100%; object-fit: contain; transform-origin: center; transition: transform .12s ease-out; user-select: none; touch-action: none; }',
      '@media (max-width: 600px) { .' + MODAL_CLASS + ' { padding: 10px; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getOriginalImageUrl(href) {
    try {
      var url = new URL(href, window.location.href);
      // 巴哈縮圖常以 ?w=300 傳遞寬度，燈箱改為使用沒有寬度限制的原圖網址。
      url.searchParams.delete('w');
      return url.href;
    } catch (error) {
      return href;
    }
  }

  function close() {
    if (!modal || modal.hidden) return;
    var image = modal.querySelector('.' + MODAL_CLASS + '__image');
    if (image) {
      image.removeAttribute('src');
      image.remove();
    }
    modal.hidden = true;
    scale = 1;
    panX = 0;
    panY = 0;
    dragState = null;
    suppressCloseOnce = false;
    var dialog = getDialog();
    if (dialog) dialog.classList.remove('is-pannable', 'is-dragging');
    if (activeTrigger && activeTrigger.isConnected) activeTrigger.focus();
    activeTrigger = null;
  }

  function getDialog() {
    return modal && modal.querySelector('.' + MODAL_CLASS + '__dialog');
  }

  function renderImage() {
    var dialog = getDialog();
    var image = dialog && dialog.querySelector('.' + MODAL_CLASS + '__image');
    if (!dialog || !image) return;
    image.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
    dialog.classList.toggle('is-pannable', scale > 1);
  }

  function createModal() {
    if (modal) return modal;
    addStyles();
    modal = document.createElement('div');
    modal.className = MODAL_CLASS;
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '圖片預覽');
    var backdrop = document.createElement('div');
    backdrop.className = MODAL_CLASS + '__backdrop';
    var dialog = document.createElement('section');
    dialog.className = MODAL_CLASS + '__dialog';
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    backdrop.addEventListener('click', close);
    dialog.addEventListener('click', function () {
      if (suppressCloseOnce) {
        suppressCloseOnce = false;
        return;
      }
      close();
    });
    dialog.addEventListener('wheel', function (event) {
      var image = dialog.querySelector('.' + MODAL_CLASS + '__image');
      if (!image) return;
      event.preventDefault();
      var rect = image.getBoundingClientRect();
      var originX = ((event.clientX - rect.left) / rect.width) * 100;
      var originY = ((event.clientY - rect.top) / rect.height) * 100;
      image.style.transformOrigin = Math.max(0, Math.min(100, originX)) + '% ' + Math.max(0, Math.min(100, originY)) + '%';
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (scale <= 1) {
        panX = 0;
        panY = 0;
      }
      renderImage();
    }, { passive: false });
    dialog.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || scale <= 1) return;
      dragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      dialog.classList.add('is-dragging');
      dialog.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    dialog.addEventListener('pointermove', function (event) {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      var deltaX = event.clientX - dragState.x;
      var deltaY = event.clientY - dragState.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) dragState.moved = true;
      panX += deltaX;
      panY += deltaY;
      dragState.x = event.clientX;
      dragState.y = event.clientY;
      renderImage();
    });
    function stopDragging(event) {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      suppressCloseOnce = dragState.moved;
      dragState = null;
      dialog.classList.remove('is-dragging');
      if (dialog.hasPointerCapture(event.pointerId)) dialog.releasePointerCapture(event.pointerId);
    }
    dialog.addEventListener('pointerup', stopDragging);
    dialog.addEventListener('pointercancel', stopDragging);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
    (document.body || document.documentElement).appendChild(modal);
    return modal;
  }

  function open(link) {
    var nextModal = createModal();
    close();
    var image = document.createElement('img');
    image.className = MODAL_CLASS + '__image';
    image.src = getOriginalImageUrl(link.href);
    image.alt = link.querySelector('img') && link.querySelector('img').alt ? link.querySelector('img').alt : '留言圖片';
    image.draggable = false;
    nextModal.querySelector('.' + MODAL_CLASS + '__dialog').appendChild(image);
    activeTrigger = link;
    scale = 1;
    panX = 0;
    panY = 0;
    suppressCloseOnce = false;
    nextModal.hidden = false;
  }

  function enableList(list) {
    if (list[HANDLER_KEY]) return;
    var handler = function (event) {
      var link = event.target.closest(LINK_SELECTOR);
      if (!event.isTrusted || !link || !list.contains(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      open(link);
    };
    list[HANDLER_KEY] = handler;
    // Capture 階段先攔截，避免官方 Photoswipe handler 同時開啟。
    list.addEventListener('click', handler, true);
  }

  function disableList(list) {
    if (!list[HANDLER_KEY]) return;
    list.removeEventListener('click', list[HANDLER_KEY], true);
    delete list[HANDLER_KEY];
    if (activeTrigger && list.contains(activeTrigger)) close();
  }

  function apply(list, enabled) {
    if (!list) return;
    if (enabled) enableList(list);
    else disableList(list);
  }

  tools.features = tools.features || {};
  tools.features.imageLightbox = { apply: apply };
})(window, document);
