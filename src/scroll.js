import { getContainerElement } from './globals';

let tick = false;
let previousScrollY = 0;
let currentScrollY = 0;
let comparisonScrollY = 0;
let direction;

function onScroll() {
  let containerElement = getContainerElement()
  let scrollTop = containerElement.scrollTop ? containerElement.scrollTop : window.pageYOffset

  if (currentScrollY === scrollTop) return;
  previousScrollY = currentScrollY;
  currentScrollY = scrollTop;
  if (currentScrollY > comparisonScrollY) direction = "down";
  else if (currentScrollY < comparisonScrollY) direction = "up";
  comparisonScrollY = currentScrollY;
}

function setupScroll() {
  document.addEventListener("scroll", onScroll);
}

export { setupScroll, onScroll, direction, previousScrollY, currentScrollY };
