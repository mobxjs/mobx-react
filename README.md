# mobservable-react

Package with react component wrapper for combining React with mobservable.
Exports the `observer` decorator and some development utilities.
For documentation, see the [mobservable](https://mweststrate.github.io/mobservable) project.
This package supports both React and React-Native.

## Installation

`npm install mobservable-react --save`

```javascript
import observer from 'mobservable-react';
// - or -
import observer from 'mobservable-react/native';
```

This package provides the bindings for Mobservable and React.
See the [official documentation](mweststrate.github.io/mobservable/) for how to get started.

## Boilerplate projects that use mobservable-react

* Minimal Mobservable, React, ES6, JSX, Hot reloading: [Mobservable-React-Boilerplate](https://github.com/mweststrate/mobservable-react-boilerplate)
* TodoMVC Mobservable, React, ES6, JSX, Hot reloading: [Mobservable-React-TodoMVC](https://github.com/mweststrate/mobservable-react-todomvc)
* Minimal Mobservable, React, Typescript, TSX: [Mobservable-React-Typescript](https://github.com/mweststrate/mobservable-react-typescript)

## API documentation

### observer(componentClass)

Function (and decorator) that converts a React component definition, React component class or stand-alone render function into a reactive component.
See the [mobservable](https://github.com/mweststrate/mobservable/blob/master/docs/api.md#observercomponent) documentation for more details.

![reactive function](reactive-function.png)

### trackComponents()

Enables the tracking from components. Each rendered reactive component will be added to the `componentByNodeRegistery` and its renderings will be reported through the `renderReporter` event emitter.

### renderReporter

Event emitter that reports render timings and component destructions. Only available after invoking `trackComponents()`.
New listeners can be added through `renderReporter.on(function(data) { /* */ })`.

Data will have one of the following formats:

```javascript
{
    event: 'render',
    renderTime: /* time spend in the .render function of a component, in ms. */,
    totalTime: /* time between starting a .render and flushing the changes to the DOM, in ms. */,
    component: /* component instance */,
    node: /* DOM node */
}
```

```javascript
{
    event: 'destroy',
    component: /* component instance */,
    node: /* DOM Node */
}
```

### componentByNodeRegistery

WeakMap. It's `get` function returns the associated reactive component of the given node. The node needs to be precisely the root node of the component.
This map is only available after invoking `trackComponents`.

# Changelog

# 1.0.2 / 1.03

Minor fixes and improvements

# 1.0.1

Fixed issue with typescript typings. An example project with Mobservable, React, Typescript, TSX can be found here: https://github.com/mweststrate/mobservable-react-typescript

# 1.0.0

`reactiveComponent` has been renamed to `observer`

# 0.2.3

Added separte import for react-native: use `var reactiveComponent = require('mobservable-react/native').reactiveComponent` for native support; webpack clients will refuse to build otherwise.

# 0.2.2

Added react-native as dependency, so that the package works with either `react` or `react-native`.

# 0.2.0

Upgraded to Mobservable 0.7.0

# 0.1.7

Fixed issue where Babel generated component classes where not properly picked up.

# 0.1.6

`observer` now accepts a pure render function as argument, besides constructor function. For example:

```javascript
var TodoItem = observer(function TodoItem(props) {
    var todo = props.todo;
    return <li>{todo.task}</li>;
});
```

# 0.1.5

observer is now defined in terms of side effects.

# 0.1.4

Added support for React 0.14(RC) by dropping peer dependency