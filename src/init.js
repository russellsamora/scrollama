import { select, selectAll } from './dom';
import * as bug from './debug';

function scrollama() {
  const ZERO_MOE = 1; // zero with some rounding margin of error
  const margin = {};
  const callback = {};
  const io = {};

  let containerEl = null;
  let graphicEl = null;
  let stepEl = null;

  let id = null;
  let offsetVal = 0;
  let offsetMargin = 0;
  let vh = 0;
  let ph = 0;
  let stepOffsetHeight = null;
  let stepOffsetTop = null;
  let bboxGraphic = null;

  let isReady = false;
  let isEnabled = false;
  let debugMode = false;
  let progressMode = false;
  let progressThreshold = 0;
  let preserveOrder = false;
  let triggerOnce = false;

  let stepStates = null;
  let containerState = null;
  let previousYOffset = -1;
  let direction = null;

  const exclude = [];

  // HELPERS
  function generateId() {
    const a = 'abcdefghijklmnopqrstuv';
    const l = a.length;
    const t = new Date().getTime();
    const r = [0, 0, 0].map(d => a[Math.floor(Math.random() * l)]).join('');
    return `${r}${t}`;
  }

  //www.gomakethings.com/how-to-get-an-elements-distance-from-the-top-of-the-page-with-vanilla-javascript/
  function getOffsetTop(el) {
    // Set our distance placeholder
    let distance = 0;

    // Loop up the DOM
    if (el.offsetParent) {
      do {
        distance += el.offsetTop;
        el = el.offsetParent;
      } while (el);
    }

    // Return our distance
    return distance < 0 ? 0 : distance;
  }

  function getPageHeight() {
    const body = document.body;
    const html = document.documentElement;

    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
  }

  function getIndex(element) {
    return +element.getAttribute('data-scrollama-index');
  }

  function updateDirection() {
    if (window.pageYOffset > previousYOffset) direction = 'down';
    else if (window.pageYOffset < previousYOffset) direction = 'up';
    previousYOffset = window.pageYOffset;
  }

  function handleResize() {
    vh = window.innerHeight;
    ph = getPageHeight();

    bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;

    offsetMargin = offsetVal * vh;

    stepOffsetHeight = stepEl ? stepEl.map(el => el.offsetHeight) : [];

    stepOffsetTop = stepEl ? stepEl.map(getOffsetTop) : [];

    if (isEnabled && isReady) updateIO();

    if (debugMode)
      bug.update({ id, stepOffsetHeight, offsetMargin, offsetVal });
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      if (isReady) updateIO();
      isEnabled = true;
    } else if (!enable) {
      if (io.top) io.top.disconnect();
      if (io.bottom) io.bottom.disconnect();
      if (io.stepAbove) io.stepAbove.forEach(d => d.disconnect());
      if (io.stepBelow) io.stepBelow.forEach(d => d.disconnect());
      if (io.stepProgress) io.stepProgress.forEach(d => d.disconnect());
      if (io.viewportAbove) io.viewportAbove.forEach(d => d.disconnect());
      if (io.viewportBelow) io.viewportBelow.forEach(d => d.disconnect());
      isEnabled = false;
    }
  }

  function createThreshold(height) {
    const count = Math.ceil(height / progressThreshold);
    const t = [];
    const ratio = 1 / count;
    for (let i = 0; i < count; i++) {
      t.push(i * ratio);
    }
    return t;
  }

  // NOTIFY CALLBACKS
  function notifyOthers(index, location) {
    if (location === 'above') {
      // check if steps above/below were skipped and should be notified first
      for (let i = 0; i < index; i++) {
        const ss = stepStates[i];
        if (ss.state === 'enter') notifyStepExit(stepEl[i], 'down');
        if (ss.direction === 'up') {
          notifyStepEnter(stepEl[i], 'down', false);
          notifyStepExit(stepEl[i], 'down');
        }
      }
    } else if (location === 'below') {
      for (let i = stepStates.length - 1; i > index; i--) {
        const ss = stepStates[i];
        if (ss.state === 'enter') {
          notifyStepExit(stepEl[i], 'up');
        }
        if (ss.direction === 'down') {
          notifyStepEnter(stepEl[i], 'up', false);
          notifyStepExit(stepEl[i], 'up');
        }
      }
    }
  }

  function notifyStepEnter(element, direction, check = true) {
    const index = getIndex(element);
    const resp = { element, index, direction };

    // store most recent trigger
    stepStates[index].direction = direction;
    stepStates[index].state = 'enter';

    if (preserveOrder && check && direction === 'down')
      notifyOthers(index, 'above');

    if (preserveOrder && check && direction === 'up')
      notifyOthers(index, 'below');

    if (
      callback.stepEnter &&
      typeof callback.stepEnter === 'function' &&
      !exclude[index]
    ) {
      callback.stepEnter(resp, stepStates);
      if (debugMode) bug.notifyStep({ id, index, state: 'enter' });
      if (triggerOnce) exclude[index] = true;
    }

    if (progressMode) {
      if (direction === 'down') notifyStepProgress(element, 0);
      else notifyStepProgress(element, 1);
    }
  }

  function notifyStepExit(element, direction) {
    const index = getIndex(element);
    const resp = { element, index, direction };

    // store most recent trigger
    stepStates[index].direction = direction;
    stepStates[index].state = 'exit';

    if (progressMode) {
      if (direction === 'down') notifyStepProgress(element, 1);
      else notifyStepProgress(element, 0);
    }

    if (callback.stepExit && typeof callback.stepExit === 'function') {
      callback.stepExit(resp, stepStates);
      if (debugMode) bug.notifyStep({ id, index, state: 'exit' });
    }
  }

  function notifyStepProgress(element, progress) {
    const index = getIndex(element);
    const resp = { element, index, progress };
    if (callback.stepProgress && typeof callback.stepProgress === 'function')
      callback.stepProgress(resp);
  }

  function notifyContainerEnter() {
    const resp = { direction };
    containerState.direction = direction;
    containerState.state = 'enter';
    if (
      callback.containerEnter &&
      typeof callback.containerEnter === 'function'
    )
      callback.containerEnter(resp);
  }

  function notifyContainerExit() {
    const resp = { direction };
    containerState.direction = direction;
    containerState.state = 'exit';
    if (callback.containerExit && typeof callback.containerExit === 'function')
      callback.containerExit(resp);
  }

  // OBSERVER - INTERSECT HANDLING

  // if TOP edge of step crosses threshold,
  // bottom must be > 0 which means it is on "screen" (shifted by offset)
  function intersectStepAbove(entries) {
    updateDirection();
    entries.forEach(entry => {
      const { isIntersecting, boundingClientRect, target } = entry;

      // bottom is how far bottom edge of el is from top of viewport
      const { bottom, height } = boundingClientRect;
      const bottomAdjusted = bottom - offsetMargin;
      const index = getIndex(target);
      const ss = stepStates[index];

      if (bottomAdjusted >= -ZERO_MOE) {
        if (isIntersecting && direction === 'down' && ss.state !== 'enter')
          notifyStepEnter(target, direction);
        else if (!isIntersecting && direction === 'up' && ss.state === 'enter')
          notifyStepExit(target, direction);
        else if (
          !isIntersecting &&
          bottomAdjusted >= height &&
          direction === 'down' &&
          ss.state === 'enter'
        ) {
          notifyStepExit(target, direction);
        }
      }
    });
  }

  function intersectStepBelow(entries) {
    updateDirection();
    entries.forEach(entry => {
      const { isIntersecting, boundingClientRect, target } = entry;

      const { bottom, height } = boundingClientRect;
      const bottomAdjusted = bottom - offsetMargin;
      const index = getIndex(target);
      const ss = stepStates[index];

      if (
        bottomAdjusted >= -ZERO_MOE &&
        bottomAdjusted < height &&
        isIntersecting &&
        direction === 'up' &&
        ss.state !== 'enter'
      ) {
        notifyStepEnter(target, direction);
      } else if (
        bottomAdjusted <= ZERO_MOE &&
        !isIntersecting &&
        direction === 'down' &&
        ss.state === 'enter'
      ) {
        notifyStepExit(target, direction);
      }
    });
  }

  /*
	if there is a scroll event where a step never intersects (therefore
	skipping an enter/exit trigger), use this fallback to detect if it is
	in view
	*/
  function intersectViewportAbove(entries) {
    updateDirection();
    entries.forEach(entry => {
      const { isIntersecting, target } = entry;
      const index = getIndex(target);
      const ss = stepStates[index];
      if (
        isIntersecting &&
        direction === 'down' &&
        ss.state !== 'enter' &&
        ss.direction !== 'down'
      ) {
        notifyStepEnter(target, 'down');
        notifyStepExit(target, 'down');
      }
    });
  }

  function intersectViewportBelow(entries) {
    updateDirection();
    entries.forEach(entry => {
      const { isIntersecting, target } = entry;
      const index = getIndex(target);
      const ss = stepStates[index];
      if (
        isIntersecting &&
        direction === 'up' &&
        ss.state !== 'enter' &&
        ss.direction !== 'up'
      ) {
        notifyStepEnter(target, 'up');
        notifyStepExit(target, 'up');
      }
    });
  }

  function intersectStepProgress(entries) {
    updateDirection();
    entries.forEach(
      ({ isIntersecting, intersectionRatio, boundingClientRect, target }) => {
        const { bottom } = boundingClientRect;
        const bottomAdjusted = bottom - offsetMargin;

        if (isIntersecting && bottomAdjusted >= -ZERO_MOE) {
          notifyStepProgress(target, +intersectionRatio.toFixed(3));
        }
      }
    );
  }

  function intersectTop(entries) {
    updateDirection();
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top, bottom } = boundingClientRect;

    if (bottom > -ZERO_MOE) {
      if (isIntersecting) notifyContainerEnter(direction);
      else if (containerState.state === 'enter') notifyContainerExit(direction);
    }
  }

  function intersectBottom(entries) {
    updateDirection();
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top } = boundingClientRect;

    if (top < ZERO_MOE) {
      if (isIntersecting) notifyContainerEnter(direction);
      else if (containerState.state === 'enter') notifyContainerExit(direction);
    }
  }

  // OBSERVER - CREATION

  function updateTopIO() {
    if (io.top) io.top.unobserve(containerEl);

    const options = {
      root: null,
      rootMargin: `${vh}px 0px -${vh}px 0px`,
      threshold: 0
    };

    io.top = new IntersectionObserver(intersectTop, options);
    io.top.observe(containerEl);
  }

  function updateBottomIO() {
    if (io.bottom) io.bottom.unobserve(containerEl);
    const options = {
      root: null,
      rootMargin: `-${bboxGraphic.height}px 0px ${bboxGraphic.height}px 0px`,
      threshold: 0
    };

    io.bottom = new IntersectionObserver(intersectBottom, options);
    io.bottom.observe(containerEl);
  }

  // top edge
  function updateStepAboveIO() {
    if (io.stepAbove) io.stepAbove.forEach(d => d.disconnect());

    io.stepAbove = stepEl.map((el, i) => {
      const marginTop = stepOffsetHeight[i];
      const marginBottom = -vh + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectStepAbove, options);
      obs.observe(el);
      return obs;
    });
  }

  // bottom edge
  function updateStepBelowIO() {
    if (io.stepBelow) io.stepBelow.forEach(d => d.disconnect());

    io.stepBelow = stepEl.map((el, i) => {
      const marginTop = -offsetMargin;
      const marginBottom = ph - vh + stepOffsetHeight[i] + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectStepBelow, options);
      obs.observe(el);
      return obs;
    });
  }

  // jump into viewport
  function updateViewportAboveIO() {
    if (io.viewportAbove) io.viewportAbove.forEach(d => d.disconnect());
    io.viewportAbove = stepEl.map((el, i) => {
      const marginTop = stepOffsetTop[i];
      const marginBottom = -(vh - offsetMargin + stepOffsetHeight[i]);
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectViewportAbove, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateViewportBelowIO() {
    if (io.viewportBelow) io.viewportBelow.forEach(d => d.disconnect());
    io.viewportBelow = stepEl.map((el, i) => {
      const marginTop = -(offsetMargin + stepOffsetHeight[i]);
      const marginBottom =
        ph - stepOffsetTop[i] - stepOffsetHeight[i] - offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectViewportBelow, options);
      obs.observe(el);
      return obs;
    });
  }

  // progress progress tracker
  function updateStepProgressIO() {
    if (io.stepProgress) io.stepProgress.forEach(d => d.disconnect());

    io.stepProgress = stepEl.map((el, i) => {
      const marginTop = stepOffsetHeight[i] - offsetMargin;
      const marginBottom = -vh + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const threshold = createThreshold(stepOffsetHeight[i]);
      const options = {
        root: null,
        rootMargin,
        threshold
      };

      const obs = new IntersectionObserver(intersectStepProgress, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateIO() {
    updateViewportAboveIO();
    updateViewportBelowIO();
    updateStepAboveIO();
    updateStepBelowIO();

    if (progressMode) updateStepProgressIO();

    if (containerEl && graphicEl) {
      updateTopIO();
      updateBottomIO();
    }
  }

  // SETUP FUNCTIONS

  function indexSteps() {
    stepEl.forEach((el, i) => el.setAttribute('data-scrollama-index', i));
  }

  function setupStates() {
    stepStates = stepEl.map(() => ({
      direction: null,
      state: null
    }));

    containerState = { direction: null, state: null };
  }

  function addDebug() {
    if (debugMode) bug.setup({ id, stepEl, offsetVal });
  }

  const S = {};

  S.setup = ({
    container,
    graphic,
    step,
    offset = 0.5,
    progress = false,
    threshold = 4,
    debug = false,
    order = true,
    once = false
  }) => {
    id = generateId();
    // elements
    stepEl = selectAll(step);
    containerEl = container ? select(container) : null;
    graphicEl = graphic ? select(graphic) : null;

    // error if no step selected
    if (!stepEl.length) {
      console.error('scrollama error: no step elements');
      return S;
    }

    // options
    debugMode = debug;
    progressMode = progress;
    preserveOrder = order;
    triggerOnce = once;

    S.offsetTrigger(offset);
    progressThreshold = Math.max(1, +threshold);

    isReady = true;

    // customize
    addDebug();
    indexSteps();
    setupStates();
    handleResize();
    handleEnable(true);
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
    Object.keys(callback).forEach(c => (callback[c] = null));
    Object.keys(io).forEach(i => (io[i] = null));
  };

  S.offsetTrigger = function(x) {
    if (x && !isNaN(x)) {
      offsetVal = Math.min(Math.max(0, x), 1);
      return S;
    }
    return offsetVal;
  };

  S.onStepEnter = cb => {
    callback.stepEnter = cb;
    return S;
  };

  S.onStepExit = cb => {
    callback.stepExit = cb;
    return S;
  };

  S.onStepProgress = cb => {
    callback.stepProgress = cb;
    return S;
  };

  S.onContainerEnter = cb => {
    callback.containerEnter = cb;
    return S;
  };

  S.onContainerExit = cb => {
    callback.containerExit = cb;
    return S;
  };

  return S;
}

export default scrollama;
