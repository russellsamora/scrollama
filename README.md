###### scrollama.js

<img src="https://russellgoldenberg.github.io/scrollama/logo.png" width="160" alt="scrollama.js"/>

**Scrollama** is a modern & lightweight JavaScript library for scrollytelling
using
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
in favor of scroll events.

As seen on [The Pudding](https://pudding.cool/):

* [What is a Superteam in the NBA?](https://pudding.cool/2017/10/superteams/)
* [What City is the Microbrew Capital of the US?](https://pudding.cool/2017/04/beer/)
  <!-- * [2017-18 NBA Top Plays](https://russellgoldenberg.github.io/reddit-nba-top-plays) -->

[Jump to examples.](https://github.com/russellgoldenberg/scrollama#examples)

### Why?

Scrollytelling can be complicated to implement and difficult to make performant.
The goal of this library is to provide a simple interface for creating
scroll-driven interactives. Scrollama is focused on perfomance by using
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
to handle element position detection. It offers an opinionated (but popular)
scrollytelling pattern to reduce more involved DOM calculations. The sticky
graphic pattern (enter-stick-exit) can be seen below. Check out my
[blog post](https://pudding.cool/process/introducing-scrollama) for a deeper
introduction.

[![scrollytelling pattern](https://thumbs.gfycat.com/FearfulHotArabianoryx-size_restricted.gif)](https://pudding.cool/process/how-to-implement-scrollytelling)

### Installation

Old school (exposes the `scrollama` global):

```html
<script src='https://unpkg.com/scrollama'></script>
```

New school:

```sh
npm install scrollama
```

And then import/require it:

```js
import scrollama from 'scrollama'; // or...
const scrollama = require('scrollama');
```

### How to use

#### Basic

You can use this library to simply trigger steps, similar to something like
[Waypoints](http://imakewebthings.com/waypoints/). This is useful if you need
more control over your interactive, or you don't want to follow the sticky
scrollytelling pattern.

You can use any id/class naming conventions you want. The HTML structure should
look like:

```html
<!--you don't need the "data-step" attr, but can be useful for storing instructions for JS -->
<div class='step' data-step='a'></div>
<div class='step' data-step='b'></div>
<div class='step' data-step='c'></div>
```

```js
// instantiate the scrollama
const scroller = Scrollama();

// setup the instance, pass callback functions
scroller
  .setup({
    step: '.step', // required
    offset: 0.5, // optional, default = 0.5
    debug: false // optional, default = false
  })
  .onStepEnter(handleStepEnter)
  .onStepExit(handleStepExit);
```

#### Sticky Graphic

To implement the sticky graphic scrollytelling pattern, you need the following
three elements (container, graphic, steps). The structure should look like:

```html
<!-- container = ".scroll" -->
<div class='scroll'>
  <!-- graphic = ".scroll__graphic" -->
  <div class='scroll__graphic'>
    <!--graphic / chart code here-->
  </div>
  <div class='scroll__text'>
    <!-- steps = ".step" -->
    <div class='step' data-step='a'></div>
    <div class='step' data-step='b'></div>
    <div class='step' data-step='c'></div>
  </div>
</div>
```

```js
// instantiate the scrollama
const scroller = Scrollama();

// setup the instance, pass callback functions
scroller
  .setup({
    step: '.scroll__text .step', // required
    container: '.scroll', // required (for sticky)
    graphic: '.scroll__graphic', // required (for sticky)
    offset: 0.5, // optional, default = 0.5
    debug: false // optional, default = false
  })
  .onStepEnter(handleStepEnter)
  .onStepExit(handleStepExit)
  .onContainerEnter(handleContainerEnter)
  .onContainerExit(handleContainerExit);
```

### API

#### scrollama.setup([options])

_options:_

* `step` (string): Selector for the step elements that will trigger changes.
  **required**
* `container` (string): Selector for the element that contains everything for
  the scroller. **optional**
* `graphic` (string): Selector for the graphic element that will become fixed.
  **optional**
* `offset` (number, 0 - 1): How far from the top of the viewport to trigger a
  step. **(default: 0.5)**
* `progress` (boolean): Whether to fire incremental step progress updates or
  not. **(default: false)**
* `debug` (boolean): Whether to show visual debugging tools or not. **(default:
  false)**

#### scrollama.onStepEnter(callback)

Callback that fires when the top or bottom edge of a step element enters the
offset threshold.

The argument of the callback is an object: `{ element: DOMElement, index:
number, direction: string }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`direction`: 'up' or 'down'

#### scrollama.onStepExit(callback)

Callback that fires when the top or bottom edge of a step element exits the
offset threshold.

The argument of the callback is an object: `{ element: DOMElement, index:
number, direction: string }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`direction`: 'up' or 'down'

#### scrollama.onStepProgress(callback)

Callback that fires the progress (0 - 1) a step has made through the threshold.

The argument of the callback is an object: `{ element: DOMElement, index:
number, progress: number }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`progress`: The percent of completion of the step (0 - 1)

#### scrollama.onContainerEnter(callback)

Callback that fires when the top of container becomes flush with viewport _or_
the graphic becomes fully in view coming from the bottom of the container.

The argument of the callback is an object: `{ direction: string }`

`direction`: 'up' or 'down'

#### scrollama.onContainerExit(callback)

Callback that fires when the top of container goes below viewport _or_ the
graphic becomes not full in view leaving the bottom of the container.

The argument of the callback is an object: `{ direction: string }`

`direction`: 'up' or 'down'

#### scrollama.offsetTrigger([number])

Get or set the offset percentage. Value must be between 0-1.

#### scrollama.resize()

Tell scrollama to get latest dimensions the browser/DOM. It is best practice to
throttle resize in your code, update the DOM elements, then call this function
at the end.

#### scrollama.enable()

Tell scrollama to resume observing for trigger changes. Only necessary to call
if you have previously disabled.

#### scrollama.disable()

Tell scrollama to stop observing for trigger changes.

### Examples

_Note: most of these demos use D3 to keep the code concise, but this can be used
with any library, or with no library at all._

* [Basic](https://russellgoldenberg.github.io/scrollama/basic) - just step
  triggers
* [Progress](https://russellgoldenberg.github.io/scrollama/progress) -
  incremental step progress callback
* [Sticky Graphic v1a (CSS, position sticky)](https://russellgoldenberg.github.io/scrollama/sticky-css) -
  using CSS vertically center chart, and position sticky (+ polyfill) for
  sticking.
* [Sticky Graphic v1b (JS, position sticky)](https://russellgoldenberg.github.io/scrollama/sticky-js) -
  using JS vertically center chart, and position sticky (+ polyfill) for
  sticking. Added bonus ability to start chart at top of steps then vertically.
* [Sticky Graphic v2a (CSS, position fixed)](https://russellgoldenberg.github.io/scrollama/fixed-css) -
  using CSS vertically center chart, and position fixed and absolute for
  sticking.
* [Sticky Graphic v2b (JS, position fixed)](https://russellgoldenberg.github.io/scrollama/fixed-js) -
  using read position fixed and absolute for sticking.

### Tips

* Always call `scrollama.resize()` after a window resize event to ensure scroll
  triggers update with new dimensions.
* Avoid using `viewport height` (vh) in your CSS because scrolling up and down
  constantly triggers vh to change, which will also trigger a window resize.

### To do

* Optionally suppress first trigger on page load

### Alternatives

* [Waypoints](http://imakewebthings.com/waypoints/)
* [ScrollMagic](http://scrollmagic.io/)
* [graph-scroll.js](https://1wheel.github.io/graph-scroll/)
* [ScrollStory](https://sjwilliams.github.io/scrollstory/)

### Logo

Logo by the awesome [Elaina Natario](https://twitter.com/elainanatario)

### License

MIT License

Copyright (c) 2017 Russell Goldenberg

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
