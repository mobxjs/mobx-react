# MobX-React Changelog

### 6.2.4

-  Fix error thrown in the already defined observer class component warning message when attempting to get the components display name.  [#887](https://github.com/mobxjs/mobx-react/issues/887)

### 6.2.3

-   Log warning if class component is already an observer to prevent memory leaks.  [#839](https://github.com/mobxjs/mobx-react/issues/839)
-   Fix disposeOnUnmount when using react-hot-loader.  [#725](https://github.com/mobxjs/mobx-react/issues/725)

### 6.2.2

-   Observer batching imports are kept in production builds as side effects ([see issue](https://github.com/mobxjs/mobx-react-lite/issues/273))

### 6.2.1

-   Remove auto configured observer batching using react-dom. Fixes: [#852](https://github.com/mobxjs/mobx-react/issues/852).

### 6.2.0

-   Updated to latest mobx-react-lite V2 for compatibility with `React.StrictMode`.
-   Observer batching (see more [in the docs](https://github.com/mobxjs/mobx-react-lite/#observer-batching)).
-   Possibly breaking change, the `dist/mobxreact.rn.module.js` is no longer available, use `dist/mobxreact.esm.js` instead.

### 6.1.6 / 6.1.7

-   Fix an issue with class components & observableRequiresReaction. [#806](https://github.com/mobxjs/mobx-react/issues/806) through [#829](https://github.com/mobxjs/mobx-react/pull/829)
-   Use TSDX for building to mitigate issues with accessing `process.env` [#821](https://github.com/mobxjs/mobx-react/pull/821)

### 6.1.5

-   Added check if `process.env` is available, fixes [#801](https://github.com/mobxjs/mobx-react/issues/801) through [#812](https://github.com/mobxjs/mobx-react/pull/812) by [@ynejati](https://github.com/ynejati)
-   Added warning if component's `render` method is accidentally overwritten. [#799](https://github.com/mobxjs/mobx-react/pull/799) by [@Venryx](https://github.com/Venryx). Helps prevent memory leaks as in: [#797](https://github.com/mobxjs/mobx-react/issues/797)

### 6.1.4

-   Update dependency mobx-react-lite@1.4.2 which includes fix for [RN Fast Refresh](https://github.com/mobxjs/mobx-react-lite/issues/226)

### 6.1.2 / 6.1.3

-   Add reexport of `useObserver` from `mobx-react-lite` [#734](https://github.com/mobxjs/mobx-react/issues/734)
-   Add the ability to pass multiple children to Provider
-   Fixed [#717](https://github.com/mobxjs/mobx-react/issues/717). Now `inject` works correctly with components that use `React.forwardRef`
-   Observer checks for use of React.memo [#720](https://github.com/mobxjs/mobx-react/issues/720)
-   Get rid of the redundant Injector wrapper [#716](https://github.com/mobxjs/mobx-react/pull/716)

### 6.1.1

-   Fixed issue where combining `@disposeOnUnmount` with `disposeOnUnmount` didn't clean up everything. Fixes [#666](https://github.com/mobxjs/mobx-react/issues/666) trough [#671](https://github.com/mobxjs/mobx-react/pull/671) by [@JabX](https://github.com/JabX)

### 6.1.0

-   Restored the classic implementation of `observer`: class based components are patched again, rather than wrapping them in `<Observer>`, see [#703](https://github.com/mobxjs/mobx-react/pull/703). Fixes:
    -   `componentDidUpdate` not being triggered after a reactive render [#692](https://github.com/mobxjs/mobx-react/issues/692)
    -   The appearance of an additional `<Observer>` component in the component tree, which complicates shallow testing [#699](https://github.com/mobxjs/mobx-react/issues/699)
    -   Some regressions in `disposeOnUnmount` [#702](https://github.com/mobxjs/mobx-react/issues/702)
    -   Note that dev tool support, and other constraints mentioned in the 6.0.0 release notes have not been restored.
-   The function `useStaticRendering(value: boolean): void` from mobx-react-lite is now exposed

### 6.0.4

-   Fixed IE 11 compatibility which was accidentally broken. Fixes [#698](https://github.com/mobxjs/mobx-react/issues/698)

### 6.0.3

-   `disposeOnUnmount` now supports initializing it with an array of disposers. Fixes [#637](https://github.com/mobxjs/mobx-react/pull/637) through [#641](https://github.com/mobxjs/mobx-react/pull/641) by [@Amareis](https://github.com/Amareis)
-   Fixed hoisting of statically declared members. Fixes [#678](https://github.com/mobxjs/mobx-react/issues/678) through [#682](https://github.com/mobxjs/mobx-react/pull/682) by [@meabed](https://github.com/meabed)

### 6.0.2

-   Added missing types for `MobXProviderContext`, `useLocalStore` and `useAsObservableSource`. Fixes #679.

### 6.0.0

**Breaking changes**

-   The minimal supported version of React is 16.8.0
-   Killed the possibility to directly pass store names to `observer`. Always use `inject` instead. (This was deprecated for a long time already). `observer(["a", "b"], component)` should now be written as `inject("a", "b")(component)`.
-   `observer` components no longer automatically recover from errors (to prevent potential memory leaks). Instead, this is the responsibility of error boundaries.
-   `inject` now supports ref forwarding. As such, the `.wrappedInstance` property has been removed since refs can be used instead. (Fixes [#616](https://github.com/mobxjs/mobx-react/issues/616) (See also [#619](https://github.com/mobxjs/mobx-react/pull/619) by [42shadow42](https://github.com/42shadow42))
-   Changing the set of stores in `Provider` is no longer supported and while throw a hard error (this was a warning before), as the model of `Provider` / `inject` has always been designed to inject final values into the tree. (That is, constanted references, the injected objects themselves can be stateful without problem). If you want to dynamically swap what is provided into the tree, use `React.createContext` instead of `Provider` / `inject`. The suppressChangedStoreWarning`flag for`Provider` has been dropped.
-   The third argument of custom `storesToProps` functions passed to `inject` is no longer available.
-   `<Observer>` no longer supports the deprecated `inject` property.
-   Defining `shouldComponentUpdate` on `observer` based components is no longer supported
-   `propTypes` is no longer exposed, use `PropTypes` instead
-   `disposeOnUnmount` now only supports direct subclasses of `React.Component` and `React.PureComponent`. This prevents several unreliable edge cases that silently leaked memory before. Either only extend React.(Pure)Component when using `disposeOnUnmount`, or manually clean up stuff in `componentWillUnmount`.
-   The `onError` global error handler has been removed. Use error boundaries instead.
-   Improved dev tool names for `inject` wrapped components, see [#472](https://github.com/mobxjs/mobx-react/pull/472) by [SimeonC](https://github.com/SimeonC). Fixes [#466](https://github.com/mobxjs/mobx-react/issues/466)
-   Dropped support for a build of mobx-react that doesn't target either `react-dom` or `react-native`. mobx-react doesn't need `react-dom` to be present, but to make sure your build tools don't fail, you might want to stub `react-dom` as an empty module.
-   The `componentWillReact` has been dropped
-   The MobX-react devtools (either as package or browser plugin) are no longer supported. Instead, the following tools can be analyzed to analyze your mobx-react application:
    -   Visualizing re-rendering of components is now part of the standard React devtools
    -   The dependency tree of a compent tree can be inspected by showing the state of the `useObserver` hook in the React devtools (at the time of this release it displays as just `Object`, but the next iteration of the React devtools will support those properly)
    -   Spying on events can still be done with the [MobX-react browser plugin](https://github.com/mobxjs/mobx-devtools), through the [mobx-logger](https://github.com/winterbe/mobx-logger) package or manually by using the `spy` or `trace` utility from the mobx package.

**Improvements**

-   Hook based components are now supported by mobx-react (in fact, the package is now implemented using hooks)
-   Class based `observer` components are now _recommended_ to extend `React.PureComponent`. Functional `observer` components are now automatically wrapped in `React.memo` internally. See section in [README](https://mobx.js.org/README.html#observercomponentclass) for more details.
-   For `observer` based components, there will now be an additional `Observer` component in the tree.
-   Two new hooks have been exposed, in case you want to manage local state in observable: `useLocalStore` and `useAsObservableSource`.
-   `MobXProviderContext` is now exposed from the package, in case you want to consume the context used by `Provider` with a `useContext` hook.

### 5.4.3

-   Fixed [#612](https://github.com/mobxjs/mobx-react/issues/612), `contextType` was hoisted by `inject`, which shouldn't the case.

### 5.4.1 / 5.4.2

-   Fixed issue where `react-is` wasn't properly rolled-up into the package. Fixes [#608](https://github.com/mobxjs/mobx-react/issues/608)

### 5.4.0

-   Added support for forward refs, fixes [#602](https://github.com/mobxjs/mobx-react/issues/602)

### 5.3.6

-   Fixed some additional issues around life-cycle patching, take 3. See [#536](https://github.com/mobxjs/mobx-react/pull/586) by [@xaviergonz](https://github.com/xaviergonz). Fixed [#579](https://github.com/mobxjs/mobx-react/issues/579)

### 5.3.5

-   Fixed some additional issues around life-cycle patching, see [#583](https://github.com/mobxjs/mobx-react/pull/583) by [@xaviergonz](https://github.com/xaviergonz). Fixed [#581](https://github.com/mobxjs/mobx-react/issues/581)

### 5.3.4

-   Fixed unending recursing as a result of lifecylce patching. Fixes [#579](https://github.com/mobxjs/mobx-react/issues/579) through [#582](https://github.com/mobxjs/mobx-react/pull/582) by [@xaviergonz](https://github.com/xaviergonz)

### 5.3.3

-   Fixed `Cannot read property 'forEach' of undefined` exception if `disposeOnUnmount` was called conditionally. [#578](https://github.com/mobxjs/mobx-react/pull/578) by [Jef Hellemans](https://github.com/JefHellemans)

### 5.3.2

-   Fixed: "process not defined", [#574](https://github.com/mobxjs/mobx-react/pull/574/) through [#576](https://github.com/mobxjs/mobx-react/pull/576/) by [@xaviergonz](https://github.com/xaviergonz)

### 5.3.0 / 5.3.1

_5.3.0 was retracted as files were not generated correctly during publish_

-   Added `disposeOnUnmount` utility / decorator to call disposable properties (reaction, autorun, etc) automatically on `componentWillUnmount`
-   Introduced new method to patch lifecycle methods which should be more compatible with for example arrow functions.

### 5.2.8

-   Make sure `mobx-react` doesn't require `Object.assign` polyfill

### 5.2.7

-   Fixed issue where React 16.5 printed a warning when using `Provider`, fixes [#545](https://github.com/mobxjs/mobx-react/issues/545)

### 5.2.6

-   Fixed bug in defining properties (although the bug had no known observable effect). Fixes [#540](https://github.com/mobxjs/mobx-react/issues/540)

### 5.2.4 / 5.2.5

-   Improved compatibility with React-Hot-Loader, see [#522](https://github.com/mobxjs/mobx-react/pull/522) by [theKashey](https://github.com/theKashey). Fixes [#500](https://github.com/mobxjs/mobx-react/issues/500)

### 5.2.3

-   Fixed problem with `Symbol` feature detection. By [@Strate](https://github.com/Strate) through [#501](https://github.com/mobxjs/mobx-react/pull/501). Fixes [#498](https://github.com/mobxjs/mobx-react/issues/498) and [#503](https://github.com/mobxjs/mobx-react/issues/503).

### 5.2.2

-   Polyfill `Symbol` if it doesn't exist. By [@Strate](https://github.com/Strate) through [#499](https://github.com/mobxjs/mobx-react/pull/499).

### 5.2.1

-   Component `props` and `state` properties are now made observable during the instance creation. This restores the behavior from before 5.1.0 where `props` and `state` could safely be observed during mount. Actually it is now possible to do similar things in constructors as well. Fixes [#478](https://github.com/mobxjs/mobx-react/issues/478). Thanks [@Strate](https://github.com/Strate) for the idea and PR! [#496](https://github.com/mobxjs/mobx-react/pull/496).

### 5.2.0

-   Added backward compatible support for MobX 5.
-   Fixed components sometimes being displayed as `undefined` in mobx-devtools. See [#470](https://github.com/mobxjs/mobx-react/pull/470) by [@MauricioAndrades](https://github.com/MauricioAndrades)
-   Removed unnecessary warning `@observer` was used both on a sub and super class. See [#492](https://github.com/mobxjs/mobx-react/pull/476) by [@skiritsis](https://github.com/skiritsis). _N.B. putting `@observer` on a super and subclass is still not an supported pattern, use @observer on subclasses only!_

### 5.1.2

-   Fixed regression bug in integration with devtools. Fixed through [#465](https://github.com/mobxjs/mobx-react/pull/465) by @le0nik

### 5.1.0

-   Added support for React 16.3, including support for the `getDerivedStateFromProps` life-cycle hook. MobX will no longer use `componentWillMount` hook internally, so that it can be used in `StrictMode` react as well. Fixes [#447](https://github.com/mobxjs/mobx-react/issues/447)
-   Static properties of a function component are now automatically hoisted when the component is wrapped by `observer`. Implements [#427](https://github.com/mobxjs/mobx-react/pull/427)
-   Misspelled export `componentByNodeRegistery` is now properly export as `componentByNodeRegistry` as well, please update consumers, the mispelled version will be dropped in the next major. Fixes [#421](https://github.com/mobxjs/mobx-react/issues/421)
-   Deprecated the support for the `inject` property on `Observer`, it is fundamentally broken and should not be used. Use `inject` on the enclosing component instead and grab the necessary stores from the closure. Fixes [#423](https://github.com/mobxjs/mobx-react/issues/423)
-   Added warning about using `observer` on a React.PureComponent, this will become an exception in the next major. Fixes [#309](https://github.com/mobxjs/mobx-react/issues/309)
-   Mobx-react will now print a warning when combining `observer` with a custom `shouldComponentUpdate` implementation. Fixes [#417](https://github.com/mobxjs/mobx-react/issues/417)

### 5.0.0

-   Added compatibility with MobX 4.x. This version is not compatible with older Mobx versions

### 4.4.3

-   The exposed React Native build now uses commonjs, to prevent the need of further transpilation. Fixes [#428](https://github.com/mobxjs/mobx-react/issues/428)

### 4.4.2

-   Fixed issue with mobx-react not compiling on react-native due to the presence of a `.babelrc` file. Fixes [#415](https://github.com/mobxjs/mobx-react/issues/415) by [Ryan Rampersad](https://github.com/ryanmr) through [#416](https://github.com/mobxjs/mobx-react/pull/416)

### 4.4.1

-   Fixed syntax error in 4.4.0 that escaped

### 4.4.0

-   `Observer` now supports render props, `render` and `inject`. See the updated readme. By [ZiYingMai](https://github.com/Sunshine168) through [#403](https://github.com/mobxjs/mobx-react/pull/403)
-   Fixed: `NaN` is now considered to be equal to `NaN` when doing reconciliation. Fixes [#363](https://github.com/mobxjs/mobx-react/issues/363), by [Andrew Branch](https://github.com/andrewbranch) through [#402](https://github.com/mobxjs/mobx-react/pull/402)
-   Improved typings of `Observer` component, by [Rafał Filipek](https://github.com/RafalFilipek) through [#376](https://github.com/mobxjs/mobx-react/pull/376)
-   Fixed incorrect generation of component name, by [Andy Kogut](https://github.com/andykog) through [#368](https://github.com/mobxjs/mobx-react/pull/368)
-   Lot of internal repo upgrades: Test suite is now in Jest, Prettier is used etc.

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

-   Fixed check for stateless components, by @leader22, see #280

### 4.2.1

_Note: Due to pull / rebase issue the release commit is incorrect. This is the released [commit](https://github.com/mobxjs/mobx-react/commit/f1b3eefc5239cb451b317204fa8aad94b4dcfc2f)_

-   Reduced module size by 31% (switched to rollup.js). See #244 by @rossipedia
-   Skip creation of `.wrappedInstance` reference for stateless components. See #254 by @farwayer
-   Introduced global `onError` handler hook to be notified on errors thrown by `@observer` components. See #262 by @andykog
-   Improved typescript typings of the exposed `propTypes`, See #263 by @panjiesw

### 4.2.0

-   Same as 4.2.1, but contained build issue and is unpublished

### 4.1.8

-   Undid change introduced in 4.1.4 where the lifecycle hooks were protected, as this breaks react-hot-loader.... Fixes #231

### 4.1.7

-   Added support for React 15.5 (no deprecation warnings) and 16.0 (no proptypes / createClass), by @andykog, see #238. Fixes #233, #237

### 4.1.5

-   Improved typescript typings, fixes #223

### 4.1.4

-   Made lifecycle hooks used by mobx-react read-only to make sure they are not accidentally overwritten in component instances. Fixes, #195, #202. Note that they can still be defined, just make sure to define them on the prototype (`componentWillMount() {}`) instead of the instance (`componentWillMount = () => {}`). Which is best practice anyway.

### 4.1.3

-   Fixed `ReactDOM.findDOMNode` exception when using react-test-runner, #216

### 4.1.2

-   Exceptions caught during render are now rethrown with proper stack, fixes #206

### 4.1.1

-   Exposed `wrappedInstance` and `wrappedComponent` in typings
-   Fixed accidental use of `default` import from `mobx` package.

### 4.1.0

-   Added support for MobX3. Note that using MobX3 changes the error semantics. If an `observer` component throws, it will no longer crash the app, but just log the exceptions instead.

### 4.0.4

-   Introduced `suppressChangedStoreWarning` to optionally supresss change store warnings, by @dropfen, see #182, #183

### 4.0.3

-   Fixed issue where userland componentWilMount was run before observer componentWillMount

### 4.0.2

-   Fixed order of `inject` overloads, see #169
-   Fixed import of `mobx` when using Webpack without commonjs plugin, see: #168

### 4.0.1

-   Improved typings, by @timmolendijk, fixes #164, #166
-   Fixed `inject` signature in readme, by @farwayer

### 4.0.0

#### `observer` now uses shallow comparision for all props _(Breaking change)_

`observer` used to compare all properties shallow in the built-in _shouldComponentUpdate_, except when it received
non-observable data structures.
Because mobx-react cannot know whether a non observable has been deeply modified, it took no chances and just re-renders.

However, the downside of this when an unchanged, non-observable object is passed in to an observer component again, it would still cause a re-render.
Objects such as styling etc. To fix this mobx-react will now always compare all properties in a pure manner.
In general this should cause no trouble, as typically mutable data in mobx based objects is captured in observable objects, which will still cause components to re-render if needed.

If you need to pass in a deeply modified object and still want to make sure to cause a re-render, either

-   make sure the object / array is an observable
-   do not decorate your component with `observer`, but use `Observer` regions instead (see below)

See [#160](https://github.com/mobxjs/mobx-react/issues/160) for more details.

#### `inject(fn)(component)` will now track `fn` as well

`inject(func)` is now reactive as well, that means that transformations in the selector function will be tracked, see [#111](https://github.com/mobxjs/mobx-react/issues/111)

```javascript
const NameDisplayer = ({ name }) => <h1>{name}</h1>

const UserNameDisplayer = inject(stores => ({
    name: stores.userStore.name
}))(NameDisplayer)

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
const UserNameDisplayer = ({ user }) => <Observer>{() => <div>{user.name}</div>}</Observer>
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

-   If `mobx` and `mobx-react` are used in combination, all reactions are run as part of React's batched updates. This minimizes the work of the reconciler, guarantees optimal rendering order of components (if the rendering was not triggered from within a React event). Tnx @gkaemmer for the suggestion.
-   It is now possible to directly define `propTypes` and `defaultProps` on components wrapped with `inject` (or `observer(["stores"])`) again, see #120, #142. Removed the warnings for this, and instead improved the docs.
-   Clean up data subscriptions if an error is thrown by an `observer` component, see [#134](https://github.com/mobxjs/mobx-react/pull/134) by @andykog
-   export `PropTypes` as well in typescript typings, fixes #153
-   Add react as a peer dependency
-   Added minified browser build: `index.min.js`, fixes #147
-   Generate better component names when using `inject`

---

### 3.5.9

-   Print warning when `inject` and `observer` are used in the wrong order, see #146, by @delaetthomas

### 3.5.8

-   Fixed issue where `props` where not passed properly to components in very rare cases. Also fixed #115

### 3.5.7

-   Bundles are no longer minified, fixes #127

### 3.5.6

-   Export `propTypes` as `PropTypes`, like React (@andykog, ##117)

### 3.5.5

-   Removed `experimental` status of `inject` / `Provider`. Official feature now.
-   Fixed hot-reloading issue, #101

### 3.5.4

-   Introduced `wrappedInstance` by @rossipedia on `inject` decorated HOC's, see https://github.com/mobxjs/mobx-react/pull/90/
-   print warnings when assign values to `propTypes`, `defaultProps`, or `contextTypes` of a HOC. (by @jtraub, see https://github.com/mobxjs/mobx-react/pull/88/)
-   Static properties are now hoisted to HoC components when, #92
-   If `inject` is used incombination with a function, the object return from the function will now be merged into the `nextProps` instead of replacing them, #80
-   Always do propType checking untracked, partially fixes #56, #305

### 3.5.3

-   Fixed error `Cannot read property 'renderReporter' of undefined` (#96)

### 3.5.2

-   Added propTypes.observableArrayOf and propTypes.arrayOrObservableArrayOf (#91)

### 3.5.1

-   Fixed regression #85, changes caused by the constructor results in inconsistent rendering (N.B.: that is un-idiomatic React usage and React will warn about this!)

### 3.5.0

-   Introduced `inject("store1", "store2")(component)` as alternative syntax to inject stores. Should address #77, #70
-   Introduced the `wrappedComponent` property on injected higher order components, addresses #70, #72
-   Fixed #76: error when no stores are provided through context
-   Added typings for devTools related features (@benjamingr).
-   Added MobX specific propTypes (@mattruby)
-   Merged #44, fixes #73: don't re-render if component was somehow unmounted

### 3.4.0

-   Introduced `Provider` / context support (#53 / MobX #300)
-   Fixed issues when using devtools with IE. #66 (By @pvasek)

### 3.3.1

-   Added typescript typings form `mobx-react/native` and `mobx-react/custom`
-   Fixed #63: error when using stateless function components when using babel and typescript

### 3.3.0

-   Upgraded to MobX 2.2.0

### 3.2.0

-   Added support for react-native 0.25 and higher. By @danieldunderfelt.

### 3.1.0

-   Added support for custom renderers (without DOM), use: `mobx-react/custom` as import fixes #42
-   Fixed some issues with rollup #43
-   Minor optimization

### 3.0.5

Introduced `componentWillReact`

### 3.0.4

The debug name stateless function components of babel transpiled jsx are now properly picked up if the wrapper is applied after defining the component:

```javascript
const MyComponent = () => <span>hi</span>

export default observer(MyComponent)
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
const myComponent = props => {
    // render
}

myComponent.propTypes = {
    name: React.PropTypes.string
}

myComponent.defaultProps = {
    name: "World"
}

export default observer(myComponent)
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
    var todo = props.todo
    return <li>{todo.task}</li>
})
```

### 0.1.5

observer is now defined in terms of side effects.

### 0.1.4

Added support for React 0.14(RC) by dropping peer dependency
