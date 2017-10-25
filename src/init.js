import { select, selectAll } from "./dom";

function scrollama() {
  let containerEl = null;
  let graphicEl = null;
  let stepEl = null;

  let currentStepIndex = -1;
  let offsetVal = 0;
  let offsetMargin = 0;
  let vh = 0;
  // let threshold = [0];

  let direction = null;
  let bboxGraphic = null;
  let isEnabled = false;
  let debugMode = false;

  const margin = {};
  const callback = {};
  const io = {};

  // NOTIFY CALLBACKS
  function notifyStep(element) {
    // console.log('notify step');
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { direction, element, index };
    if (callback.step && typeof callback.step === "function")
      callback.step(resp);
  }

  function notifyIncrement() {
    // TODO
  }

  function notifyEnter() {
    const resp = { direction };
    if (callback.enter && typeof callback.enter === "function")
      callback.enter(resp);
  }

  function notifyExit() {
    const resp = { direction };
    if (callback.exit && typeof callback.exit === "function")
      callback.exit(resp);
  }

  // OBSERVER - INTERSECT HANDLING
  function intersectStepDown(entries) {
    entries.forEach(entry => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect,
        target
      } = entry;
      if (isIntersecting && boundingClientRect.bottom >= 0) {
        direction = "down";
        notifyStep(target);
      }
    });
  }

  function intersectStepUp(entries) {
    entries.forEach(entry => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect,
        target
      } = entry;

      if (isIntersecting && boundingClientRect.top < 0) {
        direction = "up";
        notifyStep(target);
      }
    });
  }

  function intersectTop(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top, bottom } = boundingClientRect;
    if (isIntersecting && top <= 0 && bottom > vh) {
      direction = "down";
      notifyEnter();
    } else if (!isIntersecting && top >= 0) {
      direction = "up";
      notifyExit();
    }
  }

  function intersectBottom(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { bottom } = boundingClientRect;
    if (bottom < vh + bboxGraphic.height) {
      direction = isIntersecting ? "up" : "down";
      if (isIntersecting) notifyEnter();
      else notifyExit();
    }
  }

  // OBSERVER - CREATION
  function updateTopIO() {
    if (io.top) io.top.unobserve(containerEl);

    const options = {
      root: null,
      rootMargin: `0px 0px -${vh}px 0px`,
      threshold: 0
    };

    io.top = new IntersectionObserver(intersectTop, options);
    io.top.observe(containerEl);
  }

  function updateBottomIO() {
    if (io.bottom) io.bottom.unobserve(containerEl);
    const options = {
      root: null,
      rootMargin: `-${bboxGraphic.height}px 0px 0px 0px`,
      threshold: 0
    };

    io.bottom = new IntersectionObserver(intersectBottom, options);
    io.bottom.observe(containerEl);
  }

  // scrolling down
  function updateStepDownIO() {
    if (io.step) io.stepDown.disconnect();

    const options = {
      root: null,
      rootMargin: `${margin.top}px 0px ${margin.bottom}px 0px`,
      threshold: 0
    };

    io.stepDown = new IntersectionObserver(intersectStepDown, options);
    stepEl.forEach(el => io.stepDown.observe(el));
  }

  // scrolling up
  function updateStepUpIO() {
    if (io.step) io.stepUp.disconnect();

    const options = {
      root: null,
      rootMargin: `-${offsetMargin}px 0px ${offsetMargin}px 0px`,
      threshold: 0
    };

    io.stepUp = new IntersectionObserver(intersectStepUp, options);
    stepEl.forEach(el => io.stepUp.observe(el));
  }

  function updateIO() {
    updateTopIO();
    updateBottomIO();
    updateStepDownIO();
    updateStepUpIO();
  }

  // HELPER FUNCTIONS
  function handleResize() {
    vh = window.innerHeight;
    bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;

    if (stepEl) {
      const stepHeight = stepEl[0].getBoundingClientRect().height;
      offsetMargin = offsetVal * vh;
      margin.top = stepHeight - offsetMargin;
      margin.bottom = -vh + offsetMargin;
    }

    if (isEnabled) updateIO();

    if (debugMode) {
      const debugEl = document.querySelector(".scrollama__offset");
      debugEl.style.top = `${offsetMargin}px`;
    }
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      updateIO();
      isEnabled = true;
    } else if (!enable) {
      Object.keys(observer).map(k => observer[k].disconnect());
      isEnabled = false;
    }
  }

  function indexSteps() {
    stepEl.forEach((el, i) => el.setAttribute("data-scrollama-index", i));
  }

  function addDebug() {
    const el = document.createElement("div");
    el.setAttribute("class", "scrollama__offset");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "1px";
    el.style.backgroundColor = "lime";
    document.body.appendChild(el);
  }

  // function createThreshold(count = 100) {
  //   threshold = [];
  //   const ratio = 1 / count;
  //   for (let i = 0; i < count; i++) {
  //     threshold.push(i * ratio);
  //   }
  // }

  const S = {};

  S.setup = ({
    container,
    graphic,
    step,
    offset = 0.5,
    increment = false,
    debug = false
  }) => {
    if (container && graphic && step) {
      containerEl = select(container);
      graphicEl = select(graphic);
      stepEl = selectAll(step);
      offsetVal = offset;
      debugMode = debug;

      if (debugMode) addDebug();
      // createThreshold();
      indexSteps();
      handleResize();
      handleEnable(true);
    } else console.log("improper scrollama setup config");
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
    return S;
  };

  S.onIncrement = cb => {
    callback.increment = cb;
    return S;
  };

  S.onEnter = cb => {
    callback.enter = cb;
    return S;
  };

  S.onExit = cb => {
    callback.exit = cb;
    return S;
  };

  return S;
}

export default scrollama;
