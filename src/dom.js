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
	return document.querySelector(selector);
}

function selectAll(selector, parent = document) {
	return selectionToArray(parent.querySelectorAll(selector));
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
