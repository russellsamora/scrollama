
// SETUP
function create(className) {
	const el = document.createElement("div");
	el.className = `scrollama__debug-step ${className}`;
	el.style.position = "fixed";
	el.style.left = "0";
	el.style.width = "100%";
	el.style.zIndex = "9999";
	el.style.borderTop = "2px solid black";
	el.style.borderBottom = "2px solid black";

	const p = document.createElement("p");
	p.style.position = "absolute";
	p.style.left = "0";
	p.style.height = "1px";
	p.style.width = "100%";
	p.style.borderTop = "1px dashed black";

	el.appendChild(p);
	document.body.appendChild(el);
	return el;
}

// UPDATE
function update({ id, step, marginTop }) {
	const { index, height } = step;
	const className = `scrollama__debug-step--${id}-${index}`;
	let el = document.querySelector(`.${className}`);
	if (!el) el = create(className);

	el.style.top = `${marginTop * -1}px`;
	el.style.height = `${height}px`;
	el.querySelector("p").style.top = `${height / 2}px`;
}

export { update };
