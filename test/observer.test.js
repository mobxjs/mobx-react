import React, { Component } from "react"
import { inject, observer, Observer, useStaticRendering } from "../src"
import { withConsole } from "./"
import renderer, { act } from "react-test-renderer"
import { render } from "@testing-library/react"
import * as mobx from "mobx"

/**
 *  some test suite is too tedious
 */

const getDNode = (obj, prop) => mobx._getAdministration(obj, prop)

/*
 use TestUtils.renderIntoDocument will re-mounted the component with different props
 some misunderstanding will be cause？
*/
describe("nestedRendering", () => {
    let store

    let todoItemRenderings
    const TodoItem = observer(function TodoItem(props) {
        todoItemRenderings++
        return <li>|{props.todo.title}</li>
    })

    let todoListRenderings
    const TodoList = observer(
        class TodoList extends Component {
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
        }
    )

    beforeEach(() => {
        todoItemRenderings = 0
        todoListRenderings = 0
        store = mobx.observable({
            todos: [
                {
                    title: "a",
                    completed: false
                }
            ]
        })
    })

    test("first rendering", () => {
        const { container } = render(<TodoList />)

        expect(todoListRenderings).toBe(1)
        expect(container.querySelectorAll("li").length).toBe(1)
        expect(container.querySelector("li")).toHaveTextContent("|a")
        expect(todoItemRenderings).toBe(1)
    })

    test("second rendering with inner store changed", () => {
        render(<TodoList />)

        store.todos[0].title += "a"

        expect(todoListRenderings).toBe(1)
        expect(todoItemRenderings).toBe(2)
        expect(getDNode(store, "todos").observers.size).toBe(1)
        expect(getDNode(store.todos[0], "title").observers.size).toBe(1)
    })

    test("rerendering with outer store added", () => {
        const { container } = render(<TodoList />)

        store.todos.push({
            title: "b",
            completed: true
        })

        expect(container.querySelectorAll("li").length).toBe(2)
        expect(
            Array.from(container.querySelectorAll("li"))
                .map(e => e.innerHTML)
                .sort()
        ).toEqual(["|a", "|b"].sort())
        expect(todoListRenderings).toBe(2)
        expect(todoItemRenderings).toBe(2)
        expect(getDNode(store.todos[1], "title").observers.size).toBe(1)
        expect(getDNode(store.todos[1], "completed").observers.size).toBe(0)
    })

    test("rerendering with outer store pop", () => {
        const { container } = render(<TodoList />)

        const oldTodo = store.todos.pop()

        expect(todoListRenderings).toBe(2)
        expect(todoItemRenderings).toBe(1)
        expect(container.querySelectorAll("li").length).toBe(0)
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

    test("does not assume React will update due to NaN prop", () => {
        render(<Counter value={NaN} />)

        store.count++

        expect(counterRenderings).toBe(2)
    })
})

describe("keep views alive", () => {
    let yCalcCount
    let data
    const TestComponent = observer(function testComponent() {
        return (
            <div>
                {data.z}
                {data.y}
            </div>
        )
    })

    beforeEach(() => {
        yCalcCount = 0
        data = mobx.observable({
            x: 3,
            get y() {
                yCalcCount++
                return this.x * 2
            },
            z: "hi"
        })
    })

    test("init state", () => {
        const { container } = render(<TestComponent />)

        expect(yCalcCount).toBe(1)
        expect(container).toHaveTextContent("hi6")
    })

    test("rerender should not need a recomputation of data.y", () => {
        const { container } = render(<TestComponent />)

        data.z = "hello"

        expect(yCalcCount).toBe(1)
        expect(container).toHaveTextContent("hello6")
    })
})

describe("does not views alive when using static rendering", () => {
    let renderCount
    let data

    const TestComponent = observer(function testComponent() {
        renderCount++
        return <div>{data.z}</div>
    })

    beforeAll(() => {
        useStaticRendering(true)
    })

    beforeEach(() => {
        renderCount = 0
        data = mobx.observable({
            z: "hi"
        })
    })

    afterAll(() => {
        useStaticRendering(false)
    })

    test("init state is correct", () => {
        const { container } = render(<TestComponent />)

        expect(renderCount).toBe(1)
        expect(container).toHaveTextContent("hi")
    })

    test("no re-rendering on static rendering", () => {
        const { container } = render(<TestComponent />)

        data.z = "hello"

        expect(getDNode(data, "z").observers.size).toBe(0)
        expect(renderCount).toBe(1)
        expect(container).toHaveTextContent("hi")
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
    render(<Comp />)

    data.set(3)
    mobx._resetGlobalState()
})

test("observer component can be injected", () => {
    const msg = []
    const baseWarn = console.warn
    console.warn = m => msg.push(m)

    inject("foo")(
        observer(
            class T extends Component {
                render() {
                    return null
                }
            }
        )
    )

    // N.B, the injected component will be observer since mobx-react 4.0!
    inject(() => {})(
        observer(
            class T extends Component {
                render() {
                    return null
                }
            }
        )
    )

    expect(msg.length).toBe(0)
    console.warn = baseWarn
})

test("correctly wraps display name of child component", () => {
    const A = observer(
        class ObserverClass extends Component {
            render() {
                return null
            }
        }
    )
    const B = observer(function StatelessObserver() {
        return null
    })

    const wrapper = renderer.create(<A />)
    expect(wrapper.root.type.name).toEqual("ObserverClass")

    const wrapper2 = renderer.create(<B />)
    expect(wrapper2.root.type.displayName).toEqual("StatelessObserver")
})

describe("124 - react to changes in this.props via computed", () => {
    const Comp = observer(
        class T extends Component {
            componentWillMount() {
                mobx.extendObservable(this, {
                    get computedProp() {
                        return this.props.x
                    }
                })
            }
            render() {
                return (
                    <span>
                        x:
                        {this.computedProp}
                    </span>
                )
            }
        }
    )

    class Parent extends Component {
        state = { v: 1 }
        render() {
            return (
                <div onClick={() => this.setState({ v: 2 })}>
                    <Comp x={this.state.v} />
                </div>
            )
        }
    }

    test("init state is correct", () => {
        const { container } = render(<Parent />)

        expect(container).toHaveTextContent("x:1")
    })

    test("change after click", () => {
        const { container } = render(<Parent />)

        container.querySelector("div").click()
        expect(container).toHaveTextContent("x:2")
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
        render(
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
    let renderCount
    const Comp = observer(
        class T extends Component {
            onClick = () => {
                this.setState({})
            }
            render() {
                renderCount++
                return <div onClick={this.onClick} id="clickableDiv" />
            }
        }
    )

    beforeEach(() => {
        renderCount = 0
    })

    test("renderCount === 1", () => {
        render(<Comp />)

        expect(renderCount).toBe(1)
    })

    test("after click once renderCount === 2", () => {
        const { container } = render(<Comp />)

        container.querySelector("#clickableDiv").click()

        expect(renderCount).toBe(2)
    })

    test("after click twice renderCount === 3", () => {
        const { container } = render(<Comp />)
        const clickableDiv = container.querySelector("#clickableDiv")

        clickableDiv.click()
        clickableDiv.click()

        expect(renderCount).toBe(3)
    })
})

test("it rerenders correctly if some props are non-observables - 1", () => {
    let renderCount = 0
    let odata = mobx.observable({ x: 1 })
    let data = { y: 1 }

    @observer
    class Comp extends React.Component {
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
        class Parent extends Component {
            render() {
                // this.props.odata.x;
                return <Comp data={this.props.data} odata={this.props.odata} />
            }
        }
    )

    function stuff() {
        act(() => {
            data.y++
            odata.x++
        })
    }

    const wrapper = renderer.create(<Parent odata={odata} data={data} />)

    const contents = () => wrapper.toTree().rendered.rendered.rendered.join("")

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

    const contents = () => wrapper.toTree().rendered.rendered.rendered.join("")

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
    let data
    const Comp = () => (
        <div>
            <Observer>{() => <span data-testid="inside-of-observer">{data.get()}</span>}</Observer>
            <span data-testid="outside-of-observer">{data.get()}</span>
        </div>
    )

    beforeEach(() => {
        data = mobx.observable.box("hi")
    })

    test("init state is correct", () => {
        const { queryByTestId } = render(<Comp />)

        expect(queryByTestId("inside-of-observer")).toHaveTextContent("hi")
        expect(queryByTestId("outside-of-observer")).toHaveTextContent("hi")
    })

    test("set the data to hello", () => {
        const { queryByTestId } = render(<Comp />)

        data.set("hello")

        expect(queryByTestId("inside-of-observer")).toHaveTextContent("hello")
        expect(queryByTestId("outside-of-observer")).toHaveTextContent("hi")
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

test("parent / childs render in the right order", () => {
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

    render(<Parent />)

    tryLogout()
    expect(events).toEqual(["parent", "child", "parent"])
})

test("195 - async componentWillMount does not work", () => {
    jest.useFakeTimers()

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
    render(<WillMount />)

    jest.runAllTimers()
    expect(renderedValues).toEqual([0, 1])

    jest.useRealTimers()
})

describe("use Observer inject and render sugar should work  ", () => {
    test("use render without inject should be correct", () => {
        const Comp = () => (
            <div>
                <Observer render={props => <span>{123}</span>} />
            </div>
        )
        const { container } = render(<Comp />)
        expect(container).toHaveTextContent("123")
    })

    test("use children without inject should be correct", () => {
        const Comp = () => (
            <div>
                <Observer>{props => <span>{123}</span>}</Observer>
            </div>
        )
        const { container } = render(<Comp />)
        expect(container).toHaveTextContent("123")
    })

    test("show error when using children and render at same time ", () => {
        const msg = []
        const baseError = console.error
        console.error = m => msg.push(m)

        const Comp = () => (
            <div>
                <Observer render={() => <span>{123}</span>}>{() => <span>{123}</span>}</Observer>
            </div>
        )

        render(<Comp />)
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

test("computed properties react to props", () => {
    jest.useFakeTimers()

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

    jest.runAllTimers()
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  2
</div>
`)

    expect(seen).toEqual(["parent", 0, "parent", 2])

    jest.useRealTimers()
})

test("#692 - componentDidUpdate is triggered", () => {
    jest.useFakeTimers()

    let cDUCount = 0

    @observer
    class Test extends React.Component {
        @mobx.observable
        counter = 0

        @mobx.action
        inc = () => this.counter++

        componentWillMount() {
            setTimeout(() => this.inc(), 300)
        }

        render() {
            return <p>{this.counter}</p>
        }

        componentDidUpdate() {
            cDUCount++
        }
    }
    render(<Test />)
    expect(cDUCount).toBe(0)

    jest.runAllTimers()
    expect(cDUCount).toBe(1)
})

// Not possible to properly test error catching (see ErrorCatcher)
test.skip("#709 - applying observer on React.memo component", () => {
    const WithMemo = React.memo(() => {
        return null
    })

    const Observed = observer(WithMemo)

    render(<Observed />, { wrapper: ErrorCatcher })
})
