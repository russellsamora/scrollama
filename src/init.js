import { select, selectAll } from "./dom";

function scrollama() {
  let ready = false;
  let containerEl = null;
  let graphicEl = null;
  let stepEl = null;

  let currentStepIndex = -1;
  let offsetVal = 0;
  let offsetMargin = 0;
  let vh = 0;

  let stepHeights = null;
  let direction = null;
  let bboxGraphic = null;
  let isEnabled = false;
  let debugMode = false;

  const margin = {};
  const callback = {};
  const io = {};

  // NOTIFY CALLBACKS
  function notifyStepEnter(element) {
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { direction, element, index };
    if (callback.stepEnter && typeof callback.stepEnter === "function")
      callback.stepEnter(resp);
  }

  function notifyStepExit(element) {
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { direction, element, index };
    if (callback.stepExit && typeof callback.stepExit === "function")
      callback.stepExit(resp);
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

  // if TOP edge of step crosses threshold,
  // bottom must be > 0 which means it is on "screen" (shifted by offset)
  function intersectStepTop(entries) {
    entries.forEach(entry => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect,
        target
      } = entry;
      const { bottom } = boundingClientRect;
      const bottomAdjusted = bottom - offsetMargin;

      if (bottomAdjusted >= 0) {
        direction = isIntersecting ? "down" : "up";
        if (isIntersecting) notifyStepEnter(target);
        else notifyStepExit(target);
      }
    });
  }

  function intersectStepBottom(entries) {
    entries.forEach(entry => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect,
        target
      } = entry;
      const { bottom, height } = boundingClientRect;
      const bottomAdjusted = bottom - offsetMargin;

      if (bottomAdjusted >= 0 && bottomAdjusted < height && isIntersecting) {
        direction = "up";
        notifyStepEnter(target);
      } else if (bottomAdjusted <= 0 && !isIntersecting) {
        direction = "down";
        notifyStepExit(target);
      }
    });
  }

  function intersectTop(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top, bottom } = boundingClientRect;
    if (bottom > 0) {
      direction = isIntersecting ? "down" : "up";
      if (isIntersecting) notifyEnter();
      else notifyExit();
    }
  }

  function intersectBottom(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top } = boundingClientRect;
    if (top < 0) {
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

  // scrolling down
  function updateStepTopIO() {
    if (io.stepTop) io.stepTop.forEach(d => d.disconnect());

    io.stepTop = stepEl.map((el, i) => {
      const marginTop = stepHeights[i] - offsetMargin;
      const marginBottom = -vh + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectStepTop, options);
      obs.observe(el);
      return obs;
    });
  }

  // scrolling up
  function updateStepBottomIO() {
    if (io.stepBottom) io.stepBottom.forEach(d => d.disconnect());

    io.stepBottom = stepEl.map((el, i) => {
      const marginTop = -offsetMargin;
      const marginBottom = -vh + stepHeights[i] + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const options = {
        root: null,
        rootMargin,
        threshold: 0
      };

      const obs = new IntersectionObserver(intersectStepBottom, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateIO() {
    updateStepTopIO();
    updateStepBottomIO();
    if (containerEl && graphicEl) {
      updateTopIO();
      updateBottomIO();
    }
  }

  // HELPER FUNCTIONS
  function handleResize() {
    vh = window.innerHeight;
    bboxGraphic = graphicEl ? graphicEl.getBoundingClientRect() : null;

    offsetMargin = offsetVal * vh;

    stepHeights = stepEl
      ? stepEl.map(el => el.getBoundingClientRect().height)
      : [];

    if (isEnabled && ready) updateIO();

    if (debugMode) {
      const debugEl = document.querySelector(".scrollama__offset");
      debugEl.style.top = `${offsetMargin}px`;
    }
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      if (ready) updateIO();
      isEnabled = true;
    } else if (!enable) {
      Object.keys(io).map(k => {
        if (io[k]) io[k].disconnect();
      });
      isEnabled = false;
    }
  }

  function indexSteps() {
    stepEl.forEach((el, i) => el.setAttribute("data-scrollama-index", i));
  }

  function addDebug() {
    if (debugMode) {
      const el = document.createElement("div");
      el.setAttribute("class", "scrollama__offset");
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100%";
      el.style.height = "1px";
      el.style.backgroundColor = "red";
      const text = document.createElement("p");
      text.innerText = `scrollama trigger: ${offsetVal}`;
      text.style.fontSize = "12px";
      text.style.fontFamily = "monospace";
      text.style.color = "red";
      text.style.margin = "0";
      text.style.padding = "6px";
      el.appendChild(text);
      document.body.appendChild(el);
    }
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
    if (step) {
      stepEl = selectAll(step);
      containerEl = container ? select(container) : null;
      graphicEl = graphic ? select(graphic) : null;
      offsetVal = offset;
      debugMode = debug;
      ready = true;

      // createThreshold();
      addDebug();
      indexSteps();
      handleResize();
      handleEnable(true);
    } else console.error("scrollama error: missing step element");
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

  S.onStepEnter = cb => {
    callback.stepEnter = cb;
    return S;
  };

  S.onStepExit = cb => {
    callback.stepExit = cb;
    return S;
  };

  S.onIncrement = cb => {
    callback.increment = cb;
    return S;
  };

  S.onContainerEnter = cb => {
    callback.enter = cb;
    return S;
  };

  S.onContainerExit = cb => {
    callback.exit = cb;
    return S;
  };

  return S;
}

export default scrollama;
