/**
 * 功能簡介：將留言使用者名稱移至樓層資訊後方，並在功能關閉時還原原始位置。
 * 僅調整已移動的名稱樣式，不影響原站其他使用者名稱。
 */
(function (window, document) {
  'use strict';

  var tools = window.BahamutCommentTools;
  var placeholders = new WeakMap();

  function addStyles() {
    if (document.getElementById('comment-thread-user-name-footer-styles')) return;

    var style = document.createElement('style');
    style.id = 'comment-thread-user-name-footer-styles';
    style.textContent = [
      '.reply-content__footer > a.reply-content__user[data-comment-thread-user-moved="true"] {',
      '  float: left;',
      '  margin-right: 5px;',
      '  font-size: 12px !important;',
      '  color: #a6a6a6 !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function apply(list) {
    addStyles();
    Array.prototype.forEach.call(list.querySelectorAll('.reply-content > a.reply-content__user'), function (userName) {
      if (userName.dataset.commentThreadUserMoved === 'true') return;
      var content = userName.parentElement;
      var footer = content && content.querySelector(':scope > .reply-content__footer');
      if (!footer) return;

      var placeholder = document.createComment('comment-thread-user-name');
      userName.parentNode.insertBefore(placeholder, userName);
      placeholders.set(userName, placeholder);
      userName.dataset.commentThreadUserMoved = 'true';
      var floor = footer.querySelector(':scope > [name="comment_floor"]');
      if (floor) floor.insertAdjacentElement('afterend', userName);
      else footer.insertBefore(userName, footer.firstChild);
    });
  }

  function restore(list) {
    Array.prototype.forEach.call(
      list.querySelectorAll('.reply-content__footer > a.reply-content__user[data-comment-thread-user-moved]'),
      function (userName) {
        var placeholder = placeholders.get(userName);
        if (placeholder && placeholder.isConnected) placeholder.replaceWith(userName);
        placeholders.delete(userName);
        delete userName.dataset.commentThreadUserMoved;
      }
    );
  }

  tools.features = tools.features || {};
  tools.features.userNameFooter = {
    apply: apply,
    restore: restore
  };
})(window, document);
