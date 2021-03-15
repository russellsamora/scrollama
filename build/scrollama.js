(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.scrollama = factory());
}(this, (function () { 'use strict';

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

  function scrollama() {
    let cb = {};
    let steps = [];
    let globalOffset;

    let previousYOffset = 0;
    let progressThreshold = 0;

    let direction;

    let isEnabled = false;
    let isProgressMode = false;
    let isTriggerOnce = false;

    let exclude = [];

    /* HELPERS */
    function err(msg) {
      console.error(`scrollama error: ${msg}`);
    }

    function reset() {
      cb = {
        stepEnter: () => {},
        stepExit: () => {},
        stepProgress: () => {},
      };
      exclude = [];
    }

    function getIndex(node) {
      return +node.getAttribute("data-scrollama-index");
    }

    function updateDirection() {
      if (window.pageYOffset > previousYOffset) direction = "down";
      else if (window.pageYOffset < previousYOffset) direction = "up";
      previousYOffset = window.pageYOffset;
    }

    function handleResize() {
      steps = steps.map((step) => ({
        ...step,
        height: step.node.offsetHeight,
      }));

      if (isEnabled) updateObservers();
    }

    function handleEnable(shouldEnable) {
      if (shouldEnable && !isEnabled) updateObservers();
      if (!shouldEnable && isEnabled) disconnectObservers();
      isEnabled = shouldEnable;
    }

    function createProgressThreshold(height) {
      const count = Math.ceil(height / progressThreshold);
      const t = [];
      const ratio = 1 / count;
      for (let i = 0; i < count + 1; i += 1) {
        t.push(i * ratio);
      }
      return t;
    }

    function parseOffset(x) {
      if (typeof x === "string" && x.indexOf("px") > 0) {
        const v = +x.replace("px", "");
        if (!isNaN(v)) return { format: "pixels", value: v };
        else {
          err("offset value must be in 'px' format. Fallback to 0.5.");
          return { format: "percent", value: 0.5 };
        }
      } else if (typeof x === "number" || !isNaN(+x)) {
        if (x > 1) err("offset value is greater than 1. Fallback to 1.");
        if (x < 0) err("offset value is lower than 0. Fallback to 0.");
        return { format: "percent", value: Math.min(Math.max(0, x), 1) };
      }
      return null;
    }

    /* NOTIFY CALLBACKS */
    function notifyProgress(element, progress) {
      const index = getIndex(element);
      if (progress !== undefined) steps[index].progress = progress;
      const resp = { element, index, progress: steps[index].progress };

      if (steps[index].state === "enter") cb.stepProgress(resp);
    }

    function notifyStepEnter(element, dir, check = true) {
      const index = getIndex(element);
      const step = steps[index];
      const response = { element, index, direction: dir };

      step.direction = dir;
      step.state = "enter";

      // if (isPreserveOrder && check && dir === 'down') notifyOthers(index, 'above');
      // if (isPreserveOrder && check && dir === 'up') notifyOthers(index, 'below');

      if (!exclude[index]) cb.stepEnter(response);
      if (isTriggerOnce) exclude[index] = true;
      // if (isProgressMode) notifyProgress(element);
    }

    function notifyStepExit(element, dir) {
      const index = getIndex(element);
      const step = steps[index];

      if (!step.state) return false;

      const response = { element, index, direction: dir };

      // todo
      // if (isProgressMode) {
      //   if (dir === 'down' && steps[index].progress < 1)
      //     notifyStepProgress(element, 1);
      //   else if (dir === 'up' && steps[index].progress > 0)
      //     notifyStepProgress(element, 0);
      // }

      step.direction = dir;
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
      updateDirection();
      const { isIntersecting, intersectionRatio, target } = entry;
      if (isIntersecting) notifyStepEnter(target, direction);
      else notifyStepExit(target, direction);
    }

    function intersectProgress([entry]) {
      // updateDirection();
      const index = getIndex(entry.target);
      const step = steps[index];
      const { isIntersecting, intersectionRatio, target } = entry;
      if (isIntersecting && step.state === "enter")
        notifyProgress(target, intersectionRatio);
    }

    /*  OBSERVER - CREATION */
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
      const marginTop = step.height / 2 - (h - offset);
      const marginBottom = step.height / 2 - offset;
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
      const marginTop = step.height - (h - offset);
      const marginBottom = -offset;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const threshold = createProgressThreshold(step.height);
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

    function disconnectObserver({ observers }) {
      Object.keys(observers).map((name) => {
        observers[name].disconnect();
      });
    }

    function disconnectObservers() {
      steps.forEach(disconnectObserver);
    }

    /* SETUP FUNCTIONS */

    function indexSteps() {
      steps.forEach((step) =>
        step.node.setAttribute("data-scrollama-index", step.index)
      );
    }

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
      isTriggerOnce = once;
      progressThreshold = Math.max(1, +threshold);
      reset();
      indexSteps();
      S.offsetTrigger(offset);
      S.enable();
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

    S.destroy = () => {
      handleEnable(false);
      reset();
    };

    S.offsetTrigger = (x) => {
      if (x === null || x === undefined) return globalOffset.value;
      globalOffset = parseOffset(x);
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

  return scrollama;

})));
