import { selectAll } from "./dom";
import * as bug from "./debug";
import generateId from "./generateId";
import err from "./err";
import getIndex from "./getIndex";
import createProgressThreshold from "./createProgressThreshold";
import parseOffset from "./parseOffset";
import indexSteps from "./indexSteps";
import getOffsetTop from "./getOffsetTop";
import { setupScroll, direction, onScroll } from "./scroll";

function scrollama() {
	let cb = {};

	let id = generateId();
	let steps = [];
	let globalOffset;
	let containerElement;
	let rootElement;

	let progressThreshold = 0;

	let isEnabled = false;
	let isProgress = false;
	let isDebug = false;
	let isTriggerOnce = false;

	let exclude = [];

	/* HELPERS */
	function reset() {
		cb = {
			stepEnter: () => { },
			stepExit: () => { },
			stepProgress: () => { },
		};
		exclude = [];
	}

	function handleEnable(shouldEnable) {
		if (shouldEnable && !isEnabled) updateObservers();
		if (!shouldEnable && isEnabled) disconnectObservers();
		isEnabled = shouldEnable;
	}

	/* NOTIFY CALLBACKS */
	function notifyProgress(element, progress) {
		const index = getIndex(element);
		const step = steps[index];
		if (progress !== undefined) step.progress = progress;
		const response = { element, index, progress, direction };
		if (step.state === "enter") cb.stepProgress(response);
	}

	function notifyOthers(index, location) {
		console.log(index, location, direction, currentScrollY, previousScrollY);
		if (location === "above") {
			let i = direction === "down" ? 0 : index - 1;
			let end = direction === "down" ? i < index : i >= 0;
			let inc = direction === "down" ? 1 : -1;
			for (i; end; inc) {
				const step = steps[i];
				console.log(
					Object.keys(step)
						.map((p) => `${p} - ${step[p]}`)
						.join("\n ")
				);
				if (direction === "down") {
					if (step.state !== "enter" && step.direction !== "down") {
						notifyStepEnter(step.node, false);
						notifyStepExit(step.node, false);
					} else if (step.state === "enter") notifyStepExit(step.node, false);
				} else if (direction === "up") {
					if (step.state !== "enter" && step.direction === "down") {
						notifyStepEnter(step.node, false);
						notifyStepExit(step.node, false);
					} else if (step.state === "enter") notifyStepExit(step.node, false);
				}
			}
		} else if (location === "below") {
			for (let i = steps.length - 1; i > index; i -= 1) {
				const step = steps[i];
				if (step.state === "enter") notifyStepExit(step.node);
				if (step.direction === "down") {
					notifyStepEnter(step.node, false);
					notifyStepExit(step.node, false);
				}
			}
		}
	}

	function notifyStepEnter(element, check = true) {
		const index = getIndex(element);
		const step = steps[index];
		const response = { element, index, direction };

		step.direction = direction;
		step.state = "enter";

		// if (isPreserveOrder && check && direction !== "up")
		//   notifyOthers(index, "above");
		// if (isPreserveOrder && check && direction === "up")
		//   notifyOthers(index, "below");

		if (!exclude[index]) cb.stepEnter(response);
		if (isTriggerOnce) exclude[index] = true;
	}

	function notifyStepExit(element, check = true) {
		const index = getIndex(element);
		const step = steps[index];

		if (!step.state) return false;

		const response = { element, index, direction };

		if (isProgress) {
			if (direction === "down" && step.progress < 1) notifyProgress(element, 1);
			else if (direction === "up" && step.progress > 0)
				notifyProgress(element, 0);
		}

		step.direction = direction;
		step.state = "exit";

		cb.stepExit(response);
	}

	/* OBSERVERS - HANDLING */
	function resizeStep([entry]) {
		const index = getIndex(entry.target);
		const step = steps[index];
		const h = entry.target.offsetHeight;
		if (h !== step.height) {
			step.height = h;
			disconnectObserver(step);
			updateStepObserver(step);
			updateResizeObserver(step);
		}
	}

	function intersectStep([entry]) {
		onScroll(containerElement);

		const { isIntersecting, target } = entry;
		if (isIntersecting) notifyStepEnter(target);
		else notifyStepExit(target);
	}

	function intersectProgress([entry]) {
		const index = getIndex(entry.target);
		const step = steps[index];
		const { isIntersecting, intersectionRatio, target } = entry;
		if (isIntersecting && step.state === "enter")
			notifyProgress(target, intersectionRatio);
	}

	/*  OBSERVERS - CREATION */
	function disconnectObserver({ observers }) {
		Object.keys(observers).map((name) => {
			observers[name].disconnect();
		});
	}

	function disconnectObservers() {
		steps.forEach(disconnectObserver);
	}

	function updateResizeObserver(step) {
		const observer = new ResizeObserver(resizeStep);
		observer.observe(step.node);
		step.observers.resize = observer;
	}

	function updateResizeObservers() {
		steps.forEach(updateResizeObserver);
	}

	function updateStepObserver(step) {
		const h = window.innerHeight;
		const off = step.offset || globalOffset;
		const factor = off.format === "pixels" ? 1 : h;
		const offset = off.value * factor;
		const marginTop = step.height / 2 - offset;
		const marginBottom = step.height / 2 - (h - offset);
		const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
		const root = rootElement;

		const threshold = 0.5;
		const options = { rootMargin, threshold, root };
		const observer = new IntersectionObserver(intersectStep, options);

		observer.observe(step.node);
		step.observers.step = observer;

		if (isDebug) bug.update({ id, step, marginTop, marginBottom });
	}

	function updateStepObservers() {
		steps.forEach(updateStepObserver);
	}

	function updateProgressObserver(step) {
		const h = window.innerHeight;
		const off = step.offset || globalOffset;
		const factor = off.format === "pixels" ? 1 : h;
		const offset = off.value * factor;
		const marginTop = -offset + step.height;
		const marginBottom = offset - h;
		const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

		const threshold = createProgressThreshold(step.height, progressThreshold);
		const options = { rootMargin, threshold };
		const observer = new IntersectionObserver(intersectProgress, options);

		observer.observe(step.node);
		step.observers.progress = observer;
	}

	function updateProgressObservers() {
		steps.forEach(updateProgressObserver);
	}

	function updateObservers() {
		disconnectObservers();
		updateResizeObservers();
		updateStepObservers();
		if (isProgress) updateProgressObservers();
	}

	/* SETUP */
	const S = {};

	S.setup = ({
		step,
		parent,
		offset = 0.5,
		threshold = 4,
		progress = false,
		once = false,
		debug = false,
		container = undefined,
		root = null
	}) => {

		setupScroll(container);

		steps = selectAll(step, parent).map((node, index) => ({
			index,
			direction: undefined,
			height: node.offsetHeight,
			node,
			observers: {},
			offset: parseOffset(node.dataset.offset),
			top: getOffsetTop(node),
			progress: 0,
			state: undefined,
		}));

		if (!steps.length) {
			err("no step elements");
			return S;
		}

		isProgress = progress;
		isTriggerOnce = once;
		isDebug = debug;
		progressThreshold = Math.max(1, +threshold);
		globalOffset = parseOffset(offset);
		containerElement = container;
		rootElement = root;

		reset();
		indexSteps(steps);
		handleEnable(true);
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

	S.destroy = () => {
		handleEnable(false);
		reset();
		return S;
	};

	S.resize = () => {
		updateObservers();
		return S;
	};

	S.offset = (x) => {
		if (x === null || x === undefined) return globalOffset.value;
		globalOffset = parseOffset(x);
		updateObservers();
		return S;
	};

	S.onStepEnter = (f) => {
		if (typeof f === "function") cb.stepEnter = f;
		else err("onStepEnter requires a function");
		return S;
	};

	S.onStepExit = (f) => {
		if (typeof f === "function") cb.stepExit = f;
		else err("onStepExit requires a function");
		return S;
	};

	S.onStepProgress = (f) => {
		if (typeof f === "function") cb.stepProgress = f;
		else err("onStepProgress requires a function");
		return S;
	};
	return S;
}

export default scrollama;
