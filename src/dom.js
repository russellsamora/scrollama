// DOM helper functions

// public
function selectAll(selector, parent = document) {
  if (typeof selector === 'string') {
    return Array.from(parent.querySelectorAll(selector));
  } else if (selector instanceof Element) {
    return [selector];
  } else if (selector instanceof NodeList) {
    return Array.from(selector);
  } else if (selector instanceof Array) {
    return selector;
  }
  return [];
}

export { selectAll };
