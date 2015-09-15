# mobservable-react

Package with react component wrapper for combining React with mobservable.
Exports the `reactiveComponent` decorator and some development utilities.
For documentation, see the [mobservable](https://mweststrate.github.io/mobservable) project.

## Installation

`npm install mobservable-react --save`

## API documentation

### reactiveComponent(componentClass)

Function (and decorator) that converts a React component definition (or TypeScript / ES6 class) into a reactive component.
See the [mobservable](https://github.com/mweststrate/mobservable/blob/master/docs/api.md#reactivecomponentcomponent) documentation for more details.

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

# 0.1.6

`reactiveComponent` now accepts a pure render function as argument, besides constructor function. For example:

```javascript
var TodoItem = reactiveComponent(function TodoItem(props) {
    var todo = props.todo;
    return <li>{todo.task}</li>;
});
```

# 0.1.5

reactiveComponent is now defined in terms of side effects.

# 0.1.4

Added support for React 0.14(RC) by dropping peer dependency