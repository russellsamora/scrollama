import { selectAll } from "./dom";
import * as bug from "./debug";
import { setupScroll, direction } from "./scroll";
import generateId from './generateId';
import err from './err';
import getIndex from './getIndex';
import createProgressThreshold from './createProgressThreshold';
import parseOffset from './parseOffset';
import indexSteps from './indexSteps';

function scrollama() {
  let cb = {};

  let id = undefined;
  let steps = [];
  let globalOffset;

  let progressThreshold = 0;

  let isEnabled = false;
  let isProgressMode = false;
  let isPreserveOrder = false;
  let isTriggerOnce = false;

  let exclude = [];

  /* HELPERS */
  function reset() {
    cb = {
      stepEnter: () => {},
      stepExit: () => {},
      stepProgress: () => {},
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
    // if (location === "above") {
    //   // check if steps above/below were skipped and should be notified first
    //   for (let i = 0; i < index; i += 1) {
    //     const ss = steps[i];
    //     if (ss.state !== "enter" && ss.direction !== "down") {
    //       notifyStepEnter(steps[i], "down", false);
    //       notifyStepExit(steps[i], "down");
    //     } else if (ss.state === "enter") notifyStepExit(steps[i], "down");
    //     // else if (ss.direction === 'up') {
    //     //   notifyStepEnter(steps[i], 'down', false);
    //     //   notifyStepExit(steps[i], 'down');
    //     // }
    //   }
    // } else if (location === "below") {
    //   for (let i = steps.length - 1; i > index; i -= 1) {
    //     const ss = steps[i];
    //     if (ss.state === "enter") {
    //       notifyStepExit(steps[i], "up");
    //     }
    //     if (ss.direction === "down") {
    //       notifyStepEnter(steps[i], "up", false);
    //       notifyStepExit(steps[i], "up");
    //     }
    //   }
    // }
  }

  function notifyStepEnter(element, check = true) {
    const index = getIndex(element);
    const step = steps[index];
    const response = { element, index, direction };

    step.direction = direction;
    step.state = "enter";

    // if (isPreserveOrder && check && dir === 'down') notifyOthers(index, 'above');
    // if (isPreserveOrder && check && dir === 'up') notifyOthers(index, 'below');

    if (!exclude[index]) cb.stepEnter(response);
    if (isTriggerOnce) exclude[index] = true;
  }

  function notifyStepExit(element) {
    const index = getIndex(element);
    const step = steps[index];

    if (!step.state) return false;

    const response = { element, index, direction };

    if (isProgressMode) {
      if (direction === "down" && step.progress < 1) notifyProgress(element, 1);
      else if (direction === "up" && step.progress > 0)
        notifyProgress(element, 0);
    }

    step.direction = direction;
    step.state = "exit";

    cb.stepExit(response);
  }

  /* OBSERVER - INTERSECT HANDLING */
  function resizeStep([entry]) {
    const index = getIndex(entry.target);
    const step = steps[index];
    const h = entry.target.offsetHeight;
    if (h !== step.height) {
      step.height = h;
      disconnectObserver(step);
      updateStepObserver(step);
      updateResizeObserver(step); // todo exclude
    }
  }

  function intersectStep([entry]) {
    const { isIntersecting, target } = entry;
    if (isIntersecting) notifyStepEnter(target);
    else notifyStepExit(target, scroll);
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

    const threshold = 0.5;
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(intersectStep, options);

    observer.observe(step.node);
    step.observers.step = observer;
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
    if (isProgressMode) updateProgressObservers();
  }

  
  /* SETUP FUNCTIONS */
  

  const S = {};

  S.setup = ({
    step,
    offset = 0.5,
    threshold = 4,
    progress = false,
    order = true,
    once = false,
  }) => {
    steps = selectAll(step).map((node, index) => ({
      index,
      direction: undefined,
      height: node.offsetHeight,
      node,
      observers: {},
      offset: parseOffset(node.dataset.offset),
      progress: 0,
      state: undefined,
    }));

    if (!steps.length) {
      err("no step elements");
      return S;
    }

    // options
    isProgressMode = progress;
    isPreserveOrder = order;
    isTriggerOnce = once;
    progressThreshold = Math.max(1, +threshold);

    id = generateId();
    globalOffset = parseOffset(offset);
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

setupScroll();

export default scrollama;
