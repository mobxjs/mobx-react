# mobx-react

[![Build Status](https://travis-ci.org/mobxjs/mobx-react.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react)
[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![CDNJS](https://img.shields.io/cdnjs/v/mobx-react.svg)](https://cdnjs.com/libraries/mobx-react)


Package with React component wrapper for combining React with MobX.
Exports the `observer` decorator and some development utilities.
For documentation, see the [MobX](https://mobxjs.github.io/mobx) project.
This package supports both React and React Native.

## Installation

`npm install mobx-react --save`

Or CDN: https://unpkg.com/mobx-react (namespace: `mobxReact`)

```javascript
import {observer} from 'mobx-react';
// - or, for custom renderers without DOM: -
import {observer} from 'mobx-react/custom';
```

This package provides the bindings for MobX and React.
See the [official documentation](http://mobxjs.github.io/mobx/intro/overview.html) for how to get started.

## Boilerplate projects that use mobx-react

* Minimal MobX, React, ES6, JSX, Hot reloading: [MobX-React-Boilerplate](https://github.com/mobxjs/mobx-react-boilerplate)
* TodoMVC MobX, React, ES6, JSX, Hot reloading: [MobX-React-TodoMVC](https://github.com/mobxjs/mobx-react-todomvc)
* Minimal MobX, React, Typescript, TSX: [MobX-React-Typescript-Boilerplate](https://github.com/mobxjs/mobx-react-typescript-boilerplate)
* Minimal MobX, React, ES6(babel), JSPM with hot reloading modules:
[jspm-react](https://github.com/capaj/jspm-react)
* React Native Counter: [Mobx-React-Native-Counter](https://github.com/bartonhammond/mobx-react-native-counter)


## API documentation

### observer(componentClass)

Function (and decorator) that converts a React component definition, React component class or stand-alone render function into a reactive component, which tracks which observables are used by `render` and automatically re-renders the component when one of these values changes.
See the [MobX](https://mobxjs.github.io/mobx/refguide/observer-component.html) documentation for more details.

```javascript
import {observer} from "mobx-react";

// ---- ES5 syntax ----

const TodoView = observer(React.createClass({
    displayName: "TodoView",
    render() {
        return <div>{this.props.todo.title}</div>
    }
}));

// ---- ES6 syntax ----

const TodoView  = observer(class TodoView extends React.Component {
    render() {
        return <div>{this.props.todo.title}</div>
    }
})

// ---- ESNext syntax with decorators ----

@observer class TodoView extends React.Component {
    render() {
        return <div>{this.props.todo.title}</div>
    }
}

// ---- or just use a stateless component function: ----

const TodoView = observer(({todo}) => <div>{todo.title}</div>)
```

### `Observer`

`Observer` is a React component, which applies `observer` to an anonymous region in your component.
It takes as children a single, argumentless function which should return exactly one React component.
The rendering in the function will be tracked and automatically re-rendered when needed.
This can come in handy when needing to pass render function to external components (for example the React Native listview), or if you
dislike the `observer` decorator / function.

```javascript
class App extends React.Component {
  render() {
     return (
         <div>
            {this.props.person.name}
            <Observer>
                {() => <div>{this.props.person.name}</div>}
            </Observer>
        </div>
     )
  }
}

const person = observable({ name: "John" })

React.render(<App person={person} />, document.body)
person.name = "Mike" // will cause the Observer region to re-render
```

In case you are a fan of render props, you can use that instead of children. Be advised, that you cannot use both approaches at once, children have a precedence.
Example

```javascript
class App extends React.Component {
  render() {
     return (
         <div>
            {this.props.person.name}
            <Observer
              render= {() => <div>{this.props.person.name}</div>}
            />
        </div>
     )
  }
}

const person = observable({ name: "John" })

React.render(<App person={person} />, document.body)
person.name = "Mike" // will cause the Observer region to re-render
```
Observer can also inject the stores simply by passing a selector function.
Example with inject

```javascript

const NameDisplayer = ({ name }) => <h1>{name}</h1>

const user = mobx.observable({
    name: "Noa"
})

const UserNameDisplayer = ()=>(
    <Observer
        inject={(stores)=>({user:stores.userStore})}
        render={props => (<NameDisplayer name={props.user.name}/>)}
    />
)

const App = () => (
    <Provider userStore={user}>
        <UserNameDisplayer />
    </Provider>
)
```

### Global error handler with `onError`

If a component throws an error, this logs to the console but does not 'crash' the app, so it might go unnoticed.
For this reason it is possible to attach a global error handler using `onError` to intercept any error thrown in the render of an `observer` component.
This can be used to hook up any client side error collection system.

### Server Side Rendering with `useStaticRendering`

When using server side rendering, normal lifecycle hooks of React components are not fired, as the components are rendered only once.
Since components are never unmounted, `observer` components would in this case leak memory when being rendered server side.
To avoid leaking memory, call `useStaticRendering(true)` when using server side rendering. This makes sure the component won't try to react to any future data changes.

### Which components should be marked with `observer`?

The simple rule of thumb is: _all components that render observable data_.
If you don't want to mark a component as observer, for example to reduce the dependencies of a generic component package, make sure you only pass it plain data.

### Enabling decorators (optional)

Decorators are currently a stage-2 ESNext feature. How to enable them is documented [here](https://github.com/mobxjs/mobx#enabling-decorators-optional).

### Should I still use smart and dumb components?

See this [thread](https://www.reddit.com/r/reactjs/comments/4vnxg5/free_eggheadio_course_learn_mobx_react_in_30/d61oh0l).
TL;DR: the conceptual distinction makes a lot of sense when using MobX as well, but use `observer` on all components.

### About `shouldComponentUpdate`

It is possible to set a custom `shouldComponentUpdate`, but in general this should be avoided as MobX will by default provide a highly optimized `shouldComponentUpdate` implementation, based on `PureRenderMixin`.
If a custom `shouldComponentUpdate` is provided, it is consulted when the props changes (because the parent passes new props) or the state changes (as a result of calling `setState`),
but if an observable used by the rendering is changed, the component will be re-rendered and `shouldComponentUpdate` is not consulted.

Since version 4, `mobx-react` will no longer trigger a re-rendering for non-observable objects that have been deeply changed.

### `componentWillReact` (lifecycle hook)

React components usually render on a fresh stack, so that makes it often hard to figure out what _caused_ a component to re-render.
When using `mobx-react` you can define a new life cycle hook, `componentWillReact` (pun intended) that will be triggered when a component is scheduled to be re-rendered because
data it observes has changed. This makes it easy to trace renders back to the action that caused the rendering.

```javascript
import {observer} from "mobx-react";

@observer class TodoView extends React.Component {
    componentWillReact() {
        console.log("I will re-render, since the todo has changed!");
    }

    render() {
        return <div>{this.props.todo.title}</div>
    }
}
```

* `componentWillReact` doesn't take arguments
* `componentWillReact` won't fire before the initial render (use `componentWillMount` instead)

### `PropTypes`

MobX-react provides the following additional `PropTypes` which can be used to validate against MobX structures:

* `observableArray`
* `observableArrayOf(React.PropTypes.number)`
* `observableMap`
* `observableObject`
* `arrayOrObservableArray`
* `arrayOrObservableArrayOf(React.PropTypes.number)`
* `objectOrObservableObject`

Use `import { PropTypes } from "mobx-react"` to import them, then use for example `PropTypes.observableArray`


### `Provider` and `inject`

`Provider` is a component that can pass stores (or other stuff) using React's context mechanism to child components.
This is useful if you have things that you don't want to pass through multiple layers of components explicitly.

`inject` can be used to pick up those stores. It is a higher order component that takes a list of strings and makes those stores available to the wrapped component.

Example (based on the official [context docs](https://facebook.github.io/react/docs/context.html#passing-info-automatically-through-a-tree)):

```javascript
@inject("color") @observer
class Button extends React.Component {
  render() {
    return (
      <button style={{background: this.props.color}}>
        {this.props.children}
      </button>
    );
  }
}

class Message extends React.Component {
  render() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
}

class MessageList extends React.Component {
  render() {
    const children = this.props.messages.map((message) =>
      <Message text={message.text} />
    );
    return <Provider color="red">
        <div>
            {children}
        </div>
    </Provider>;
  }
}
```

Notes:
* If a component asks for a store and receives a store via a property with the same name, the property takes precedence. Use this to your advantage when testing!
* If updates to an observable store are not triggering `render()`, make sure you are using Class methods for React lifecycle hooks such as `componentWillMount() {}`, using `componentWillMount = () => {}` will create a property on the instance and cause conflicts with mobx-react. See [mobx-react #195](https://github.com/mobxjs/mobx-react/issues/195) for more details.
* Values provided through `Provider` should be final, to avoid issues like mentioned in [React #2517](https://github.com/facebook/react/issues/2517) and [React #3973](https://github.com/facebook/react/pull/3973), where optimizations might stop the propagation of new context. Instead, make sure that if you put things in `context` that might change over time, that they are `@observable` or provide some other means to listen to changes, like callbacks. However, if your stores will change over time, like an observable value of another store, MobX will warn you. To suppress that warning explicitly, you can use `suppressChangedStoreWarning={true}` as a prop at your own risk.
* When using both `@inject` and `@observer`, make sure to apply them in the correct order: `observer` should be the inner decorator, `inject` the outer. There might be additional decorators in between.
* The original component wrapped by `inject` is available as the `wrappedComponent` property of the created higher order component.
* For mounted component instances, the wrapped component instance is available through the `wrappedInstance` property (except for stateless components).

#### Inject as function

The above example in ES5 would start like:

```javascript
var Button = inject("color")(observer(React.createClass({
    /* ... etc ... */
})))
```

A functional stateless component would look like:

```javascript
var Button = inject("color")(observer(({ color }) => {
    /* ... etc ... */
}))
```

#### Customizing inject

Instead of passing a list of store names, it is also possible to create a custom mapper function and pass it to inject.
The mapper function receives all stores as argument, the properties with which the components are invoked and the context, and should produce a new set of properties,
that are mapped into the original:

`mapperFunction: (allStores, props, context) => additionalProps`

Since version 4.0 the `mapperFunction` itself is tracked as well, so it is possible to do things like:

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

_N.B. note that in this *specific* case neither `NameDisplayer` nor `UserNameDisplayer` needs to be decorated with `observer`, since the observable dereferencing is done in the mapper function_

#### Using `propTypes` and `defaultProps` and other static properties in combination with `inject`

Inject wraps a new component around the component you pass into it.
This means that assigning a static property to the resulting component, will be applied to the HoC, and not to the original component.
So if you take the following example:

```javascript
const UserName = inject("userStore")(({ userStore, bold }) => someRendering())

UserName.propTypes = {
    bold: PropTypes.boolean.isRequired,
    userStore: PropTypes.object.isRequired // will always fail
}
```

The above propTypes are incorrect, `bold` needs to be provided by the caller of the `UserName` component and is checked by React.
However, `userStore` does not need to be required! Although it is required for the original stateless function component, it is not
required for the resulting inject component. After all, the whole point of that component is to provide that `userStore` itself.

So if you want to make assertions on the data that is being injected (either stores or data resulting from a mapper function), the propTypes
should be defined on the _wrapped_ component. Which is available through the static property `wrappedComponent` on the inject component:

```javascript
const UserName = inject("userStore")(({ userStore, bold }) => someRendering())

UserName.propTypes = {
    bold: PropTypes.boolean.isRequired // could be defined either here ...
}

UserName.wrappedComponent.propTypes = {
    // ... or here
    userStore: PropTypes.object.isRequired // correct
}
```

The same principle applies to `defaultProps` and other static React properties.
Note that it is not allowed to redefine `contextTypes` on `inject` components (but is possible to define it on `wrappedComponent`)

Finally, mobx-react will automatically move non React related static properties from wrappedComponent to the inject component so that all static fields are
actually available to the outside world without needing `.wrappedComponent`.

#### Strongly typing inject

##### With TypeScript

`inject` also accepts a function (`(allStores, nextProps, nextContext) => additionalProps`) that can be used to pick all the desired stores from the available stores like this.
The `additionalProps` will be merged into the original `nextProps` before being provided to the next component.

```typescript
import {IUserStore} from "myStore"

@inject((allStores) => ({
    userStore: allStores.userStore as IUserStore
}))
class MyComponent extends React.Component<{ userStore?: IUserStore; otherProp: number }, {}> {
    /* etc */
}
```

Make sure to mark `userStore` as an optional property. It should not (necessarily) be passed in by parent components at all!

Note: If you have strict null checking enabled, you could muffle the nullable type by using the `!` operator:

```
public render() {
   const {a, b} = this.store!
   // ...
}
```

##### With Flow

Currently, there is a community-discussion around the best way to use `inject` with Flow. Join the discussion at [this gist](https://gist.github.com/vonovak/29c972c6aa9efbb7d63a6853d021fba9).

#### Testing store injection

It is allowed to pass any declared store in directly as a property as well. This makes it easy to set up individual component tests without a provider.

So if you have in your app something like:
```javascript
<Provider profile={profile}>
    <Person age={'30'} />
</Provider>
```

In your test you can easily test the `Person` component by passing the necessary store as prop directly:
```
const profile = new Profile()
const mountedComponent = mount(
   <Person age={'30'} profile={profile} />
)
```

Bear in mind that using shallow rendering won't provide any useful results when testing injected components; only the injector will be rendered.
To test with shallow rendering, instantiate the `wrappedComponent` instead: `shallow(<Person.wrappedComponent />)`

## FAQ

**Should I use `observer` for each component?**

You should use `observer` on every component that displays observable data.
Even the small ones. `observer` allows components to render independently from their parent and in general this means that
the more you use `observer`, the better the performance become.
The overhead of `observer` itself is neglectable.
See also [Do child components need `@observer`?](https://github.com/mobxjs/mobx/issues/101)


**I see React warnings about `forceUpdate` / `setState` from React**

The following warning will appear if you trigger a re-rendering between instantiating and rendering a component:

```
Warning: forceUpdate(...): Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state.`
```
-- or --
```
Warning: setState(...): Cannot update during an existing state transition (such as within `render` or another component's constructor). Render methods should be a pure function of props and state; constructor side-effects are an anti-pattern, but can be moved to `componentWillMount`.
```

Usually this means that (another) component is trying to modify observables used by this components in their `constructor` or `getInitialState` methods.
This violates the React Lifecycle, `componentWillMount` should be used instead if state needs to be modified before mounting.

## Internal DevTools Api

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

WeakMap. Its `get` function returns the associated reactive component of the given node. The node needs to be precisely the root node of the component.
This map is only available after invoking `trackComponents`.


