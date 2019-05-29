import createClass from "create-react-class"
import * as mobx from "mobx"
import React, { Component } from "react"
import TestUtils from "react-dom/test-utils"
import { inject, observer, Observer, useStaticRendering } from "../src"
import { asyncReactDOMRender, createTestRoot, sleepHelper, withConsole } from "./"
import renderer, { act } from "react-test-renderer"

/**
 *  some test suite is too tedious
 */

const testRoot = createTestRoot()

const getDNode = (obj, prop) => mobx._getAdministration(obj, prop)

/*
 use TestUtils.renderIntoDocument  will re-mounted the component  with with different props
 some misunderstanding will be cause？
*/
describe("nestedRendering", async () => {
    const testRoot = createTestRoot()

    // init element
    const store = mobx.observable({
        todos: [
            {
                title: "a",
                completed: false
            }
        ]
    })

    let todoItemRenderings = 0
    const TodoItem = observer(function TodoItem(props) {
        todoItemRenderings++
        return <li>|{props.todo.title}</li>
    })

    let todoListRenderings = 0
    const TodoList = observer(
        createClass({
            renderings: 0,
            render() {
                todoListRenderings++
                const todos = store.todos
                return (
                    <div>
                        <span>{todos.length}</span>
                        {todos.map((todo, idx) => (
                            <TodoItem key={idx} todo={todo} />
                        ))}
                    </div>
                )
            }
        })
    )
    beforeAll(async done => {
        // the side-effect in  does not views alive when using static rendering test suite
        useStaticRendering(false)
        await asyncReactDOMRender(<TodoList />, testRoot)
        done()
    })

    test("first rendering", () => {
        expect(todoListRenderings).toBe(1)
        expect(testRoot.querySelectorAll("li").length).toBe(1)
        expect(testRoot.querySelector("li").innerHTML).toBe("|a")
        expect(todoItemRenderings).toBe(1)
    })

    test("second rendering with inner store changed", () => {
        store.todos[0].title += "a"
        expect(todoListRenderings).toBe(1)
        expect(todoItemRenderings).toBe(2)
        expect(getDNode(store, "todos").observers.size).toBe(1)
        expect(getDNode(store.todos[0], "title").observers.size).toBe(1)
    })

    test("rerendering with outer store added", () => {
        store.todos.push({
            title: "b",
            completed: true
        })
        expect(testRoot.querySelectorAll("li").length).toBe(2)
        expect(
            Array.from(testRoot.querySelectorAll("li"))
                .map(e => e.innerHTML)
                .sort()
        ).toEqual(["|aa", "|b"].sort())
        expect(todoListRenderings).toBe(2)
        expect(todoItemRenderings).toBe(3)
        expect(getDNode(store.todos[1], "title").observers.size).toBe(1)
        expect(getDNode(store.todos[1], "completed").observers.size).toBe(0)
    })

    test("rerendering with outer store pop", () => {
        const oldTodo = store.todos.pop()
        expect(todoListRenderings).toBe(3)
        expect(todoItemRenderings).toBe(3)
        expect(testRoot.querySelectorAll("li").length).toBe(1)
        expect(getDNode(oldTodo, "title").observers.size).toBe(0)
        expect(getDNode(oldTodo, "completed").observers.size).toBe(0)
    })
})

describe("isObjectShallowModified detects when React will update the component", () => {
    const store = mobx.observable({ count: 0 })
    let counterRenderings = 0
    const Counter = observer(function TodoItem() {
        counterRenderings++
        return <div>{store.count}</div>
    })

    beforeAll(done => {
        useStaticRendering(false)
        done()
    })

    test("does not assume React will update due to NaN prop", async done => {
        await asyncReactDOMRender(<Counter value={NaN} />, testRoot)
        store.count++
        expect(counterRenderings).toBe(2)
        done()
    })
})

describe("keep views alive", () => {
    let yCalcCount = 0
    const data = mobx.observable({
        x: 3,
        get y() {
            yCalcCount++
            return this.x * 2
        },
        z: "hi"
    })
    const TestComponent = observer(function testComponent() {
        return (
            <div>
                {data.z}
                {data.y}
            </div>
        )
    })

    beforeAll(async () => {
        await asyncReactDOMRender(<TestComponent />, testRoot)
    })

    test("init state", () => {
        expect(yCalcCount).toBe(1)
        expect(testRoot.querySelector("div").innerHTML).toBe("hi6")
    })

    test("rerender should not need a recomputation of data.y", () => {
        data.z = "hello"
        expect(yCalcCount).toBe(1)
        expect(testRoot.querySelector("div").innerHTML).toBe("hello6")
    })
})

describe("does not views alive when using static rendering", () => {
    useStaticRendering(true)
    let renderCount = 0
    const data = mobx.observable({
        z: "hi"
    })

    const TestComponent = observer(function testComponent() {
        renderCount++
        return <div>{data.z}</div>
    })

    beforeAll(async () => {
        await asyncReactDOMRender(<TestComponent />, testRoot)
    })

    afterAll(() => {
        useStaticRendering(false)
    })

    test("init state is correct", () => {
        expect(renderCount).toBe(1)
        expect(testRoot.querySelector("div").innerHTML).toBe("hi")
    })

    test("no re-rendering on static rendering", () => {
        data.z = "hello"
        expect(getDNode(data, "z").observers.size).toBe(0)
        expect(renderCount).toBe(1)
        expect(testRoot.querySelector("div").innerHTML).toBe("hi")
    })
})

test("issue 12", () => {
    const events = []
    const data = mobx.observable({
        selected: "coffee",
        items: [
            {
                name: "coffee"
            },
            {
                name: "tea"
            }
        ]
    })

    /** Row Class */
    class Row extends Component {
        constructor(props) {
            super(props)
        }

        render() {
            events.push("row: " + this.props.item.name)
            return (
                <span>
                    {this.props.item.name}
                    {data.selected === this.props.item.name ? "!" : ""}
                </span>
            )
        }
    }
    /** table stateles component */
    const Table = observer(function table() {
        events.push("table")
        JSON.stringify(data)
        return (
            <div>
                {data.items.map(item => (
                    <Row key={item.name} item={item} />
                ))}
            </div>
        )
    })

    const wrapper = renderer.create(<Table />)
    expect(wrapper.toJSON()).toMatchSnapshot()

    act(() => {
        mobx.transaction(() => {
            data.items[1].name = "boe"
            data.items.splice(0, 2, { name: "soup" })
            data.selected = "tea"
        })
    })
    expect(wrapper.toJSON()).toMatchSnapshot()
    expect(events).toEqual(["table", "row: coffee", "row: tea", "table", "row: soup"])
})

test("changing state in render should fail", () => {
    const data = mobx.observable.box(2)
    const Comp = observer(() => {
        if (data.get() === 3) {
            try {
                data.set(4) // wouldn't throw first time for lack of observers.. (could we tighten this?)
            } catch (err) {
                expect(
                    /Side effects like changing state are not allowed at this point/.test(err)
                ).toBeTruthy()
            }
        }
        return <div>{data.get()}</div>
    })
    TestUtils.renderIntoDocument(<Comp />)

    data.set(3)
    mobx._resetGlobalState()
})

test("observer component can be injected", () => {
    const msg = []
    const baseWarn = console.warn
    console.warn = m => msg.push(m)

    inject("foo")(
        observer(
            createClass({
                render: () => null
            })
        )
    )

    // N.B, the injected component will be observer since mobx-react 4.0!
    inject(() => {})(
        observer(
            createClass({
                render: () => null
            })
        )
    )

    expect(msg.length).toBe(0)
    console.warn = baseWarn
})

test("correctly wraps display name of child component", () => {
    const A = observer(
        createClass({
            displayName: "ObserverClass",
            render: () => null
        })
    )
    const B = observer(function StatelessObserver() {
        return null
    })

    const wrapper = renderer.create(<A />)
    expect(wrapper.root.type.displayName).toEqual("ObserverClass")

    const wrapper2 = renderer.create(<B />)
    expect(wrapper2.root.type.displayName).toEqual("StatelessObserver")
})

describe("124 - react to changes in this.props via computed", () => {
    const Comp = observer(
        createClass({
            componentWillMount() {
                mobx.extendObservable(this, {
                    get computedProp() {
                        return this.props.x
                    }
                })
            },
            render() {
                return (
                    <span>
                        x:
                        {this.computedProp}
                    </span>
                )
            }
        })
    )

    const Parent = createClass({
        getInitialState() {
            return { v: 1 }
        },
        render() {
            return (
                <div onClick={() => this.setState({ v: 2 })}>
                    <Comp x={this.state.v} />
                </div>
            )
        }
    })

    beforeAll(async done => {
        await asyncReactDOMRender(<Parent />, testRoot)
        done()
    })

    test("init state is correct", () => {
        expect(testRoot.querySelector("span").innerHTML).toBe("x:1")
    })

    test("change after click", async () => {
        testRoot.querySelector("div").click()
        await sleepHelper(100)
        expect(testRoot.querySelector("span").innerHTML).toBe("x:2")
    })
})

// Test on skip: since all reactions are now run in batched updates, the original issues can no longer be reproduced
//this test case should be deprecated?
test("should stop updating if error was thrown in render (#134)", () => {
    const data = mobx.observable.box(0)
    let renderingsCount = 0
    let lastOwnRenderCount = 0
    const errors = []

    class Outer extends React.Component {
        state = { hasError: false }

        render() {
            return this.state.hasError ? <div>Error!</div> : <div>{this.props.children}</div>
        }

        static getDerivedStateFromError() {
            return { hasError: true }
        }

        componentDidCatch(error, info) {
            errors.push(error.toString().split("\n")[0], info)
        }
    }

    const Comp = observer(
        class X extends React.Component {
            ownRenderCount = 0

            render() {
                lastOwnRenderCount = ++this.ownRenderCount
                renderingsCount++
                if (data.get() === 2) {
                    throw new Error("Hello")
                }
                return <div />
            }
        }
    )

    withConsole(() => {
        TestUtils.renderIntoDocument(
            <Outer>
                <Comp />
            </Outer>
        )
        expect(data.observers.size).toBe(1)
        data.set(1)
        expect(renderingsCount).toBe(2)
        expect(lastOwnRenderCount).toBe(2)
        data.set(2)
        expect(data.observers.size).toBe(0)
        data.set(3)
        data.set(4)
        data.set(2)
        data.set(5)
        expect(errors).toMatchSnapshot()
        expect(lastOwnRenderCount).toBe(4)
        expect(renderingsCount).toBe(4)
    })
})

describe("should render component even if setState called with exactly the same props", () => {
    let renderCount = 0
    const Component = observer(
        createClass({
            onClick() {
                this.setState({})
            },
            render() {
                renderCount++
                return <div onClick={this.onClick} id="clickableDiv" />
            }
        })
    )

    beforeAll(async done => {
        await asyncReactDOMRender(<Component />, testRoot)
        done()
    })

    test("renderCount === 1", () => {
        expect(renderCount).toBe(1)
    })

    test("after click once renderCount === 2", async () => {
        testRoot.querySelector("#clickableDiv").click()
        sleepHelper(10)
        expect(renderCount).toBe(2)
    })

    test("after click twice renderCount === 3", async () => {
        testRoot.querySelector("#clickableDiv").click()
        sleepHelper(10)
        expect(renderCount).toBe(3)
    })
})

test("it rerenders correctly if some props are non-observables - 1", () => {
    let renderCount = 0
    let odata = mobx.observable({ x: 1 })
    let data = { y: 1 }

    @observer
    class Component extends React.Component {
        @mobx.computed
        get computed() {
            // n.b: data.y would not rerender! shallowly new equal props are not stored
            return this.props.odata.x
        }
        render() {
            renderCount++
            return (
                <span onClick={stuff}>
                    {this.props.odata.x}-{this.props.data.y}-{this.computed}
                </span>
            )
        }
    }

    const Parent = observer(
        createClass({
            render() {
                // this.props.odata.x;
                return <Component data={this.props.data} odata={this.props.odata} />
            }
        })
    )

    function stuff() {
        act(() => {
            data.y++
            odata.x++
        })
    }

    const wrapper = renderer.create(<Parent odata={odata} data={data} />)

    const contents = () => wrapper.toTree().rendered.rendered.rendered.rendered.rendered.join("")

    expect(contents()).toEqual("1-1-1")
    stuff()
    expect(contents()).toEqual("2-2-2")
    stuff()
    expect(contents()).toEqual("3-3-3")
})

test("it rerenders correctly if some props are non-observables - 2", () => {
    let renderCount = 0
    let odata = mobx.observable({ x: 1 })

    @observer
    class Component extends React.PureComponent {
        @mobx.computed
        get computed() {
            return this.props.data.y // should recompute, since props.data is changed
        }

        render() {
            renderCount++
            return (
                <span onClick={stuff}>
                    {this.props.data.y}-{this.computed}
                </span>
            )
        }
    }

    const Parent = observer(props => {
        let data = { y: props.odata.x }
        return <Component data={data} odata={props.odata} />
    })

    function stuff() {
        odata.x++
    }

    mobx.reaction(
        () => odata.x,
        v => {
            // console.log(v)
        }
    )

    const wrapper = renderer.create(<Parent odata={odata} />)

    const contents = () => wrapper.toTree().rendered.rendered.rendered.rendered.join("")

    expect(renderCount).toBe(1)
    expect(contents()).toBe("1-1")

    act(() => stuff())
    expect(renderCount).toBe(2)
    expect(contents()).toBe("2-2")

    act(() => stuff())
    expect(renderCount).toBe(3)
    expect(contents()).toBe("3-3")
})

describe("Observer regions should react", () => {
    const data = mobx.observable.box("hi")
    const Comp = () => (
        <div>
            <Observer>{() => <span>{data.get()}</span>}</Observer>
            <li>{data.get()}</li>
        </div>
    )

    beforeAll(async done => {
        await asyncReactDOMRender(<Comp />, testRoot)
        done()
    })

    test("init state is correct", () => {
        expect(testRoot.querySelector("span").innerHTML).toBe("hi")
        expect(testRoot.querySelector("li").innerHTML).toBe("hi")
    })

    test("set the data to hello", async () => {
        data.set("hello")
        await sleepHelper(10)
        expect(testRoot.querySelector("span").innerHTML).toBe("hello")
        expect(testRoot.querySelector("li").innerHTML).toBe("hi")
    })
})

test("Observer should not re-render on shallow equal new props", () => {
    let childRendering = 0
    let parentRendering = 0
    const data = { x: 1 }
    const odata = mobx.observable({ y: 1 })

    const Child = observer(({ data }) => {
        childRendering++
        return <span>{data.x}</span>
    })
    const Parent = observer(() => {
        parentRendering++
        odata.y /// depend
        return <Child data={data} />
    })

    const wrapper = renderer.create(<Parent />)

    const contents = () => wrapper.toTree().rendered.rendered.rendered.join("")

    expect(parentRendering).toBe(1)
    expect(childRendering).toBe(1)
    expect(contents()).toBe("1")

    act(() => {
        odata.y++
    })
    expect(parentRendering).toBe(2)
    expect(childRendering).toBe(1)
    expect(contents()).toBe("1")
})

test("parent / childs render in the right order", done => {
    // See: https://jsfiddle.net/gkaemmer/q1kv7hbL/13/
    let events = []

    class User {
        @mobx.observable
        name = "User's name"
    }

    class Store {
        @mobx.observable
        user = new User()
        @mobx.action
        logout() {
            this.user = null
        }
    }

    function tryLogout() {
        try {
            // ReactDOM.unstable_batchedUpdates(() => {
            store.logout()
            expect(true).toBeTruthy(true)
            // });
        } catch (e) {
            // t.fail(e)
        }
    }

    const store = new Store()

    const Parent = observer(() => {
        events.push("parent")
        if (!store.user) return <span>Not logged in.</span>
        return (
            <div>
                <Child />
                <button onClick={tryLogout}>Logout</button>
            </div>
        )
    })

    const Child = observer(() => {
        events.push("child")
        return <span>Logged in as: {store.user.name}</span>
    })

    const container = TestUtils.renderIntoDocument(<Parent />)

    tryLogout()
    expect(events).toEqual(["parent", "child", "parent"])
    done()
})

test("195 - async componentWillMount does not work", async () => {
    const renderedValues = []

    @observer
    class WillMount extends React.Component {
        @mobx.observable
        counter = 0

        @mobx.action
        inc = () => this.counter++

        componentWillMount() {
            setTimeout(() => this.inc(), 300)
        }

        render() {
            renderedValues.push(this.counter)
            return (
                <p>
                    {this.counter}
                    <button onClick={this.inc}>+</button>
                </p>
            )
        }
    }
    TestUtils.renderIntoDocument(<WillMount />)

    await sleepHelper(500)
    expect(renderedValues).toEqual([0, 1])
})

describe("use Observer inject and render sugar should work  ", () => {
    test("use render without inject should be correct", async () => {
        const Comp = () => (
            <div>
                <Observer render={props => <span>{123}</span>} />
            </div>
        )
        await asyncReactDOMRender(<Comp />, testRoot)
        expect(testRoot.querySelector("span").innerHTML).toBe("123")
    })

    test("use children without inject should be correct", async () => {
        const Comp = () => (
            <div>
                <Observer>{props => <span>{123}</span>}</Observer>
            </div>
        )
        await asyncReactDOMRender(<Comp />, testRoot)
        expect(testRoot.querySelector("span").innerHTML).toBe("123")
    })

    test("show error when using children and render at same time ", async () => {
        const msg = []
        const baseError = console.error
        console.error = m => msg.push(m)

        const Comp = () => (
            <div>
                <Observer render={() => <span>{123}</span>}>{() => <span>{123}</span>}</Observer>
            </div>
        )

        await asyncReactDOMRender(<Comp />, testRoot)
        expect(msg.length).toBe(1)
        console.error = baseError
    })
})

test("use PureComponent", () => {
    const msg = []
    const baseWarn = console.warn
    console.warn = m => msg.push(m)

    try {
        observer(
            class X extends React.PureComponent {
                return() {
                    return <div />
                }
            }
        )

        expect(msg).toEqual([])
    } finally {
        console.warn = baseWarn
    }
})

test("static on function components are hoisted", () => {
    const Comp = () => <div />
    Comp.foo = 3

    const Comp2 = observer(Comp)

    expect(Comp2.foo).toBe(3)
})

test("computed properties react to props", async () => {
    const seen = []
    @observer
    class Child extends React.Component {
        @mobx.computed
        get getPropX() {
            return this.props.x
        }

        render() {
            seen.push(this.getPropX)
            return <div>{this.getPropX}</div>
        }
    }

    class Parent extends React.Component {
        state = { x: 0 }
        render() {
            seen.push("parent")
            return <Child x={this.state.x} />
        }

        componentDidMount() {
            setTimeout(() => this.setState({ x: 2 }), 100)
        }
    }

    const wrapper = renderer.create(<Parent />)
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  0
</div>
`)

    await sleepHelper(200)
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  2
</div>
`)

    expect(seen).toEqual(["parent", 0, "parent", 2])
})
