(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.scrollama = {})));
}(this, (function (exports) { 'use strict';

// DOM helper functions

// private
function selectionToArray(selection) {
	var len = selection.length;
	var result = [];
	for (var i = 0; i < len; i += 1) {
		result.push(selection[i]);
	}
	return result;
}

// public
function select(selector) {
	return document.querySelector(selector);
}

function selectAll(selector, parent) {
	if ( parent === void 0 ) parent = document;

	return selectionToArray(parent.querySelectorAll(selector));
}

function scrollama() {
	var indexPrev = -1;
	var index = 0;
	var progressPrev = 0;
	var progress = 0;
	var yPos = 0;
	var yPosPrev = 0;

	var numSteps = 0;
	var offset = 0;
	var vh = 0;

	var ticking = false;
	var stateEnter = false;
	var stateExit = true;

	var direction = null;
	var bboxGraphic = null;

	var graphicEl = null;
	var textEl = null;
	var stepEl = null;

	var isEnabled = false;

	var callback = {};
	var notification = {};

	// NOTIFY CALLBACKS
	function notifyStep() {
		var element = stepEl[index];
		notification.step = { index: index, direction: direction, element: element };
		if (typeof callback.step && typeof callback.step === 'function') {
			callback.step(notification.step);
			notification.step = null;
		}
	}

	function notifyProgress() {
		var element = stepEl[index];
		notification.progress = { index: index, progress: progress, direction: direction, element: element };
		if (typeof callback.progress === 'function') {
			callback.progress(notification.progress);
			notification.progress = null;
		}
	}

	function notifyEnter() {
		notification.enter = { direction: direction };
		if (typeof callback.enter === 'function') {
			callback.enter(notification.enter);
			notification.enter = null;
		}
	}

	function notifyExit() {
		notification.exit = { direction: direction };
		if (typeof callback.exit === 'function') {
			callback.exit(notification.exit);
			notification.exit = null;
		}
	}

	// HELPER FUNCTIONS
	function findStep(ref) {
		var complete = ref.complete;
		var off = ref.off;

		var i = Math.floor(complete * numSteps);
		// look at the steps before and after as well to find right one
		var matches = [i - 1, i, i + 1].filter(function (d) {
			var a = d >= 0;
			var b = d < numSteps;
			var c = stepEl[d].getBoundingClientRect().top - off < 0;
			return a && b && c;
		});
		return matches.pop() || 0;
	}

	// CHECKERS
	// check if we need to trigger graphic to update
	function checkStep(ref) {
		var bbox = ref.bbox;
		var off = ref.off;

		// total progress complete
		var bottom = bbox.bottom - off;
		var complete = 1 - bottom / bbox.height;
		// update step index
		index = findStep({ complete: complete, off: off });
		if (index !== indexPrev) {
			indexPrev = index;
			notifyStep();
		}

		// update progress
		var bboxStep = stepEl[index].getBoundingClientRect();
		progress = Math.max(0, 1 - bboxStep.bottom / bboxStep.height);
		if (progress !== progressPrev) {
			progressPrev = progress;
			notifyProgress();
		}
	}

	function checkEnter() {
		if (!stateEnter) {
			stateEnter = true;
			stateExit = false;
			notifyEnter();
		}
	}

	function checkExit() {
		if (!stateExit) {
			stateExit = true;
			stateEnter = false;
			notifyExit();
		}
	}

	function updateDirection() {
		// update direction
		direction = yPos < yPosPrev ? 'up' : 'down';
		yPosPrev = yPos;
	}

	// UPDATE
	function update() {
		if (textEl) {
			var bbox = textEl.getBoundingClientRect();
			updateDirection();

			var off = vh * offset;
			if (bbox.top < off && bbox.bottom > off) { checkStep({ bbox: bbox, off: off }); }

			if (bbox.top < 0 && bbox.bottom > bboxGraphic.height) { checkEnter(); }
			else { checkExit(); }
			ticking = false;
		}
	}

	// EVENTS
	function requestTick() {
		if (!ticking) { window.requestAnimationFrame(update); }
		ticking = true;
	}

	function handleScroll() {
		yPos = window.scrollY;
		if (!ticking) { requestTick(); }
	}

	function handleResize() {
		vh = window.innerHeight;
		bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;
	}

	function handleEnable(enable) {
		if (enable && !isEnabled) {
			window.addEventListener('scroll', handleScroll, true);
			isEnabled = true;
		} else if (!enable) {
			window.removeEventListener('scroll', handleScroll, true);
			isEnabled = false;
		}
	}

	var scrolly = {};

	scrolly.setup = function (params) {
		graphicEl = select(params.graphic);
		textEl = select(params.text);
		stepEl = selectAll(params.step);
		offset = 1 - params.offset;
		numSteps = stepEl.length;
		handleEnable(true);
		handleResize();
		handleScroll();
		update();
		return scrolly;
	};

	scrolly.resize = function () {
		handleResize();
		return scrolly;
	};

	scrolly.enable = function () {
		handleEnable(true);
		return scrolly;
	};

	scrolly.disable = function () {
		handleEnable(false);
		return scrolly;
	};

	scrolly.onStep = function (cb) {
		callback.step = cb;
		if (notification.step) {
			callback.step(notification.step);
			notification.step = null;
		}
		return scrolly;
	};

	scrolly.onProgress = function (cb) {
		callback.progress = cb;
		if (notification.progress) {
			callback.progress(notification.progress);
			notification.progress = null;
		}
		return scrolly;
	};

	scrolly.onEnter = function (cb) {
		callback.enter = cb;
		if (notification.enter) {
			callback.enter(notification.enter);
			notification.enter = null;
		}
		return scrolly;
	};

	scrolly.onExit = function (cb) {
		callback.exit = cb;
		if (notification.exit) {
			callback.exit(notification.exit);
			notification.exit = null;
		}
		return scrolly;
	};

	return scrolly;
}

exports.scrollama = scrollama;

Object.defineProperty(exports, '__esModule', { value: true });

})));
