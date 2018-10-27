import createClass from "create-react-class"
import * as mobx from "mobx"
import React, { Component } from "react"
import TestUtils from "react-dom/test-utils"
import { inject, observer, Observer, onError, Provider, useStaticRendering } from "../src"
import { asyncReactDOMRender, createTestRoot, sleepHelper, withAsyncConsole, withConsole } from "./"

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
    let todoListWillReactCount = 0
    const TodoList = observer(
        createClass({
            renderings: 0,
            componentWillReact() {
                todoListWillReactCount++
            },
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
        expect(todoListWillReactCount).toBe(0)
        expect(testRoot.querySelectorAll("li").length).toBe(1)
        expect(testRoot.querySelector("li").innerHTML).toBe("|a")
        expect(todoItemRenderings).toBe(1)
    })

    test("second rendering with inner store changed", () => {
        store.todos[0].title += "a"
        expect(todoListRenderings).toBe(1)
        expect(todoListWillReactCount).toBe(0)
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
        expect(todoListWillReactCount).toBe(1)
        expect(todoItemRenderings).toBe(3)
        expect(getDNode(store.todos[1], "title").observers.size).toBe(1)
        expect(getDNode(store.todos[1], "completed").observers.size).toBe(0)
    })

    test("rerendering with outer store pop", () => {
        const oldTodo = store.todos.pop()
        expect(todoListRenderings).toBe(3)
        expect(todoListWillReactCount).toBe(2)
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
    const element = TestUtils.renderIntoDocument(<TestComponent />)

    test("init state", () => {
        expect(yCalcCount).toBe(1)
        expect(TestUtils.findRenderedDOMComponentWithTag(element, "div").innerHTML).toBe("hi6")
    })

    test("rerender should not need a recomputation of data.y", () => {
        data.z = "hello"
        expect(yCalcCount).toBe(1)
        expect(TestUtils.findRenderedDOMComponentWithTag(element, "div").innerHTML).toBe("hello6")
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
    const element = TestUtils.renderIntoDocument(<TestComponent />)

    afterAll(() => {
        useStaticRendering(false)
    })

    test("init state is correct", () => {
        expect(renderCount).toBe(1)
        expect(TestUtils.findRenderedDOMComponentWithTag(element, "div").innerHTML).toBe("hi")
    })

    test("no re-rendering on static rendering", () => {
        data.z = "hello"
        expect(renderCount).toBe(1)
        expect(TestUtils.findRenderedDOMComponentWithTag(element, "div").innerHTML).toBe("hi")
        expect(getDNode(data, "z").observers.size).toBe(0)
    })
})

describe("issue 12", () => {
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
        return (
            <div>
                {data.items.map(item => (
                    <Row key={item.name} item={item} />
                ))}
            </div>
        )
    })

    beforeAll(async done => {
        await asyncReactDOMRender(<Table />, testRoot)
        done()
    })

    test("init state is correct", () => {
        expect([].map.call(testRoot.querySelectorAll("span"), tag => tag.innerHTML).sort()).toEqual(
            ["coffee!", "tea"].sort()
        )
    })

    test("run transaction", () => {
        mobx.transaction(() => {
            data.items[1].name = "boe"
            data.items.splice(0, 2, { name: "soup" })
            data.selected = "tea"
        })
        expect([].map.call(testRoot.querySelectorAll("span"), tag => tag.innerHTML).sort()).toEqual(
            ["soup"]
        )
    })
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

test("component should not be inject", () => {
    const msg = []
    const baseWarn = console.warn
    console.warn = m => msg.push(m)

    observer(
        inject("foo")(
            createClass({
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            })
        )
    )

    expect(msg.length).toBe(1)
    console.warn = baseWarn
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
test.skip("should stop updating if error was thrown in render (#134)", () => {
    const data = mobx.observable.box(0)
    let renderingsCount = 0

    const Comp = observer(function() {
        renderingsCount += 1
        if (data.get() === 2) {
            throw new Error("Hello")
        }
        return <div />
    })

    TestUtils.renderIntoDocument(<Comp />)
    expect(data.observers.size).toBe(1)
    data.set(1)
    expect(data.set(2)).toThrow("Hello")
    expect(data.observers.size).toBe(0)
    data.set(3)
    data.set(4)
    data.set(5)
    expect(renderingsCount).toBe(3)
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

describe("it rerenders correctly if some props are non-observables - 1", () => {
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
        data.y++
        odata.x++
    }

    beforeAll(async done => {
        await asyncReactDOMRender(<Parent odata={odata} data={data} />, testRoot)
        done()
    })

    test("init renderCount === 1", () => {
        expect(testRoot.querySelector("span").innerHTML).toBe("1-1-1")
    })

    test("after click renderCount === 2", async () => {
        testRoot.querySelector("span").click()
        await sleepHelper(10)
        expect(testRoot.querySelector("span").innerHTML).toBe("2-2-2")
    })

    test("after click twice renderCount === 3", async () => {
        testRoot.querySelector("span").click()
        await sleepHelper(10)
        expect(testRoot.querySelector("span").innerHTML).toBe("3-3-3")
    })
})

describe("it rerenders correctly if some props are non-observables - 2", () => {
    let renderCount = 0
    let odata = mobx.observable({ x: 1 })

    @observer
    class Component extends React.Component {
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

    beforeAll(async done => {
        await asyncReactDOMRender(<Parent odata={odata} />, testRoot)
        done()
    })

    test("init renderCount === 1", () => {
        expect(renderCount).toBe(1)
        expect(testRoot.querySelector("span").innerHTML).toBe("1-1")
    })

    test("after click renderCount === 2", async () => {
        testRoot.querySelector("span").click()
        await sleepHelper(100)
        expect(renderCount).toBe(2)
        expect(testRoot.querySelector("span").innerHTML).toBe("2-2")
    })

    test("after click renderCount === 3", async () => {
        testRoot.querySelector("span").click()
        await sleepHelper(10)
        expect(renderCount).toBe(3)
        expect(testRoot.querySelector("span").innerHTML).toBe("3-3")
    })
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

describe("Observer should not re-render on shallow equal new props", () => {
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

    beforeAll(async () => {
        await asyncReactDOMRender(<Parent />, testRoot)
    })

    test("init state is correct", () => {
        expect(parentRendering).toBe(1)
        expect(childRendering).toBe(1)
        expect(testRoot.querySelector("span").innerHTML).toBe("1")
    })

    test("after odata change", async () => {
        odata.y++
        sleepHelper(10)
        expect(parentRendering).toBe(2)
        expect(childRendering).toBe(1)
        expect(testRoot.querySelector("span").innerHTML).toBe("1")
    })
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

describe("206 - @observer should produce usefull errors if it throws", () => {
    const data = mobx.observable({ x: 1 })
    let renderCount = 0

    const emmitedErrors = []
    const disposeErrorsHandler = onError(error => {
        emmitedErrors.push(error)
    })

    @observer
    class Child extends React.Component {
        render() {
            renderCount++
            if (data.x === 42) throw new Error("Oops!")
            return <span>{data.x}</span>
        }
    }

    beforeAll(async done => {
        await asyncReactDOMRender(<Child />, testRoot)
        done()
    })

    test("init renderCount should === 1", () => {
        expect(renderCount).toBe(1)
    })

    test("catch exception", () => {
        expect(() => {
            withConsole(() => {
                data.x = 42
            })
        }).toThrow(/Oops!/)
        expect(renderCount).toBe(3) // React fiber will try to replay the rendering, so the exception gets thrown a second time
    })

    test("component recovers!", async () => {
        await sleepHelper(500)
        data.x = 3
        TestUtils.renderIntoDocument(<Child />)
        expect(renderCount).toBe(4)
        expect(emmitedErrors).toEqual([new Error("Oops!"), new Error("Oops!")]) // see above comment
    })
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

test.skip("195 - should throw if trying to overwrite lifecycle methods", () => {
    // Test disabled, see #231...

    @observer
    class WillMount extends React.Component {
        componentWillMount = () => {}

        render() {
            return null
        }
    }
    expect(TestUtils.renderIntoDocument(<WillMount />)).toThrow(
        /Cannot assign to read only property 'componentWillMount'/
    )
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

    test("use render with inject should be correct", async () => {
        const Comp = () => (
            <div>
                <Observer
                    inject={store => ({ h: store.h, w: store.w })}
                    render={props => <span>{`${props.h} ${props.w}`}</span>}
                />
            </div>
        )
        const A = () => (
            <Provider h="hello" w="world">
                <Comp />
            </Provider>
        )

        expect(
            await withAsyncConsole(async () => {
                await asyncReactDOMRender(<A />, testRoot)
                expect(testRoot.querySelector("span").innerHTML).toBe("hello world")
            })
        ).toMatchSnapshot()
    })

    test("use children with inject should be correct", async () => {
        const Comp = () => (
            <div>
                <Observer inject={store => ({ h: store.h, w: store.w })}>
                    {props => <span>{`${props.h} ${props.w}`}</span>}
                </Observer>
            </div>
        )
        const A = () => (
            <Provider h="hello" w="world">
                <Comp />
            </Provider>
        )
        expect(
            await withAsyncConsole(async () => {
                await asyncReactDOMRender(<A />, testRoot)
                expect(testRoot.querySelector("span").innerHTML).toBe("hello world")
            })
        ).toMatchSnapshot()
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

test("don't use PureComponent", () => {
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

        expect(msg).toEqual([
            "Mobx observer: You are using 'observer' on React.PureComponent. These two achieve two opposite goals and should not be used together"
        ])
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
