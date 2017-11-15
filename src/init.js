import { select, selectAll } from "./dom";

function scrollama() {
  const id = Math.floor(Math.random() * 100000);
  const ZERO_MOE = 1; // zero with some rounding margin of error
  const margin = {};
  const callback = {};
  const io = {};

  let containerEl = null;
  let graphicEl = null;
  let stepEl = null;

  let offsetVal = 0;
  let offsetMargin = 0;
  let vh = 0;
  let stepHeights = null;
  let bboxGraphic = null;

  let thresholdProgress = 0;

  let isReady = false;
  let isEnabled = false;
  let debugMode = false;
  let progressMode = false;

  // NOTIFY CALLBACKS
  function notifyStepEnter(element, direction) {
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { element, index, direction };
    if (callback.stepEnter && typeof callback.stepEnter === "function")
      callback.stepEnter(resp);
  }

  function notifyStepExit(element, direction) {
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { element, index, direction };
    if (callback.stepExit && typeof callback.stepExit === "function")
      callback.stepExit(resp);
  }

  function notifyStepProgress(element, progress) {
    const index = +element.getAttribute("data-scrollama-index");
    const resp = { element, index, progress };
    if (callback.stepProgress && typeof callback.stepProgress === "function")
      callback.stepProgress(resp);
  }

  function notifyContainerEnter(direction) {
    const resp = { direction };
    if (
      callback.containerEnter &&
      typeof callback.containerEnter === "function"
    )
      callback.containerEnter(resp);
  }

  function notifyContainerExit(direction) {
    const resp = { direction };
    if (callback.containerExit && typeof callback.containerExit === "function")
      callback.containerExit(resp);
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
      if (bottomAdjusted >= -ZERO_MOE) {
        const direction = isIntersecting ? "down" : "up";
        if (isIntersecting) notifyStepEnter(target, direction);
        else notifyStepExit(target, direction);
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
      if (
        bottomAdjusted >= -ZERO_MOE &&
        bottomAdjusted < height &&
        isIntersecting
      ) {
        const direction = "up";
        notifyStepEnter(target, direction);
      } else if (bottomAdjusted <= ZERO_MOE && !isIntersecting) {
        const direction = "down";
        notifyStepExit(target, direction);
      }
    });
  }

  function intersectStepProgress(entries) {
    entries.forEach(entry => {
      const {
        isIntersecting,
        intersectionRatio,
        boundingClientRect,
        target
      } = entry;
      const { bottom } = boundingClientRect;
      const bottomAdjusted = bottom - offsetMargin;

      if (isIntersecting && bottomAdjusted >= -ZERO_MOE) {
        notifyStepProgress(target, +intersectionRatio.toFixed(3));
      }
    });
  }

  function intersectTop(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top, bottom } = boundingClientRect;
    if (bottom > -ZERO_MOE) {
      const direction = isIntersecting ? "down" : "up";
      if (isIntersecting) notifyContainerEnter(direction);
      else notifyContainerExit(direction);
    }
  }

  function intersectBottom(entries) {
    const { isIntersecting, boundingClientRect } = entries[0];
    const { top } = boundingClientRect;
    if (top < ZERO_MOE) {
      const direction = isIntersecting ? "up" : "down";
      if (isIntersecting) notifyContainerEnter(direction);
      else notifyContainerExit(direction);
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

  // bottom edge
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

  // progress progress tracker
  function updateStepProgressIO() {
    if (io.stepProgress) io.stepProgress.forEach(d => d.disconnect());

    io.stepProgress = stepEl.map((el, i) => {
      const marginTop = stepHeights[i] - offsetMargin;
      const marginBottom = -vh + offsetMargin;
      const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

      const options = {
        root: null,
        rootMargin,
        threshold: thresholdProgress
      };

      const obs = new IntersectionObserver(intersectStepProgress, options);
      obs.observe(el);
      return obs;
    });
  }

  function updateIO() {
    updateStepTopIO();
    updateStepBottomIO();

    if (progressMode) updateStepProgressIO();

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

    if (isEnabled && isReady) updateIO();

    if (debugMode) {
      const debugEl = document.querySelector(`#scrollama__debug--offset-${id}`);
      debugEl.style.top = `${offsetMargin}px`;
    }
  }

  function handleEnable(enable) {
    if (enable && !isEnabled) {
      if (isReady) updateIO();
      isEnabled = true;
    } else if (!enable) {
      if (io.top) io.top.disconnect();
      if (io.bottom) io.bottom.disconnect();
      if (io.stepTop) io.stepTop.forEach(d => d.disconnect());
      if (io.stepBottom) io.stepBottom.forEach(d => d.disconnect());
      if (io.stepProgress) io.stepProgress.forEach(d => d.disconnect());
      isEnabled = false;
    }
  }

  function indexSteps() {
    stepEl.forEach((el, i) => el.setAttribute("data-scrollama-index", i));
  }

  function addDebug() {
    if (debugMode) {
      const el = document.createElement("div");
      el.setAttribute("id", `scrollama__debug--offset-${id}`);
      el.setAttribute("class", "scrollama__debug--offset");
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100%";
      el.style.height = "1px";
      el.style.borderBottom = "1px dashed red";
      const text = document.createElement("p");
      const textClass = stepEl[0].getAttribute("class");
      text.innerText = `".${textClass}" trigger: ${offsetVal}`;
      text.style.fontSize = "12px";
      text.style.fontFamily = "monospace";
      text.style.color = "red";
      text.style.margin = "0";
      text.style.padding = "6px";
      el.appendChild(text);
      document.body.appendChild(el);
    }
  }

  function setThreshold() {
    const count = 100;
    if (progressMode) {
      thresholdProgress = [];
      const ratio = 1 / count;
      for (let i = 0; i < count; i++) {
        thresholdProgress.push(i * ratio);
      }
    }
  }

  const S = {};

  S.setup = ({
    container,
    graphic,
    step,
    offset = 0.5,
    progress = false,
    debug = false
  }) => {
    if (step) {
      stepEl = selectAll(step);
      containerEl = container ? select(container) : null;
      graphicEl = graphic ? select(graphic) : null;
      S.offsetTrigger(offset);
      debugMode = debug;
      progressMode = progress;
      isReady = true;

      addDebug();
      indexSteps();
      setThreshold();
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

  S.offsetTrigger = x => {
    if (x && typeof !isNaN(x)) {
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
