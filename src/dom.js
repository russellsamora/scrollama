// DOM helper functions

// private
function selectionToArray(selection) {
  const len = selection.length;
  const result = [];
  for (let i = 0; i < len; i += 1) {
    result.push(selection[i]);
  }
  return result;
}

// public
function select(selector) {
  if (selector instanceof Element) return selector;
  else if (typeof selector === 'string')
    return document.querySelector(selector);
  return null;
}

function selectAll(selector, parent = document) {
  if (typeof selector === 'string') {
    return selectionToArray(parent.querySelectorAll(selector));
  } else if (selector instanceof Element) {
    return selectionToArray([selector]);
  } else if (selector instanceof NodeList) {
    return selectionToArray(selector);
  } else if (selector instanceof Array) {
    return selector;
  }
  return [];
}

function find(el, selector) {
  return selectionToArray(el.querySelectorAll(selector));
}

function removeClass(el, className) {
  el.classList.remove(className);
}

function addClass(el, className) {
  el.classList.add(className);
}

function hasClass(el, className) {
  return el.classList.contains(className);
}

export { select, selectAll, find, removeClass, addClass, hasClass };
