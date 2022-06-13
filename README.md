<img src="https://russellgoldenberg.github.io/scrollama/logo.png" width="160" alt="scrollama.js"/>

**Scrollama** is a modern & lightweight JavaScript library for scrollytelling
using
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
in favor of scroll events. *Current version: 3.1.1*

## 3.0
#### Why 3.0?
The core parts of the Scrollama code base are being refactored for 3.0 to simplfy and clarify the logic. The goal behind this to ease make future maintainance, bug fixing, and feature additions easier moving forward.

#### New Fetaures
* Built-in resize using resize observers.
* Custom offsets on steps with data attributes

#### Deprecated Features
* the `order` option

## Important Changes
- **Version 3.0.0+**: `order` has been deprecated.
- **Version 2.0.0+**: `.onContainerEnter` and `.onContainerExit` have been deprecated in favor of CSS property `position: sticky;`. [How to use position sticky.](https://pudding.cool/process/scrollytelling-sticky/)
- **Version 1.4.0+**: you must manually add the IntersectionObserver polyfill for cross-browser support. See [installation](https://github.com/russellgoldenberg/scrollama#installation) for details.

[Jump to examples.](https://github.com/russellgoldenberg/scrollama#examples)

## Why?

Scrollytelling can be complicated to implement and difficult to make performant.
The goal of this library is to provide a simple interface for creating
scroll-driven interactives. Scrollama is focused on performance by using
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
to handle element position detection.

[![scrollytelling pattern](https://thumbs.gfycat.com/FearfulHotArabianoryx-size_restricted.gif)](https://pudding.cool/process/how-to-implement-scrollytelling)

## Examples

_Note: most of these examples use D3 to keep the code concise, but this can be used
with any library, or with no library at all._

- [Basic](https://russellgoldenberg.github.io/scrollama/basic) - just step
  triggers
- [Progress](https://russellgoldenberg.github.io/scrollama/progress) -
  incremental step progress callback
- [Sticky Graphic (Side by Side)](https://russellgoldenberg.github.io/scrollama/sticky-side) -
  using CSS `position: sticky;` to create a fixed graphic to the side of the text.
- [Sticky Graphic (Overlay)](https://russellgoldenberg.github.io/scrollama/sticky-overlay) -
  using CSS `position: sticky;` to create a fixed graphic with fullscreen graphic with text overlayed.
- [Custom Offset](https://russellgoldenberg.github.io/scrollama/custom-offset) -
  Adding a data attribute to an element to provide a unique offset for a step.
- [Mobile Pattern](https://russellgoldenberg.github.io/scrollama/mobile-pattern) -
  using pixels instead of percent for offset value so it doesn't jump around on scroll direction change
- [iframe Embed](https://russellgoldenberg.github.io/scrollama/iframe) -
  Embedding a Scrollama instance inside an iframe using `root` option

## Installation
**Note: As of version 1.4.0, the IntersectionObserver polyfill has been removed from the build. You must include it yourself for cross-browser support.** Check [here](https://caniuse.com/#feat=intersectionobserver) to see if you need to include the polyfill.

Old school (exposes the `scrollama` global):

```html
<script src="https://unpkg.com/scrollama"></script>
```

New school:

```sh
npm install scrollama intersection-observer --save
```

And then import/require it:

```js
import scrollama from "scrollama"; // or...
const scrollama = require("scrollama");
```

## How to use

#### Basic

You can use this library to simply trigger steps, similar to something like
[Waypoints](http://imakewebthings.com/waypoints/). This is useful if you need
more control over your interactive, or you don't want to follow the sticky
scrollytelling pattern.

You can use any id/class naming conventions you want. The HTML structure should
look like:

```html
<!--you don't need the "data-step" attr, but can be useful for storing instructions for JS -->
<div class="step" data-step="a"></div>
<div class="step" data-step="b"></div>
<div class="step" data-step="c"></div>
```

```js
// instantiate the scrollama
const scroller = scrollama();

// setup the instance, pass callback functions
scroller
  .setup({
    step: ".step",
  })
  .onStepEnter((response) => {
    // { element, index, direction }
  })
  .onStepExit((response) => {
    // { element, index, direction }
  });
```

## API

#### scrollama.setup([options])

_options:_

| Option  | Type | Description | Default |
| --- | --- | --- | --- |
| step | string or HTMLElement[] | **required**  Selector (or array of elements) for the step elements that will trigger changes. |
| offset | number (0 - 1, or string with "px") | How far from the top of the viewport to trigger a step. | 0.5 |
| progress | boolean | Whether to fire incremental step progress updates or not. | false |
| threshold | number (1 or higher) | The granularity of the progress interval in pixels (smaller = more granular). | 4 |
| once | boolean | Only trigger the step to enter once then remove listener. | false || 
| debug | boolean | Whether to show visual debugging tools or not. | false |
| parent | HTMLElement[] | Parent element for step selector (use if you steps are in shadow DOM). | undefined |
| container | HTMLElement | Parent element for the scroll story (use if scrollama is nested in a HTML element with overflow set to `scroll` or `auto`) | undefined |
| root | HTMLElement | The element that is used as the viewport for checking visibility of the target. Must be the ancestor of the target. Defaults to the browser viewport if not specified or if null. See more details about usage of root on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#intersection_observer_concepts_and_usage). | undefined |

#### scrollama.onStepEnter(callback)

Callback that fires when the top or bottom edge of a step element enters the
offset threshold.

The argument of the callback is an object: `{ element: DOMElement, index: number, direction: string }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`direction`: 'up' or 'down'

#### scrollama.onStepExit(callback)

Callback that fires when the top or bottom edge of a step element exits the
offset threshold.

The argument of the callback is an object: `{ element: DOMElement, index: number, direction: string }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`direction`: 'up' or 'down'

#### scrollama.onStepProgress(callback)

Callback that fires the progress (0 - 1) a step has made through the threshold.

The argument of the callback is an object: `{ element: DOMElement, index: number, progress: number }`

`element`: The step element that triggered

`index`: The index of the step of all steps

`progress`: The percent of completion of the step (0 - 1)

`direction`: 'up' or 'down'

#### scrollama.offsetTrigger([number or string])

Get or set the offset percentage. Value must be between 0-1 (where 0 = top of viewport, 1 = bottom), or a string that includes "px" (e.g., "200px"). If set, returns the scrollama instance.

#### scrollama.resize()

**This is no longer necessary with the addition of a built-in resize observer**. Tell scrollama to get latest dimensions the browser/DOM. It is best practice to
throttle resize in your code, update the DOM elements, then call this function
at the end.

#### scrollama.enable()

Tell scrollama to resume observing for trigger changes. Only necessary to call
if you have previously disabled.

#### scrollama.disable()

Tell scrollama to stop observing for trigger changes.

#### scrollama.destroy()

Removes all observers and callback functions.

#### custom offset

To override the offset passed in the options, set a custom offset for an individual element using data attributes. For example: `<div class="step" data-offset="0.25">` or `data-offset="100px"`.

## Scrollama In The Wild
* [The Billionaire Playbook - ProPublica](https://www.propublica.org/article/the-billionaire-playbook-how-sports-owners-use-their-teams-to-avoid-millions-in-taxes)
* [Women's Pockets are Inferior - The Pudding](https://pudding.cool/2018/08/pockets/)
* [Trump approval rating - Politico](https://www.politico.com/interactives/2019/trump-approval-rating-polls/)
* [How the opioid epidemic evolved - Washington Post](https://www.washingtonpost.com/graphics/2019/investigations/opioid-pills-overdose-analysis/)
* [US Covid-19 deaths, explained in 8 charts and maps - Vox](https://www.vox.com/22252693/covid-19-deaths-us-who-died)
* [Life After Death on Wikipedia - The Pudding](https://pudding.cool/2018/08/wiki-death/)
* [YouTube With Me - YouTube](https://youtube.com/trends/articles/with-me-interactive/)
* [Unchecked Power - ProPublica](https://projects.propublica.org/nypd-unchecked-power/) 
* [Trump's environmental policies rule only part of America - Politico](https://www.politico.com/interactives/2018/trump-environmental-policies-rollbacks/)
* [The story of New Zealand’s Covid-19 lockdown, in graphs - Stuff](https://interactives.stuff.co.nz/2020/05/coronavirus-covid-19-data-new-zealand/)
* [Trump and Biden's Paths to Victory in the 2020 Election - Wall Street Journal](https://www.wsj.com/graphics/the-paths-to-victory/)
* [The sicence of superspreading - Science](https://vis.sciencemag.org/covid-clusters/)
* [El dominio histórico de la derecha en Madrid - elDiario.es](https://www.eldiario.es/madrid/gana-derecha-elecciones-madrid-mayoritaria-30-rico_1_7347696.html)
* [The Permutation Test - Jared Wilber](https://www.jwilber.me/permutationtest/)
* [Constellations - Nadieh Bremer](https://nbremer.github.io/planet-constellations/)
* [Remote Triggering of Earthquakes - Will Chase](https://www.williamrchase.com/vizrisk/vizrisk_main/)
* [Scrollytelling - Mapbox](https://demos.mapbox.com/scrollytelling/)

## Tips
- Avoid using `viewport height` (vh) in your CSS because scrolling up and down constantly triggers vh to change, which will also trigger a window resize.

## Alternatives
- [Scroll Trigger](https://greensock.com/scrolltrigger/)
- [Waypoints](http://imakewebthings.com/waypoints/)
- [ScrollMagic](http://scrollmagic.io/)
- [graph-scroll.js](https://1wheel.github.io/graph-scroll/)
- [ScrollStory](https://sjwilliams.github.io/scrollstory/)
- [enter-view](https://github.com/russellgoldenberg/enter-view)

## Logo

Logo by the awesome [Elaina Natario](https://twitter.com/elainanatario)

## License

MIT License

Copyright (c) 2021 Russell Goldenberg

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
