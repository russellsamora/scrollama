let tick = false;
let prev = 0;
let y = 0;
let direction;

function onScroll() {
  y = window.scrollY;
  if (y > prev) direction = "down";
  else if (y < prev) direction = "up";
  prev = y;
}

function setupScroll() {
  document.addEventListener("scroll", onScroll);
}

export { setupScroll, onScroll, direction };
