import { selectAll } from "./dom";
import * as bug from "./debug";

function scrollama() {
  let cb = {};

  let id;
  let steps = [];
  let offsetValue = 0;
  let offsetMargin = 0;
  let previousYOffset = 0;
  let progressThreshold = 0;

  let isReady = false;
  let isEnabled = false;
  const isDebug = false;

  let progressMode = false;
  let preserveOrder = false;
  let triggerOnce = false;

  let direction;
  let format = "percent";

  const exclude = [];

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
  }

  function generateID() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const date = Date.now();
    const result = [];
    for (let i = 0; i < 6; i += 1) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      result.push(char);
    }
    return `${result.join("")}${date}`;
  }

  function getIndex(element) {
    return +element.getAttribute("data-scrollama-index");
  }

  function updateDirection() {
    if (window.pageYOffset > previousYOffset) direction = "down";
    else if (window.pageYOffset < previousYOffset) direction = "up";
    previousYOffset = window.pageYOffset;
  }

  function disconnectObserver({ observers }) {
    Object.keys(observers).map((name) => {
      observers[name].disconnect();
    });
  }

  function disconnectObservers() {
    steps.forEach(disconnectObserver);
  }

  function handleResize() {
    if (isReady) {
      steps = steps.map((step) => ({
        ...step,
        height: step.node.offsetHeight,
      }));
      if (isEnabled) updateObservers();
    }
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      // enable a disabled scroller
      if (isReady) updateObservers();
      else {
        // can't enable an unready scroller
        err("scrollama error: enable() called before scroller was ready");
        isEnabled = false;
        return; // all is not well, don't set the requested state
      }
    }
    if (!enable && isEnabled) disconnectObservers();
    isEnabled = enable; // all is well, set requested state
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

  /* NOTIFY CALLBACKS */
  function notifyStepProgress(element, progress) {
    const index = getIndex(element);
    if (progress !== undefined) steps[index].progress = progress;
    const resp = { element, index, progress: steps[index].progress };

    if (steps[index].state === "enter") cb.stepProgress(resp);
  }

  function notifyOthers(index, location) {
    if (location === "above") {
      // check if steps above/below were skipped and should be notified first
      for (let i = 0; i < index; i += 1) {
        const ss = steps[i];
        if (ss.state !== "enter" && ss.direction !== "down") {
          notifyStepEnter(steps[i], "down", false);
          notifyStepExit(steps[i], "down");
        } else if (ss.state === "enter") notifyStepExit(steps[i], "down");
        // else if (ss.direction === 'up') {
        //   notifyStepEnter(steps[i], 'down', false);
        //   notifyStepExit(steps[i], 'down');
        // }
      }
    } else if (location === "below") {
      for (let i = steps.length - 1; i > index; i -= 1) {
        const ss = steps[i];
        if (ss.state === "enter") {
          notifyStepExit(steps[i], "up");
        }
        if (ss.direction === "down") {
          notifyStepEnter(steps[i], "up", false);
          notifyStepExit(steps[i], "up");
        }
      }
    }
  }

  function notifyStepEnter(element, dir, check = true) {
    const index = getIndex(element);
    const ss = steps[index];
    const response = { element, index, direction: dir };

    ss.direction = dir;
    ss.state = "enter";

    // if (preserveOrder && check && dir === 'down') notifyOthers(index, 'above');
    // if (preserveOrder && check && dir === 'up') notifyOthers(index, 'below');

    if (!exclude[index]) cb.stepEnter(response);
    if (triggerOnce) exclude[index] = true;
    if (progressMode) notifyStepProgress(element);
  }

  function notifyStepExit(element, dir) {
    const index = getIndex(element);
    const ss = steps[index];

    if (!ss.state) return false;

    const response = { element, index, direction: dir };

    // if (progressMode) {
    //   if (dir === 'down' && steps[index].progress < 1)
    //     notifyStepProgress(element, 1);
    //   else if (dir === 'up' && steps[index].progress > 0)
    //     notifyStepProgress(element, 0);
    // }

    ss.direction = dir;
    ss.state = "exit";

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
    const {
      isIntersecting,
      intersectionRatio,
      boundingClientRect,
      target,
    } = entry;
    console.log(intersectionRatio);
    // const { bottom } = boundingClientRect;
    // const bottomAdjusted = bottom - offsetMargin;
    // if (isIntersecting && bottomAdjusted >= 0) {
    //   notifyStepProgress(target, +intersectionRatio);
    // }
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
    // const rem = (h - step.height) / 2;
    const factor = format === "pixels" ? 1 : h;
    const margin = offsetValue * factor;
    const marginTop = step.height / 2 - (h - margin);
    const marginBottom = step.height / 2 - margin;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    console.log({ h, margin, marginTop, marginBottom });

    const threshold = 0.5;
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(intersectStep, options);

    observer.observe(step.node);
    step.observers.step = observer;

    if (document.querySelector("#div1")) {
      const n1 = document.querySelector("#div1");
      n1.style.background = "yellow";
      n1.style.height = `${margin}px`;
      const n2 = document.querySelector("#div2");
      n2.style.background = "yellow";
      n2.style.height = `${margin}px`;
    } else {
      const div1 = document.createElement("div");
      div1.id = "div1";
      div1.style.position = "fixed";
      div1.style.left = "0";
      div1.style.top = "0";
      div1.style.width = "100%";
      div1.style.height = `${Math.max(marginTop * -1, 1)}px`;
      div1.style.background = "pink";
      div1.style.zIndex = "0";

      const div2 = document.createElement("div");
      div2.id = "div2";
      div2.style.position = "fixed";
      div2.style.left = "0";
      div2.style.bottom = "0";
      div2.style.width = "100%";
      div2.style.height = `${Math.max(marginBottom * -1, 1)}px`;
      div2.style.background = "pink";
      div2.style.zIndex = "0";

      document.body.appendChild(div1);
      document.body.appendChild(div2);
    }
  }

  function updateStepObservers() {
    steps.forEach(updateStepObserver);
  }

  function updateProgressObserver(step) {
    const margin = (window.innerHeight - step.height) / 2;
    const rootMargin = `-${margin}px 0px -${margin}px 0px`;
    const threshold = createProgressThreshold(step.height);
    console.log(threshold);
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(intersectProgress, options);
    observer.observe(step.node);
    step.observers.progress = observer;

    // const marginTop = step.height -;
    // const marginBottom = -window.innerHeight + offsetMargin;
    // const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    // const threshold = createThreshold(stepHeights[i]);
    // const options = { rootMargin, threshold };
    // const observer = new IntersectionObserver(intersectStepProgress, options);
    // observer.observe(el);
    // step.observers.progress = observer;
  }

  function updateProgressObservers() {
    steps.forEach(updateProgressObserver);
  }

  function updateObservers() {
    disconnectObservers();
    updateResizeObservers();
    updateStepObservers();
    if (progressMode) updateProgressObservers();
  }

  /* SETUP FUNCTIONS */

  function indexSteps() {
    steps.forEach((step) =>
      step.node.setAttribute("data-scrollama-index", step.index)
    );
  }

  function addDebug() {
    if (isDebug) bug.setup({ id, steps, offsetValue });
  }

  function isYScrollable(element) {
    const style = window.getComputedStyle(element);
    return (
      (style.overflowY === "scroll" || style.overflowY === "auto") &&
      element.scrollHeight > element.clientHeight
    );
  }

  // recursively search the DOM for a parent container with overflowY: scroll and fixed height
  // ends at document
  function anyScrollableParent(element) {
    if (element && element.nodeType === 1) {
      // check dom elements only, stop at document
      // if a scrollable element is found return the element
      // if not continue to next parent
      return isYScrollable(element)
        ? element
        : anyScrollableParent(element.parentNode);
    }
    return false; // didn't find a scrollable parent
  }

  const S = {};

  S.setup = ({
    step,
    offset = 0.5,
    progress = false,
    threshold = 4,
    order = true,
    once = false,
  }) => {
    steps = selectAll(step).map((node, index) => ({
      node,
      index,
      direction: undefined,
      state: undefined,
      observers: {},
      progress: 0,
    }));

    if (!steps.length) {
      err("no step elements");
      return S;
    }

    reset();
    id = generateID();

    // ensure that no step has a scrollable parent element in the dom tree
    // check current step for scrollable parent
    // assume no scrollable parents to start
    const scrollableParent = steps.reduce(
      (foundScrollable, s) =>
        foundScrollable || anyScrollableParent(s.parentNode),
      false
    );
    if (scrollableParent)
      err(
        "scrollama error: step elements cannot be children of a scrollable element. Remove any css on the parent element with overflow: scroll; or overflow: auto; on elements with fixed height."
      );

    // options
    progressMode = progress;
    preserveOrder = order;
    triggerOnce = once;

    S.offsetTrigger(offset);
    progressThreshold = Math.max(1, +threshold);

    isReady = true;
    indexSteps();
    handleResize();
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
    if (x === null || x === undefined) return offsetValue;

    if (typeof x === "number") {
      format = "percent";
      if (x > 1) err("offset value is greater than 1. Fallback to 1.");
      if (x < 0) err("offset value is lower than 0. Fallback to 0.");
      offsetValue = Math.min(Math.max(0, x), 1);
    } else if (typeof x === "string" && x.indexOf("px") > 0) {
      const v = +x.replace("px", "");
      if (!isNaN(v)) {
        format = "pixels";
        offsetValue = v;
      } else {
        err("offset value must be in 'px' format. Fallback to 0.5.");
        offsetValue = 0.5;
      }
    } else {
      err("offset value does not include 'px'. Fallback to 0.5.");
      offsetValue = 0.5;
    }
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
