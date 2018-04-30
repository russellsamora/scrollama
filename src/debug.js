function getStepId({ id, i }) {
  return `scrollama__debug-step--${id}-${i}`;
}

function getOffsetId({ id }) {
  return `scrollama__debug-offset--${id}`;
}

// SETUP

function setupOffset({ id, offsetVal, stepClass }) {
  const el = document.createElement('div');
  el.setAttribute('id', getOffsetId({ id }));
  el.setAttribute('class', 'scrollama__debug-offset');

  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.height = '0px';
  el.style.borderTop = '2px dashed black';
  el.style.zIndex = '9999';

  const text = document.createElement('p');
  text.innerText = `".${stepClass}" trigger: ${offsetVal}`;
  text.style.fontSize = '12px';
  text.style.fontFamily = 'monospace';
  text.style.color = 'black';
  text.style.margin = '0';
  text.style.padding = '6px';
  el.appendChild(text);
  document.body.appendChild(el);
}

function setup({ id, offsetVal, stepEl }) {
  const stepClass = stepEl[0].getAttribute('class');
  setupOffset({ id, offsetVal, stepClass });
}

// UPDATE
function updateOffset({ id, offsetMargin, offsetVal }) {
  const idVal = getOffsetId({ id });
  const el = document.querySelector(`#${idVal}`);
  el.style.top = `${offsetMargin}px`;
}

function update({ id, stepOffsetHeight, offsetMargin, offsetVal }) {
  updateOffset({ id, offsetMargin });
}

function notifyStep({ id, index, state }) {
  const idVal = getStepId({ id, i: index });
  const elA = document.querySelector(`#${idVal}_above`);
  const elB = document.querySelector(`#${idVal}_below`);
  const display = state === 'enter' ? 'block' : 'none';

  if (elA) elA.style.display = display;
  if (elB) elB.style.display = display;
}

export { setup, update, notifyStep };
