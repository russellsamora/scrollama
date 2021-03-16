export default function parseOffset(x) {
	if (typeof x === "string" && x.indexOf("px") > 0) {
		const v = +x.replace("px", "");
		if (!isNaN(v)) return { format: "pixels", value: v };
		else {
			err("offset value must be in 'px' format. Fallback to 0.5.");
			return { format: "percent", value: 0.5 };
		}
	} else if (typeof x === "number" || !isNaN(+x)) {
		if (x > 1) err("offset value is greater than 1. Fallback to 1.");
		if (x < 0) err("offset value is lower than 0. Fallback to 0.");
		return { format: "percent", value: Math.min(Math.max(0, x), 1) };
	}
	return null;
}