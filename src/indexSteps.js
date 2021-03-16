export default function indexSteps(steps) {
	steps.forEach((step) =>
		step.node.setAttribute("data-scrollama-index", step.index)
	);
}