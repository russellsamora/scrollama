import { selectAll } from './dom';
import * as bug from './debug';

function scrollama() {
  const OBSERVER_NAMES = [
    'stepAbove',
    'stepBelow',
    'stepProgress',
    'viewportAbove',
    'viewportBelow'
  ];

  const cb = {
    stepEnter: () => {},
    stepExit: () => {},
    stepProgress: () => {}
  };
  const io = {};

  let id = null;
  let stepEl = [];
  let stepOffsetHeight = [];
  let stepOffsetTop = [];
  let stepStates = [];

  let offsetVal = 0;
  let offsetMargin = 0;
  let viewH = 0;
  let pageH = 0;
  let previousYOffset = 0;
  let progressThreshold = 0;

  let isReady = false;
  let isEnabled = false;
  let isDebug = false;

  let progressMode = false;
  let preserveOrder = false;
  let triggerOnce = false;

  let direction = 'down';

  const exclude = [];

  /*** HELPERS ***/
  function generateInstanceID() {
    const a = 'abcdefghijklmnopqrstuv';
    const l = a.length;
    const t = Date.now();
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

  function disconnectObserver(name) {
    if (io[name]) io[name].forEach(d => d.disconnect());
  }

  function handleResize() {
    viewH = window.innerHeight;
    pageH = getPageHeight();

    offsetMargin = offsetVal * viewH;

    if (isReady) {
      stepOffsetHeight = stepEl.map(el => el.offsetHeight);
      stepOffsetTop = stepEl.map(getOffsetTop);
      if (isEnabled) updateIO();
    }

    if (isDebug) bug.update({ id, stepOffsetHeight, offsetMargin, offsetVal });
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      if (isReady) updateIO();
      isEnabled = true;
      return true;
    }
    OBSERVER_NAMES.forEach(disconnectObserver);
    isEnabled = false;
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

  /*** NOTIFY CALLBACKS ***/

  function notifyStepProgress(element, progress) {
    const index = getIndex(element);
    if (progress !== undefined) stepStates[index].progress = progress;
    const resp = { element, index, progress: stepStates[index].progress };

    if (stepStates[index].state === 'enter') cb.stepProgress(resp);
  }

  function notifyOthers(index, location) {
    if (location === 'above') {
      // check if steps above/below were skipped and should be notified first
      for (let i = 0; i < index; i++) {
        const ss = stepStates[i];
        if (ss.state !== 'enter' && ss.direction !== 'down') {
          notifyStepEnter(stepEl[i], 'down', false);
          notifyStepExit(stepEl[i], 'down');
        } else if (ss.state === 'enter') notifyStepExit(stepEl[i], 'down');
        // else if (ss.direction === 'up') {
        //   notifyStepEnter(stepEl[i], 'down', false);
        //   notifyStepExit(stepEl[i], 'down');
        // }
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

    if (cb.stepEnter && !exclude[index]) {
      cb.stepEnter(resp, stepStates);
      if (isDebug) bug.notifyStep({ id, index, state: 'enter' });
      if (triggerOnce) exclude[index] = true;
    }

    if (progressMode) notifyStepProgress(element);
  }

  function notifyStepExit(element, direction) {
    const index = getIndex(element);
    const resp = { element, index, direction };

    if (progressMode) {
      if (direction === 'down' && stepStates[index].progress < 1)
        notifyStepProgress(element, 1);
      else if (direction === 'up' && stepStates[index].progress > 0)
        notifyStepProgress(element, 0);
    }

    // store most recent trigger
    stepStates[index].direction = direction;
    stepStates[index].state = 'exit';

    cb.stepExit(resp, stepStates);
    if (isDebug) bug.notifyStep({ id, index, state: 'exit' });
  }

  /*** OBSERVER - INTERSECT HANDLING ***/
  // this is good for entering while scrolling down + leaving while scrolling up
  function intersectStepAbove([entry]) {
    updateDirection();
    const { isIntersecting, boundingClientRect, target } = entry;

    // bottom = bottom edge of element from top of viewport
    // bottomAdjusted = bottom edge of element from trigger
    const { top, bottom } = boundingClientRect;
    const topAdjusted = top - offsetMargin;
    const bottomAdjusted = bottom - offsetMargin;
    const index = getIndex(target);
    const ss = stepStates[index];

    // entering above is only when topAdjusted is negative
    // and bottomAdjusted is positive
    if (
      isIntersecting &&
      topAdjusted <= 0 &&
      bottomAdjusted >= 0 &&
      direction === 'down' &&
      ss.state !== 'enter'
    )
      notifyStepEnter(target, direction);

    // exiting from above is when topAdjusted is positive and not intersecting
    if (
      !isIntersecting &&
      topAdjusted > 0 &&
      direction === 'up' &&
      ss.state === 'enter'
    )
      notifyStepExit(target, direction);
  }

  // this is good for entering while scrolling up + leaving while scrolling down
  function intersectStepBelow([entry]) {
    updateDirection();
    const { isIntersecting, boundingClientRect, target } = entry;

    // bottom = bottom edge of element from top of viewport
    // bottomAdjusted = bottom edge of element from trigger
    const { top, bottom } = boundingClientRect;
    const topAdjusted = top - offsetMargin;
    const bottomAdjusted = bottom - offsetMargin;
    const index = getIndex(target);
    const ss = stepStates[index];

    // entering below is only when bottomAdjusted is positive
    // and topAdjusted is positive
    if (
      isIntersecting &&
      topAdjusted <= 0 &&
      bottomAdjusted >= 0 &&
      direction === 'up' &&
      ss.state !== 'enter'
    )
      notifyStepEnter(target, direction);

    // exiting from above is when bottomAdjusted is negative and not intersecting
    if (
      !isIntersecting &&
      bottomAdjusted < 0 &&
      direction === 'down' &&
      ss.state === 'enter'
    )
      notifyStepExit(target, direction);
  }

  /*
	if there is a scroll event where a step never intersects (therefore
	skipping an enter/exit trigger), use this fallback to detect if it is
	in view
	*/
  function intersectViewportAbove([entry]) {
    updateDirection();
    const { isIntersecting, target } = entry;
    const index = getIndex(target);
    const ss = stepStates[index];

    if (
      isIntersecting &&
      direction === 'down' &&
      ss.direction !== 'down' &&
      ss.state !== 'enter'
    ) {
      notifyStepEnter(target, 'down');
      notifyStepExit(target, 'down');
    }
  }

  function intersectViewportBelow([entry]) {
    updateDirection();
    const { isIntersecting, target } = entry;
    const index = getIndex(target);
    const ss = stepStates[index];
    if (
      isIntersecting &&
      direction === 'up' &&
      ss.direction === 'down' &&
      ss.state !== 'enter'
    ) {
      notifyStepEnter(target, 'up');
      notifyStepExit(target, 'up');
    }
  }

  function intersectStepProgress([entry]) {
    updateDirection();
    const {
      isIntersecting,
      intersectionRatio,
      boundingClientRect,
      target
    } = entry;
    const { bottom } = boundingClientRect;
    const bottomAdjusted = bottom - offsetMargin;
    if (isIntersecting && bottomAdjusted >= 0) {
      notifyStepProgress(target, +intersectionRatio.toFixed(3));
    }
  }

  /***  OBSERVER - CREATION ***/
  // jump into viewport
  function updateViewportAboveIO() {
    io.viewportAbove = stepEl.map((el, i) => {
      const marginTop = pageH - stepOffsetTop[i];
      const marginBottom = offsetMargin - viewH - stepOffsetHeight[i];
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = { rootMargin };
      // console.log(options);
      const obs = new IntersectionObserver(intersectViewportAbove, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateViewportBelowIO() {
    io.viewportBelow = stepEl.map((el, i) => {
      const marginTop = -offsetMargin - stepOffsetHeight[i];
      const marginBottom = offsetMargin - viewH + stepOffsetHeight[i] + pageH;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = { rootMargin };
      // console.log(options);
      const obs = new IntersectionObserver(intersectViewportBelow, options);
      obs.observe(el);
      return obs;
    });
  }

  // look above for intersection
  function updateStepAboveIO() {
    io.stepAbove = stepEl.map((el, i) => {
      const marginTop = -offsetMargin + stepOffsetHeight[i];
      const marginBottom = offsetMargin - viewH;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = { rootMargin };
      // console.log(options);
      const obs = new IntersectionObserver(intersectStepAbove, options);
      obs.observe(el);
      return obs;
    });
  }

  // look below for intersection
  function updateStepBelowIO() {
    io.stepAbove = stepEl.map((el, i) => {
      const marginTop = -offsetMargin;
      const marginBottom = offsetMargin - viewH + stepOffsetHeight[i];
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const options = { rootMargin };
      // console.log(options);
      const obs = new IntersectionObserver(intersectStepBelow, options);
      obs.observe(el);
      return obs;
    });
  }

  // progress progress tracker
  function updateStepProgressIO() {
    io.stepProgress = stepEl.map((el, i) => {
      const marginTop = stepOffsetHeight[i] - offsetMargin;
      const marginBottom = -viewH + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
      const threshold = createThreshold(stepOffsetHeight[i]);
      const options = { rootMargin, threshold };
      // console.log(options);
      const obs = new IntersectionObserver(intersectStepProgress, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateIO() {
    OBSERVER_NAMES.forEach(disconnectObserver);

    updateViewportAboveIO();
    updateViewportBelowIO();
    updateStepAboveIO();
    updateStepBelowIO();

    if (progressMode) updateStepProgressIO();
  }

  /*** SETUP FUNCTIONS ***/

  function indexSteps() {
    stepEl.forEach((el, i) => el.setAttribute('data-scrollama-index', i));
  }

  function setupStates() {
    stepStates = stepEl.map(() => ({
      direction: null,
      state: null,
      progress: 0
    }));
  }

  function addDebug() {
    if (isDebug) bug.setup({ id, stepEl, offsetVal });
  }

  const S = {};

  S.setup = ({
    step,
    offset = 0.5,
    progress = false,
    threshold = 4,
    debug = false,
    order = true,
    once = false
  }) => {
    // create id unique to this scrollama instance
    id = generateInstanceID();

    stepEl = selectAll(step);

    if (!stepEl.length) {
      console.error('scrollama error: no step elements');
      return S;
    }

    // options
    isDebug = debug;
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
    Object.keys(cb).forEach(c => (cb[c] = null));
    Object.keys(io).forEach(i => (io[i] = null));
  };

  S.offsetTrigger = x => {
    if (x && !isNaN(x)) {
      if (x > 1) console.error('scrollama error: offset value is greater than 1. Fallbacks to 1.');
      if (x < 0) console.error('scrollama error: offset value is lower than 0. Fallbacks to 0.');
      offsetVal = Math.min(Math.max(0, x), 1);
      return S;
    } else if (isNaN(x)) {
      console.error('scrollama error: offset value is not a number. Fallbacks to 0.');
    }
    return offsetVal;
  };

  S.onStepEnter = f => {
    if (typeof f === 'function') cb.stepEnter = f;
    else console.error('scrollama error: onStepEnter requires a function');
    return S;
  };

  S.onStepExit = f => {
    if (typeof f === 'function') cb.stepExit = f;
    else console.error('scrollama error: onStepExit requires a function');
    return S;
  };

  S.onStepProgress = f => {
    if (typeof f === 'function') cb.stepProgress = f;
    else console.error('scrollama error: onStepProgress requires a function');
    return S;
  };

  return S;
}

export default scrollama;
