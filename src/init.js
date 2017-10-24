import { select, selectAll } from './dom';

function scrollama() {
	let containerEl = null;
	let graphicEl = null;
	let stepEl = null;

	let offsetVal = 0;
	let offsetFromTop = 0;
	let offsetFromBottom = 0;
	let vh = 0;

	let direction = null;
	let bboxGraphic = null;
	let isEnabled = false;
	let debugMode = false;

	const callback = {};
	const notification = {};
	const observer = {};

	// NOTIFY CALLBACKS
	function notifyStep(element) {
		// console.log('notify step');
		const index = +element.getAttribute('data-scrollama-index');
		notification.step = { direction, element, index };
		if (typeof callback.step && typeof callback.step === 'function') {
			callback.step(notification.step);
			notification.step = null;
		}
	}

	function notifyIncrement() {
		const element = stepEl[index];
		if (typeof notification.increment === 'function') {
			callback.increment(notification.increment);
			notification.increment = null;
		}
	}

	function notifyEnter() {
		notification.enter = { direction };
		if (typeof callback.enter === 'function') {
			callback.enter(notification.enter);
			notification.enter = null;
		}
	}

	function notifyExit() {
		notification.exit = { direction };
		if (typeof callback.exit === 'function') {
			callback.exit(notification.exit);
			notification.exit = null;
		}
	}

	// OBSERVERS
	function intersectStepTop(entries) {
		entries.forEach(entry => {
			const { isIntersecting, boundingClientRect, target } = entry;
			const topEdge = boundingClientRect.top <= offsetFromTop;
			const bottomEdge = boundingClientRect.bottom >= offsetFromTop;
			if (isIntersecting && topEdge && bottomEdge) {
				direction = 'down';
				notifyStep(target);
			}
		});
	}

	function intersectStepBottom(entries) {
		entries.forEach(entry => {
			const { isIntersecting, boundingClientRect, target } = entry;
			const topEdge = boundingClientRect.top <= offsetFromTop;
			if (isIntersecting && topEdge) {
				direction = 'up';
				notifyStep(target);
			}
		});
	}

	function intersectTop(entries) {
		const { isIntersecting, boundingClientRect } = entries[0];
		const { top, bottom } = boundingClientRect;
		if (isIntersecting && top <= 0 && bottom > vh) {
			direction = 'down';
			notifyEnter();
		} else if (!isIntersecting && top >= 0) {
			direction = 'up';
			notifyExit();
		}
	}

	function intersectBottom(entries) {
		const { isIntersecting, boundingClientRect } = entries[0];
		const { bottom } = boundingClientRect;
		if (bottom < vh + bboxGraphic.height) {
			direction = isIntersecting ? 'up' : 'down';
			const fn = isIntersecting ? notifyEnter : notifyExit;
			fn.call();
		}
	}

	function updateTopObserver() {
		if (observer.top) observer.top.unobserve(containerEl);

		const options = {
			root: null,
			rootMargin: `0px 0px -${vh}px 0px`,
			threshold: 0,
		};

		observer.top = new IntersectionObserver(intersectTop, options);
		observer.top.observe(containerEl);
	}

	function updateBottomObserver() {
		if (observer.bottom) observer.bottom.unobserve(containerEl);
		const options = {
			root: null,
			rootMargin: `-${bboxGraphic.height}px 0px 0px 0px`,
			threshold: 0,
		};

		observer.bottom = new IntersectionObserver(intersectBottom, options);
		observer.bottom.observe(containerEl);
	}

	function updateStepTopObserver() {
		if (observer.stepT) observer.stepT.disconnect();

		const options = {
			root: null,
			rootMargin: `0px 0px -${offsetFromBottom}px 0px`,
			threshold: 0,
		};

		observer.stepT = new IntersectionObserver(intersectStepTop, options);
		stepEl.forEach(el => observer.stepT.observe(el));
	}

	function updateStepBottomObserver() {
		if (observer.stepB) observer.stepB.disconnect();

		const options = {
			root: null,
			rootMargin: `-${offsetFromTop}px 0px 0px 0px`,
			threshold: 0,
		};

		observer.stepB = new IntersectionObserver(intersectStepBottom, options);
		stepEl.forEach(el => observer.stepB.observe(el));
	}

	function updateAllObservers() {
		updateTopObserver();
		updateBottomObserver();
		updateStepTopObserver();
		updateStepBottomObserver();
	}

	// HELPER FUNCTIONS
	function handleResize() {
		vh = window.innerHeight;
		bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;
		offsetFromTop = Math.floor(offsetVal * vh);
		offsetFromBottom = Math.floor((1 - offsetVal) * vh);
		if (isEnabled) updateAllObservers();

		if (debugMode) {
			const debugEl = document.querySelector('.scrollama__offset');
			debugEl.style.top = `${offsetFromTop}px`;
		}
	}

	function handleEnable(enable) {
		if (enable && !isEnabled) {
			updateAllObservers();
			isEnabled = true;
		} else if (!enable) {
			Object.keys(observer).map(k => observer[k].disconnect());
			isEnabled = false;
		}
	}

	function indexSteps() {
		stepEl.forEach((el, i) => el.setAttribute('data-scrollama-index', i));
	}

	function addDebug() {
		const el = document.createElement('div');
		el.setAttribute('class', 'scrollama__offset');
		el.style.position = 'fixed';
		el.style.top = '0';
		el.style.left = '0';
		el.style.width = '100%';
		el.style.height = '1px';
		el.style.backgroundColor = 'lime';
		document.body.appendChild(el);
	}

	const S = {};

	S.setup = ({
		container,
		graphic,
		step,
		offset = 0.5,
		increment = false,
		debug = false,
	}) => {
		if (container && graphic && step) {
			containerEl = select(container);
			graphicEl = select(graphic);
			stepEl = selectAll(step);
			offsetVal = offset;
			debugMode = debug;

			if (debugMode) addDebug();
			// TODO first fire with takeRecords?
			indexSteps();
			handleResize();
			handleEnable(true);
		} else console.log('improper scrollama setup config');
		return S;
	};

	S.resize = () => {
		handleResize();
		return S;
	};

	S.enable = () => {
		handleEnable(true);
		return S;
	};

	S.disable = () => {
		handleEnable(false);
		return S;
	};

	S.onStep = cb => {
		callback.step = cb;
		if (notification.step) {
			console.log('instant step!');
			callback.step(notification.step);
			notification.step = null;
		}
		return S;
	};

	S.onIncrement = cb => {
		callback.increment = cb;
		if (notification.increment) {
			callback.increment(notification.increment);
			notification.increment = null;
		}
		return S;
	};

	S.onEnter = cb => {
		callback.enter = cb;
		if (notification.enter) {
			callback.enter(notification.enter);
			notification.enter = null;
		}
		return S;
	};

	S.onExit = cb => {
		callback.exit = cb;
		if (notification.exit) {
			callback.exit(notification.exit);
			notification.exit = null;
		}
		return S;
	};

	return S;
}

export default scrollama;
