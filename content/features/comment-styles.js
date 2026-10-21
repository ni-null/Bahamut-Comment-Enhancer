/**
 * 功能簡介：管理可切換的留言樣式。各樣式以獨立模組註冊，避免 CSS 與 DOM 邏輯互相耦合。
 */
(function (window) {
  'use strict';

  var tools = window.BahamutCommentTools = window.BahamutCommentTools || {};
  var ATTRIBUTE = 'data-comment-thread-comment-style';
  var definitions = Object.create(null);
  var names = [];

  function register(name, definition) {
    if (!name || !definition || typeof definition.label !== 'string') return;
    if (!definitions[name]) names.push(name);
    definitions[name] = definition;
  }

  function has(name) {
    return Boolean(definitions[name]);
  }

  function getOptions() {
    return names.map(function (name) {
      return { value: name, label: definitions[name].label };
    });
  }

  function getDisabledSettings(name) {
    var definition = definitions[has(name) ? name : 'default'];
    if (!definition || !Array.isArray(definition.disabledSettings)) return [];
    return definition.disabledSettings.filter(function (settingName, index, values) {
      return typeof settingName === 'string' && values.indexOf(settingName) === index;
    });
  }

  function getDefaultSettings(name) {
    var definition = definitions[has(name) ? name : 'default'];
    return definition && definition.defaultSettings
      ? Object.assign({}, definition.defaultSettings)
      : {};
  }

  function resolveSettings(settings, defaults) {
    var resolved = Object.assign({}, settings);
    getDisabledSettings(resolved.commentStyle).forEach(function (settingName) {
      if (defaults && Object.prototype.hasOwnProperty.call(defaults, settingName)) {
        resolved[settingName] = defaults[settingName];
      }
    });
    return resolved;
  }

  function apply(list, name) {
    if (!list) return;
    var nextName = has(name) ? name : 'default';
    var currentName = list.getAttribute(ATTRIBUTE) || 'default';
    var current = definitions[currentName];
    if (currentName !== nextName && current && typeof current.restore === 'function') current.restore(list);

    var next = definitions[nextName];
    if (next && typeof next.apply === 'function') next.apply(list);
    if (nextName === 'default') list.removeAttribute(ATTRIBUTE);
    else list.setAttribute(ATTRIBUTE, nextName);
  }

  tools.commentStyles = { register: register };
  tools.features = tools.features || {};
  tools.features.commentStyles = {
    apply: apply,
    has: has,
    getOptions: getOptions,
    getDisabledSettings: getDisabledSettings,
    getDefaultSettings: getDefaultSettings,
    resolveSettings: resolveSettings
  };
})(window);
