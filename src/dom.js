// DOM helper functions

// public
function select(selector) {
	return document.querySelector(selector);
}

function selectAll(selector, parent = document) {
	return Array.from(parent.querySelectorAll(selector));
}

function find(el, selector) {
	return Array.from(el.querySelectorAll(selector));
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
