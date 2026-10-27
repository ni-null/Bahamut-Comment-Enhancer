/**
 * 功能簡介：將真正的官方回覆框暫時搬到被回覆留言下方，保留原生 Enter、按鈕與事件。
 * 原位置會留下可點擊的回復列；點擊後立即將同一個 editor 節點搬回底部，完全不複製或嫁接輸入框。
 */
;(function (window, document) {
  "use strict"

  var tools = window.BahamutCommentTools
  var RETURN_CLASS = "comment-thread-reply-editor-return"
  var STYLE_ID = "comment-thread-reply-editor-follow-styles"
  var states = new WeakMap()
  var clickListenerInstalled = false
  var sourceSequence = 0

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return
    var style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = [
      "." +
        RETURN_CLASS +
        " { display:flex; align-items:center; gap:5px; width:100%; min-height:30px; box-sizing:border-box; border:1px dashed rgba(105,158,169,.5); border-radius:4px; padding:5px 8px; background:rgba(105,158,169,.06); color:#699ea9; font-size:12px; text-align:left; cursor:pointer; }",
      "." + RETURN_CLASS + ":hover,." + RETURN_CLASS + ":focus-visible { background:rgba(105,158,169,.14); outline:none; }",
      "." + RETURN_CLASS + " > .material-icons { font-size:16px; }",
    ].join("\n")
    document.head.appendChild(style)
  }

  function getDirectEditor(host) {
    return (
      Array.prototype.find.call(host.children, function (child) {
        return child.classList && child.classList.contains("c-reply__editor")
      }) || null
    )
  }

  function getFooter(item) {
    var content = item.querySelector(":scope > div > .reply-content")
    return content && content.querySelector(":scope > .reply-content__footer")
  }

  function getReplyMarker(button) {
    var match = String(button.getAttribute("onclick") || "").match(/Forum\.C\.replyToFloor\s*\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    return match ? "#B" + match[2] + ":" + match[1] + "#" : ""
  }

  function restoreEditor(state) {
    if (!state || !state.editor) return
    if (state.placeholder && state.placeholder.parentNode) {
      state.placeholder.parentNode.insertBefore(state.editor, state.placeholder)
      state.placeholder.remove()
    }
    state.placeholder = null
    state.targetItem = null
    state.marker = ""
    // 通知其他功能 editor 已回到原結構；不直接相依任何特定功能模組。
    document.dispatchEvent(
      new CustomEvent("bahamut-comment-reply-editor-restored", {
        detail: { host: state.host },
      }),
    )
  }

  function setReplyMarker(editor, marker) {
    var textarea = editor && editor.querySelector("textarea")
    if (!textarea || !marker) return
    textarea.value = marker + " "
    // 官方回覆函式完成後正規化為本次唯一標記，並通知它既有的輸入流程。
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
  }

  function createReturnPlaceholder(state) {
    var placeholder = document.createElement("button")
    placeholder.type = "button"
    placeholder.className = RETURN_CLASS
    placeholder.setAttribute("aria-label", "切換到底部留言框")
    placeholder.title = "切換到底部留言框"
    var icon = document.createElement("i")
    icon.className = "material-icons"
    icon.setAttribute("aria-hidden", "true")
    icon.textContent = "keyboard_arrow_down"
    placeholder.appendChild(icon)
    placeholder.appendChild(document.createTextNode("切換到底部留言框"))
    placeholder.addEventListener("click", function (event) {
      event.preventDefault()
      restoreEditor(state)
    })
    return placeholder
  }

  function moveEditor(state, item, marker, scrollPosition, token) {
    if (!state || state.token !== token || !states.has(state.host)) return
    var editor = state.editor || getDirectEditor(state.host)
    var footer = getFooter(item)
    if (!editor || !footer) return

    restoreEditor(state)
    state.editor = editor
    state.placeholder = createReturnPlaceholder(state)
    editor.parentNode.insertBefore(state.placeholder, editor)
    setReplyMarker(editor, marker)
    footer.appendChild(editor)
    state.targetItem = item
    state.marker = marker
    // 官方回覆函式可能剛定位到底部，搬移後維持使用者原本的閱讀位置。
    window.scrollTo(scrollPosition.x, scrollPosition.y)
    window.setTimeout(function () {
      window.scrollTo(scrollPosition.x, scrollPosition.y)
    }, 80)
  }

  function scheduleMove(host, item, marker, scrollPosition) {
    var state = states.get(host)
    if (!state || !item || !marker) return
    state.token += 1
    var token = state.token
    window.requestAnimationFrame(function () {
      moveEditor(state, item, marker, scrollPosition, token)
    })
  }

  function installClickListener() {
    if (clickListenerInstalled) return
    clickListenerInstalled = true
    document.addEventListener(
      "click",
      function (event) {
        var button = event.target && event.target.closest && event.target.closest("button.tag")
        if (!button || !/Forum\.C\.replyToFloor\s*\(/.test(button.getAttribute("onclick") || "")) return
        var host = button.closest(".c-post__footer.c-reply")
        // 階層留言的多樓標記複製節點沒有原始 id；展開分支後仍應可作為回覆框目標。
        var item = button.closest(".c-reply__item")
        if (!host || !item || !states.has(host)) return
        // 讓官方 inline onclick 先寫入回覆狀態，再搬移同一個 editor 節點。
        scheduleMove(host, item, getReplyMarker(button), { x: window.scrollX, y: window.scrollY })
      },
      true,
    )
  }

  function apply(list, enabled) {
    var host = list && list.parentElement
    if (!host) return
    var state = states.get(host)
    if (!enabled) {
      restoreEditor(state)
      states.delete(host)
      return
    }
    addStyles()
    if (!state) {
      state = { host: host, editor: getDirectEditor(host), placeholder: null, targetItem: null, marker: "", token: 0 }
      states.set(host, state)
    }
    installClickListener()
  }

  function dismiss(host) {
    // 其他標記操作改為多樓層標記時，回覆框立即回到底部原位置。
    restoreEditor(states.get(host))
  }

  tools.features = tools.features || {}
  tools.features.replyEditorFollow = { apply: apply, dismiss: dismiss }
})(window, document)
