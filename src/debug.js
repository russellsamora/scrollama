function getOffsetId(id) {
  return `scrollama__debug-offset--${id}`;
}

// SETUP
function setupOffset({ id, offsetVal, stepClass }) {
  const el = document.createElement("div");
  el.id = getOffsetId(id);
  el.className = "scrollama__debug-offset";
  el.style.position = "fixed";
  el.style.left = "0";
  el.style.width = "100%";
  el.style.height = "0";
  el.style.borderTop = "2px dashed black";
  el.style.zIndex = "9999";

  const p = document.createElement("p");
  p.innerHTML = `".${stepClass}" trigger: <span>${offsetVal}</span>`;
  p.style.fontSize = "12px";
  p.style.fontFamily = "monospace";
  p.style.color = "black";
  p.style.margin = "0";
  p.style.padding = "6px";
  el.appendChild(p);
  document.body.appendChild(el);
}

function setup({ id, offsetVal, stepEl }) {
  const stepClass = stepEl[0].className;
  setupOffset({ id, offsetVal, stepClass });
}

// UPDATE
function update({ id, offsetMargin, offsetVal, format }) {
  const post = format === "pixels" ? "px" : "";
  const idVal = getOffsetId(id);
  const el = document.getElementById(idVal);
  el.style.top = `${offsetMargin}px`;
  el.querySelector("span").innerText = `${offsetVal}${post}`;
}

function notifyStep({ id, index, state }) {
  const prefix = `scrollama__debug-step--${id}-${index}`;
  const elA = document.getElementById(`${prefix}_above`);
  const elB = document.getElementById(`${prefix}_below`);
  const display = state === "enter" ? "block" : "none";

  if (elA) elA.style.display = display;
  if (elB) elB.style.display = display;
}

export { setup, update, notifyStep };
