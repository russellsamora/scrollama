function getStepId({ id, i }) {
  return `scrollama__debug-step--${id}-${i}`;
}

function getOffsetId({ id }) {
  return `scrollama__debug-offset--${id}`;
}

// SETUP
function setupStep({ id, i }) {
  const idVal = getStepId({ id, i });

  const elA = document.createElement('div');
  elA.setAttribute('id', `${idVal}_above`);
  elA.setAttribute('class', 'scrollama__debug-step');
  elA.style.position = 'fixed';
  elA.style.left = '0';
  elA.style.width = '100%';
  // elA.style.backgroundColor = 'green';
  elA.style.backgroundImage =
    'repeating-linear-gradient(45deg, green 0, green 2px, white 0, white 40px)';
  elA.style.border = '2px solid green';
  elA.style.opacity = '0.33';
  elA.style.zIndex = '9999';
  elA.style.display = 'none';

  document.body.appendChild(elA);

  const elB = document.createElement('div');
  elB.setAttribute('id', `${idVal}_below`);
  elB.setAttribute('class', 'scrollama__debug-step');
  elB.style.position = 'fixed';
  elB.style.left = '0';
  elB.style.width = '100%';
  // elB.style.backgroundColor = 'orange';
  elB.style.backgroundImage =
    'repeating-linear-gradient(135deg, orange 0, orange 2px, white 0, white 40px)';
  elB.style.border = '2px solid orange';
  elB.style.opacity = '0.33';
  elB.style.zIndex = '9999';
  elB.style.display = 'none';
  document.body.appendChild(elB);
}

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
  stepEl.forEach((s, i) => setupStep({ id, i }));
  setupOffset({ id, offsetVal, stepClass });
}

// UPDATE
function updateOffset({ id, offsetMargin, offsetVal }) {
  const idVal = getOffsetId({ id });
  const el = document.querySelector(`#${idVal}`);
  el.style.top = `${offsetMargin}px`;
}

function updateStep({ id, h, i, offsetMargin }) {
  const idVal = getStepId({ id, i });
  const elA = document.querySelector(`#${idVal}_above`);
  elA.style.height = `${h}px`;
  elA.style.top = `${offsetMargin - h}px`;

  const elB = document.querySelector(`#${idVal}_below`);
  elB.style.height = `${h}px`;
  elB.style.top = `${offsetMargin}px`;
}

function update({ id, stepOffsetHeight, offsetMargin, offsetVal }) {
  stepOffsetHeight.forEach((h, i) => updateStep({ id, h, i, offsetMargin }));
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
