# MobX-React Changelog

### 4.3.5

Fixed some issues with the typescript typings. See for example #353

### 4.3.4

Improved typescript typings, including support for `strict` mode in TS 2.6. Fixes

### 4.3.3

Added support for React 16. (No changes)

### 4.3.2

Killed accidentally exposed default exports.

If you are still using `import mobxReact from "mobx-react"`, use `import * as mobxReact from "mobx-react"`, or better `import { whatYouNeed } from "mobx-react"` instead.

### 4.3.1
### 4.3.0 (unpublished)

Improved module rollup setup, enabling better tree shaking. See #324 / #328

### 4.2.2

* Fixed check for stateless components, by @leader22, see #280

### 4.2.1

_Note: Due to pull / rebase issue the release commit is incorrect. This is the released [commit](https://github.com/mobxjs/mobx-react/commit/f1b3eefc5239cb451b317204fa8aad94b4dcfc2f)_

* Reduced module size by 31% (switched to rollup.js). See #244 by @rossipedia
* Skip creation of `.wrappedInstance` reference for stateless components. See #254 by @farwayer
* Introduced global `onError` handler hook to be notified on errors thrown by `@observer` components. See #262 by @andykog
* Improved typescript typings of the exposed `propTypes`, See #263 by @panjiesw

### 4.2.0

* Same as 4.2.1, but contained build issue and is unpublished

### 4.1.8

* Undid change introduced in 4.1.4 where the lifecycle hooks were protected, as this breaks react-hot-loader.... Fixes #231

### 4.1.7

* Added support for React 15.5 (no deprecation warnings) and 16.0 (no proptypes / createClass), by @andykog, see #238. Fixes #233, #237

### 4.1.5

* Improved typescript typings, fixes #223

### 4.1.4

* Made lifecycle hooks used by mobx-react read-only to make sure they are not accidentally overwritten in component instances. Fixes, #195, #202. Note that they can still be defined, just make sure to define them on the prototype (`componentWillMount() {}`) instead of the instance (`componentWillMount = () => {}`). Which is best practice anyway.

### 4.1.3

* Fixed `ReactDOM.findDOMNode` exception when using react-test-runner, #216

### 4.1.2

* Exceptions caught during render are now rethrown with proper stack, fixes #206

### 4.1.1

* Exposed `wrappedInstance` and `wrappedComponent` in typings
* Fixed accidental use of `default` import from `mobx` package.

### 4.1.0

* Added support for MobX3. Note that using MobX3 changes the error semantics. If an `observer` component throws, it will no longer crash the app, but just log the exceptions instead.

### 4.0.4

* Introduced `suppressChangedStoreWarning` to optionally supresss change store warnings, by @dropfen, see #182, #183

### 4.0.3

* Fixed issue where userland componentWilMount was run before observer componentWillMount

### 4.0.2

* Fixed order of `inject` overloads, see #169
* Fixed import of `mobx` when using Webpack without commonjs plugin, see: #168

### 4.0.1

* Improved typings, by @timmolendijk, fixes #164, #166
* Fixed `inject` signature in readme, by @farwayer

### 4.0.0

#### `observer` now uses shallow comparision for all props _(Breaking change)_

`observer` used to compare all properties shallow in the built-in _shouldComponentUpdate_, except when it received
non-observable data structures.
Because mobx-react cannot know whether a non observable has been deeply modified, it took no chances and just re-renders.

However, the downside of this when an unchanged, non-observable object is passed in to an observer component again, it would still cause a re-render.
Objects such as styling etc. To fix this mobx-react will now always compare all properties in a pure manner.
In general this should cause no trouble, as typically mutable data in mobx based objects is captured in observable objects, which will still cause components to re-render if needed.

If you need to pass in a deeply modified object and still want to make sure to cause a re-render, either

 * make sure the object / array is an observable
 * do not decorate your component with `observer`, but use `Observer` regions instead (see below)

See [#160](https://github.com/mobxjs/mobx-react/issues/160) for more details.

#### `inject(fn)(component)` will now track `fn` as well

`inject(func)` is now reactive as well, that means that transformations in the selector function will be tracked, see [#111](https://github.com/mobxjs/mobx-react/issues/111)

```javascript
const NameDisplayer = ({ name }) => <h1>{name}</h1>

const UserNameDisplayer = inject(
    stores => ({
        name: stores.userStore.name
    })
)(NameDisplayer)

const user = mobx.observable({
    name: "Noa"
})

const App = () => (
    <Provider userStore={user}>
        <UserNameDisplayer />
    </Provider>
)

ReactDOM.render(<App />, document.body)
```

_N.B. note that in this specific case NameDisplayer doesn't have to be an `observer`, as it doesn't receive observables, but just plain data from the transformer function._

#### `this.props` and `this.state` in React components are now observables as well

A common cause of confusion were cases like:

```javascript
@observer class MyComponent() {
    @computed upperCaseName() {
        return this.props.user.name.toUpperCase()
    }

    render() {
        return <h1>{this.upperCaseName}</h1>
    }
}
```

This component would re-render if `user.name` was modified, but it would still render the previous user's name if a complete new user was received!
The reason for that is that in the above example the only observable tracked by the computed value is `user.name`, but not `this.props.user`.
So a change to the first would be picked up, but a change in `props` itself, assigning a new user, not.

Although this is technically correct, it was a source of confusion.
For that reason `this.state` and `this.props` are now automatically converted to observables in any `observer` based react component.
For more details, see [#136](https://github.com/mobxjs/mobx-react/pull/136) by @Strate

#### Better support for Server Side Rendering

Introduced `useStaticRendering(boolean)` to better support server-side rendering scenarios. See [#140](https://github.com/mobxjs/mobx-react/issues/140)

#### Introduced `Observer` as alternative syntax to the `observer` decorator.

_This feature is still experimental and might change in the next minor release, or be deprecated_

Introduced `Observer`. Can be used as alternative to the `observer` decorator. Marks a component region as reactive.
See the Readme / [#138](https://github.com/mobxjs/mobx-react/issues/138)
Example:

```javascript
const UserNameDisplayer = ({ user }) => (
    <Observer>
        {() => <div>{user.name}</div>}
    </Observer>
)
```

#### Using `observer` to inject stores is deprecated

The fact that `observer` could inject stores as well caused quite some confusion.
Because in some cases `observer` would return the original component (when not inject), but it would return a HoC when injecting.
To make this more consistent, you should always use `inject` to inject stores into a component. So use:

```
@inject("store1", "store2") @observer
class MyComponent extends React.Component {
```

or:

```
const MyComponent = inject("store1", "store2")(observer(props => rendering))
```

For more info see the related [discussion](https://github.com/mobxjs/mobx-react/commit/666577b41b7af8209839e7b243064a31c9951632#commitcomment-19773706)

#### Other improvements

* If `mobx` and `mobx-react` are used in combination, all reactions are run as part of React's batched updates. This minimizes the work of the reconciler, guarantees optimal rendering order of components (if the rendering was not triggered from within a React event). Tnx @gkaemmer for the suggestion.
* It is now possible to directly define `propTypes` and `defaultProps` on components wrapped with `inject` (or `observer(["stores"])`) again, see #120, #142. Removed the warnings for this, and instead improved the docs.
* Clean up data subscriptions if an error is thrown by an `observer` component, see [#134](https://github.com/mobxjs/mobx-react/pull/134) by @andykog
* export `PropTypes` as well in typescript typings, fixes #153
* Add react as a peer dependency
* Added minified browser build: `index.min.js`, fixes #147
* Generate better component names when using `inject`

---

### 3.5.9

* Print warning when `inject` and `observer` are used in the wrong order, see #146, by @delaetthomas

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
