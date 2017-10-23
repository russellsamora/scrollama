import { select, selectAll } from './dom';

function scrollama() {
	const indexPrev = -1;
	const index = 0;
	const progressPrev = 0;
	const progress = 0;
	const yPos = 0;
	const yPosPrev = 0;

	let numSteps = 0;
	let offsetVal = 0;
	let offsetPx = 0;
	let inversePx = 0;
	let vh = 0;

	let direction = null;
	let bboxGraphic = null;

	let containerEl = null;
	let graphicEl = null;
	let stepEl = null;

	let isEnabled = false;

	const callback = {};
	const notification = {};

	const observer = {
		stepT: null,
		stepB: null,
		top: null,
		bottom: null,
	};

	// NOTIFY CALLBACKS
	function notifyStep(element) {
		notification.step = { direction, element };
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

	// HELPER FUNCTIONS
	function findStep({ complete, off }) {
		const i = Math.floor(complete * numSteps);
		// look at the steps before and after as well to find right one
		const matches = [i - 1, i, i + 1].filter(d => {
			const dummy = 0;
			return (
				d >= 0 &&
				d < numSteps &&
				stepEl[d].getBoundingClientRect().top - off < 0
			);
		});
		return matches.pop() || 0;
	}

	function handleResize() {
		vh = window.innerHeight;
		bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;
		offsetPx = Math.floor(offsetVal * vh);
		inversePx = vh - offsetPx;
	}

	function handleEnable(enable) {
		// TODO
		if (enable && !isEnabled) {
			window.addEventListener('scroll', handleScroll, true);
			isEnabled = true;
		} else if (!enable) {
			window.removeEventListener('scroll', handleScroll, true);
			isEnabled = false;
		}
	}

	// SETUP
	function intersectStepTop(entries) {
		entries.forEach(entry => {
			const { isIntersecting, boundingClientRect, target } = entry;
			if (isIntersecting && boundingClientRect.top < vh - offsetPx) {
				direction = 'down';
				notifyStep(target);
			}
		});
	}

	function intersectStepBottom(entries) {
		entries.forEach(entry => {
			const { isIntersecting, boundingClientRect, target } = entry;
			if (isIntersecting && boundingClientRect.top < inversePx) {
				direction = 'up';
				notifyStep(target);
			}
		});
	}

	function intersectTop(entries) {
		const { isIntersecting, boundingClientRect } = entries[0];
		if (boundingClientRect.top < vh) {
			direction = isIntersecting ? 'down' : 'up';
			const fn = isIntersecting ? notifyEnter : notifyExit;
			fn.call();
		}
	}

	function intersectBottom(entries) {
		const { isIntersecting, boundingClientRect } = entries[0];
		if (boundingClientRect.bottom < vh + bboxGraphic.height) {
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
			rootMargin: `0px 0px -${offsetPx}px 0px`,
			threshold: 0,
		};

		observer.stepT = new IntersectionObserver(intersectStepTop, options);
		stepEl.forEach(el => observer.stepT.observe(el));
	}

	function updateStepBottomObserver() {
		if (observer.stepB) observer.stepB.disconnect();

		const options = {
			root: null,
			rootMargin: `-${inversePx}px 0px 0px 0px`,
			threshold: 0,
		};

		observer.stepB = new IntersectionObserver(intersectStepBottom, options);
		stepEl.forEach(el => observer.stepB.observe(el));
	}

	const S = {};

	S.setup = ({ container, graphic, step, offset = 0.5, increment = false }) => {
		if (container && graphic && step) {
			containerEl = select(container);
			graphicEl = select(graphic);
			stepEl = selectAll(step);
			offsetVal = 1 - offset;
			numSteps = stepEl.length;

			// TODO first fire with takeRecords?
			handleResize();
			updateTopObserver();
			updateBottomObserver();
			updateStepTopObserver();
			updateStepBottomObserver();
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
