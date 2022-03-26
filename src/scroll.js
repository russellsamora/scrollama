let previousScrollY = 0;
let currentScrollY = 0;
let comparisonScrollY = 0;
let direction;

function onScroll(container) {
	const scrollTop = container ? container.scrollTop : window.pageYOffset;

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
