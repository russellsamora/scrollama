# scrollama.js

Lightweight (< 2kb gzipped) scrollytelling library using IntersectionObserver.

As seen on The Pudding.

### Why?

Scrollytelling can be complicated and bad for performance. The goal of this library is to provide a simple interface for creating scroll-driven interactives, while using modern approaches (IntersectionObserver) to handle scroll events.

### Installation

In a browser (exposes the `scrollama` global):

```html
<script src='scrollama@0.1.0.js'></script>
```

With NPM:

```sh
npm install scrollama
```

And then import/require it:

```js
const scrollama = require('scrollama'); // Node classic
import scrollama from 'scrollama' // ES6
```

### How to use

You can use any id/class naming conventions you want, but you need three elements: 

* container
* graphic
* steps

The structure should look like:
```html
<!--container-->
<div class='scroll'>
  <div class='scroll__graphic'><!--graphic / chart here--></div>
  <div class='scroll__text'>
    <div class='step' data-step='a'></div>
    <div class='step' data-step='b'></div>
    <div class='step' data-step='c'></div>
  </div>
</div>
```

```js
// instantiate the scrollama
const scroller = Scrollama()

scroller.setup({
  container: '.scroll',
  graphic: '.scroll__graphic',
  step: '.scroll__text .step',
})
.onEnter(handleEnter)
.onExit(handleExit)
.onStep(handleStep)
```

### API

#### scrollama.setup([options])

*options:*
* `container` (string): Selector for the element that contains everything for the scroller. **required**
* `graphic` (string): Selector for the graphic element that will become fixed. **required**
* `step` (string): Selector for the step elements that will trigger changes. **required**
* `offset` (number, 0 - 1): How far from the top of the viewport to trigger a step. **(default: 0.5)**
* `debug` (boolean): Whether to show visual debugging tools or not. **(default: false)**

#### scrollama.onEnter(callback)

Callback that fires when the top of container becomes flush with viewport *or* the graphic becomes fully in view coming from the bottom of the container.

The argument of the callback is an object:
`{ direction: string }`

`direction`: 'up' or 'down'

#### scrollama.onExit(callback)

Callback that fires when the top of container goes below viewport *or* the graphic becomes not full in view leaving the bottom of the container.

The argument of the callback is an object:
`{ direction: string }`

`direction`: 'up' or 'down'

#### scrollama.onStep(callback)

Callback that fires when the top or bottom edge of a step element passes the offset threshold.

The argument of the callback is an object:
`{ direction: string, element: DOMElement, index: number }`

`direction`: 'up' or 'down'

`element`: The step element that triggered

`index`: The index of the step of all steps

### Examples

*Note: most of these demos use D3 to keep the code concise, but this can be used with any library, or with no library at all.*

[Tk](https://russellgoldenberg.github.io/scrollama/demos/tk.html)

### To do

* Incremental progress listener

### Alternatives

[Tk](https://tk) - utility for morphing between two SVGs in React

### License

MIT License

Copyright (c) 2017 Russell Goldenberg

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.