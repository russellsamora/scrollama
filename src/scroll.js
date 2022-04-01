let previousScrollY;
let currentScrollY;
let comparisonScrollY;
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

function setupScroll(container) {
	previousScrollY = 0;
	currentScrollY = 0;
	comparisonScrollY = 0;
	document.addEventListener("scroll", () => onScroll(container));
}

export { setupScroll, onScroll, direction, previousScrollY, currentScrollY };
