let tick = false;
let previousScrollY = 0;
let currentScrollY = 0;
let comparisonScrollY = 0;
let direction;

function onScroll() {
  if (currentScrollY === window.pageYOffset) return;
  previousScrollY = currentScrollY;
  currentScrollY = window.pageYOffset;
  if (currentScrollY > comparisonScrollY) direction = "down";
  else if (currentScrollY < comparisonScrollY) direction = "up";
  comparisonScrollY = currentScrollY;
}

function setupScroll() {
  document.addEventListener("scroll", onScroll);
}

export { setupScroll, onScroll, direction, previousScrollY, currentScrollY };
