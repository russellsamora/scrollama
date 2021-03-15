let tick = false;
let prev = 0;
let y = 0;
let direction;

function update() {
  if (y > prev) direction = "down";
  else if (y < prev) direction = "up";
  prev = y;
  tick = false;
}

function setupScroll() {
  const onScroll = () => {
    y = window.scrollY;
    if (!tick) {
      requestAnimationFrame(update);
      tick = true;
    }
  };
  document.addEventListener("scroll", onScroll);
}

export { setupScroll, direction };
