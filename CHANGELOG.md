# MobX-React Changelog

### 3.5.9

* Introduced `useStaticRendering(boolean)` to better support server-side rendering scenerios. See [#140](https://github.com/mobxjs/mobx-react/issues/140)
* Print warning when `inject` and `observer` are used in the wrong order, see #146, by @delaetthomas
* export `PropTypes` as well, fixes #153
* Add react as a peer dependency

### 3.5.8

* Fixed issue where `props` where not passed properly to components in very rare cases. Also fixed #115

### 3.5.7

* Bundles are no longer minified, fixes #127

### 3.5.6

* Export `propTypes` as `PropTypes`, like React (@andykog, ##117)

### 3.5.5

* Removed `experimental` status of `inject` / `Provider`. Official feature now.
* Fixed hot-reloading issue, #101

### 3.5.4

* Introduced `wrappedInstance` by @rossipedia on `inject` decorated HOC's, see https://github.com/mobxjs/mobx-react/pull/90/
* print warnings when assign values to `propTypes`, `defaultProps`, or `contextTypes` of a HOC. (by @jtraub, see https://github.com/mobxjs/mobx-react/pull/88/)
* Static properties are now hoisted to HoC components when, #92
* If `inject` is used incombination with a function, the object return from the function will now be merged into the `nextProps` instead of replacing them, #80
* Always do propType checking untracked, partially fixes #56, #305

### 3.5.3

* Fixed error `Cannot read property 'renderReporter' of undefined` (#96)

### 3.5.2

* Added propTypes.observableArrayOf and propTypes.arrayOrObservableArrayOf (#91)

### 3.5.1

* Fixed regression #85, changes caused by the constructor results in inconsistent rendering (N.B.: that is un-idiomatic React usage and React will warn about this!)

### 3.5.0

* Introduced `inject("store1", "store2")(component)` as alternative syntax to inject stores. Should address #77, #70
* Introduced the `wrappedComponent` property on injected higher order components, addresses #70, #72
* Fixed #76: error when no stores are provided through context
* Added typings for devTools related features (@benjamingr).
* Added MobX specific propTypes (@mattruby)
* Merged #44, fixes #73: don't re-render if component was somehow unmounted

### 3.4.0

* Introduced `Provider` / context support (#53 / MobX #300)
* Fixed issues when using devtools with IE. #66 (By @pvasek)

### 3.3.1

* Added typescript typings form `mobx-react/native` and `mobx-react/custom`
* Fixed #63: error when using stateless function components when using babel and typescript

### 3.3.0

* Upgraded to MobX 2.2.0

### 3.2.0

* Added support for react-native 0.25 and higher. By @danieldunderfelt.

### 3.1.0

* Added support for custom renderers (without DOM), use: `mobx-react/custom` as import fixes #42
* Fixed some issues with rollup #43
* Minor optimization

### 3.0.5

Introduced `componentWillReact`

### 3.0.4

The debug name stateless function components of babel transpiled jsx are now properly picked up if the wrapper is applied after defining the component:

```javascript
const MyComponent = () => <span>hi</span>

export default observer(MyComponent);
```

### 3.0.3

Removed peer dependencies, React 15 (and 0.13) are supported as well. By @bkniffler

### 3.0.2

Removed the warning introduced in 3.0.1. It triggered always when using shallow rendering (when using shallow rendering `componentDidMount` won't fire. See https://github.com/facebook/react/issues/4919).

### 3.0.1

Added warning when changing state in `getInitialState` / `constructor`.

### 3.0.0

Upgraded to MobX 2.0.0

### 2.1.5

Improved typescript typings overloads of `observer`

### 2.1.4

Added empty 'dependencies' section to package.json, fixes #26

### 2.1.3

Added support for context to stateless components. (by Kosta-Github).

### 2.1.1

Fixed #12: fixed React warning when a component was unmounted after scheduling a re-render but before executing it.

### 2.1.0

Upped dependency of mobx to 1.1.1.

### 2.0.1

It is now possible to define `propTypes` and `getDefaultProps` on a stateless component:

```javascript
const myComponent = (props) => {
    // render
};

myComponent.propTypes = {
    name: React.PropTypes.string
};

myComponent.defaultProps = {
    name: "World"
};

export default observer(myComponent);
```

All credits to Jiri Spac for this contribution!

### 2.0.0

Use React 0.14 instead of React 0.13. For React 0.13, use version `mobx-react@1.0.2` or higher.

### 1.0.2

Minor fixes and improvements

### 1.0.1

Fixed issue with typescript typings. An example project with MobX, React, Typescript, TSX can be found here: https://github.com/mobxjs/mobx-react-typescript

### 1.0.0

`reactiveComponent` has been renamed to `observer`

### 0.2.3

Added separte import for react-native: use `var reactiveComponent = require('mobx-react/native').reactiveComponent` for native support; webpack clients will refuse to build otherwise.

### 0.2.2

Added react-native as dependency, so that the package works with either `react` or `react-native`.

### 0.2.0

Upgraded to MobX 0.7.0

### 0.1.7

Fixed issue where Babel generated component classes where not properly picked up.

### 0.1.6

`observer` now accepts a pure render function as argument, besides constructor function. For example:

```javascript
var TodoItem = observer(function TodoItem(props) {
    var todo = props.todo;
    return <li>{todo.task}</li>;
});
```

### 0.1.5

observer is now defined in terms of side effects.

### 0.1.4

Added support for React 0.14(RC) by dropping peer dependency
