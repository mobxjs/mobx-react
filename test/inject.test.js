import React from "react"
import PropTypes from "prop-types"
import { action, observable } from "mobx"
import { observer, inject, Provider } from "../src"
import { render } from "@testing-library/react"
import TestRenderer, { act } from "react-test-renderer"
import withConsole from "./utils/withConsole"

describe("inject based context", () => {
    test("basic context", () => {
        const C = inject("foo")(
            observer(
                class X extends React.Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.foo}
                            </div>
                        )
                    }
                }
            )
        )
        const B = () => <C />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = TestRenderer.create(<A />)
        expect(wrapper).toMatchInlineSnapshot(`
<div>
  context:
  bar
</div>
`)
    })

    test("props override context", () => {
        const C = inject("foo")(
            class T extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        const B = () => <C foo={42} />
        const A = class T extends React.Component {
            render() {
                return (
                    <Provider foo="bar">
                        <B />
                    </Provider>
                )
            }
        }
        const wrapper = TestRenderer.create(<A />)
        expect(wrapper).toMatchInlineSnapshot(`
<div>
  context:
  42
</div>
`)
    })

    test("wraps displayName of original component", () => {
        const A = inject("foo")(
            class ComponentA extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        const B = inject()(
            class ComponentB extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        const C = inject(() => ({}))(
            class ComponentC extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        const wrapperA = TestRenderer.create(
            <Provider foo="foo">
                <A />
            </Provider>
        )
        expect(wrapperA.root.children[0].type.displayName).toBe("inject-with-foo(ComponentA)")
        const wrapperB = TestRenderer.create(
            <Provider foo="foo">
                <B />
            </Provider>
        )
        expect(wrapperB.root.children[0].type.displayName).toBe("inject(ComponentB)")
        const wrapperC = TestRenderer.create(
            <Provider>
                <C />
            </Provider>
        )
        expect(wrapperC.root.children[0].type.displayName).toBe("inject(ComponentC)")
    })

    // FIXME: see other comments related to error catching in React
    // test does work as expected when running manually
    test("store should be available", () => {
        const C = inject("foo")(
            observer(
                class C extends React.Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.foo}
                            </div>
                        )
                    }
                }
            )
        )
        const B = () => <C />
        const A = class A extends React.Component {
            render() {
                return (
                    <Provider baz={42}>
                        <B />
                    </Provider>
                )
            }
        }

        withConsole(() => {
            expect(() => TestRenderer.create(<A />)).toThrow(
                /Store 'foo' is not available! Make sure it is provided by some Provider/
            )
        })
    })

    test("store is not required if prop is available", () => {
        const C = inject("foo")(
            observer(
                class C extends React.Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.foo}
                            </div>
                        )
                    }
                }
            )
        )
        const B = () => <C foo="bar" />
        const wrapper = TestRenderer.create(<B />)
        expect(wrapper).toMatchInlineSnapshot(`
<div>
  context:
  bar
</div>
`)
    })

    test("inject merges (and overrides) props", () => {
        const C = inject(() => ({ a: 1 }))(
            observer(
                class C extends React.Component {
                    render() {
                        expect(this.props).toEqual({ a: 1, b: 2 })
                        return null
                    }
                }
            )
        )
        const B = () => <C a={2} b={2} />
        TestRenderer.create(<B />)
    })

    test("custom storesToProps", () => {
        const C = inject((stores, props) => {
            expect(stores).toEqual({ foo: "bar" })
            expect(props).toEqual({ baz: 42 })
            return {
                zoom: stores.foo,
                baz: props.baz * 2
            }
        })(
            observer(
                class C extends React.Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.zoom}
                                {this.props.baz}
                            </div>
                        )
                    }
                }
            )
        )
        const B = class B extends React.Component {
            render() {
                return <C baz={42} />
            }
        }
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = TestRenderer.create(<A />)
        expect(wrapper).toMatchInlineSnapshot(`
<div>
  context:
  bar
  84
</div>
`)
    })

    test("inject forwards ref", () => {
        class FancyComp extends React.Component {
            render() {
                this.didRender = true
                return null
            }

            doSomething() {}
        }

        const ref = React.createRef()
        TestRenderer.create(<FancyComp ref={ref} />)
        expect(typeof ref.current.doSomething).toBe("function")
        expect(ref.current.didRender).toBe(true)

        const InjectedFancyComp = inject("bla")(FancyComp)
        const ref2 = React.createRef()

        TestRenderer.create(
            <Provider bla={42}>
                <InjectedFancyComp ref={ref2} />
            </Provider>
        )

        expect(typeof ref2.current.doSomething).toBe("function")
        expect(ref2.current.didRender).toBe(true)
    })

    test("inject should work with components that use forwardRef", () => {
        const FancyComp = React.forwardRef((_, ref) => {
            return <div ref={ref} />
        })

        const InjectedFancyComp = inject("bla")(FancyComp)
        const ref = React.createRef()

        render(
            <Provider bla={42}>
                <InjectedFancyComp ref={ref} />
            </Provider>
        )

        expect(ref.current).not.toBeNull()
        expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    test("support static hoisting, wrappedComponent and ref forwarding", () => {
        class B extends React.Component {
            render() {
                this.testField = 1
                return null
            }
        }
        B.propTypes = {
            x: PropTypes.object
        }
        B.bla = 17
        B.bla2 = {}
        const C = inject("booh")(B)
        expect(C.wrappedComponent).toBe(B)
        expect(B.bla).toBe(17)
        expect(C.bla).toBe(17)
        expect(C.bla2 === B.bla2).toBeTruthy()
        expect(Object.keys(C.wrappedComponent.propTypes)).toEqual(["x"])

        const ref = React.createRef()

        TestRenderer.create(<C booh={42} ref={ref} />)
        expect(ref.current.testField).toBe(1)
    })

    test("propTypes and defaultProps are forwarded", () => {
        const msg = []
        const baseError = console.error
        console.error = m => msg.push(m)

        const C = inject(["foo"])(
            class C extends React.Component {
                render() {
                    expect(this.props.y).toEqual(3)

                    expect(this.props.x).toBeUndefined()
                    return null
                }
            }
        )
        C.propTypes = {
            x: PropTypes.func.isRequired,
            z: PropTypes.string.isRequired
        }
        C.wrappedComponent.propTypes = {
            a: PropTypes.func.isRequired
        }
        C.defaultProps = {
            y: 3
        }
        const B = () => <C z="test" />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        TestRenderer.create(<A />)
        expect(msg.length).toBe(2)
        expect(msg[0].split("\n")[0]).toBe(
            "Warning: Failed prop type: The prop `x` is marked as required in `inject-with-foo(C)`, but its value is `undefined`."
        )
        expect(msg[1].split("\n")[0]).toBe(
            "Warning: Failed prop type: The prop `a` is marked as required in `C`, but its value is `undefined`."
        )
        console.error = baseError
    })

    test("warning is not printed when attaching propTypes to injected component", () => {
        let msg = []
        const baseWarn = console.warn
        console.warn = m => (msg = m)

        const C = inject(["foo"])(
            class C extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        C.propTypes = {}

        expect(msg.length).toBe(0)
        console.warn = baseWarn
    })

    test("warning is not printed when attaching propTypes to wrappedComponent", () => {
        let msg = []
        const baseWarn = console.warn
        console.warn = m => (msg = m)
        const C = inject(["foo"])(
            class C extends React.Component {
                render() {
                    return (
                        <div>
                            context:
                            {this.props.foo}
                        </div>
                    )
                }
            }
        )
        C.wrappedComponent.propTypes = {}
        expect(msg.length).toBe(0)
        console.warn = baseWarn
    })

    test("using a custom injector is reactive", () => {
        const user = observable({ name: "Noa" })
        const mapper = stores => ({ name: stores.user.name })
        const DisplayName = props => <h1>{props.name}</h1>
        const User = inject(mapper)(DisplayName)
        const App = () => (
            <Provider user={user}>
                <User />
            </Provider>
        )
        const wrapper = TestRenderer.create(<App />)

        expect(wrapper).toMatchInlineSnapshot(`
<h1>
  Noa
</h1>
`)
        act(() => {
            user.name = "Veria"
        })
        expect(wrapper).toMatchInlineSnapshot(`
<h1>
  Veria
</h1>
`)
    })

    test("using a custom injector is not too reactive", () => {
        let listRender = 0
        let itemRender = 0
        let injectRender = 0

        function connect() {
            return component => inject.apply(this, arguments)(observer(component))
        }

        class State {
            @observable
            highlighted = null
            isHighlighted(item) {
                return this.highlighted == item
            }

            @action
            highlight = item => {
                this.highlighted = item
            }
        }

        const items = observable([
            { title: "ItemA" },
            { title: "ItemB" },
            { title: "ItemC" },
            { title: "ItemD" },
            { title: "ItemE" },
            { title: "ItemF" }
        ])

        const state = new State()

        class ListComponent extends React.PureComponent {
            render() {
                listRender++
                const { items } = this.props

                return (
                    <ul>
                        {items.map(item => (
                            <ItemComponent key={item.title} item={item} />
                        ))}
                    </ul>
                )
            }
        }

        @connect(({ state }, { item }) => {
            injectRender++
            if (injectRender > 6) {
                // debugger;
            }
            return {
                // Using
                // highlighted: expr(() => state.isHighlighted(item)) // seems to fix the problem
                highlighted: state.isHighlighted(item),
                highlight: state.highlight
            }
        })
        class ItemComponent extends React.PureComponent {
            highlight = () => {
                const { item, highlight } = this.props
                highlight(item)
            }

            render() {
                itemRender++
                const { highlighted, item } = this.props
                return (
                    <li className={"hl_" + item.title} onClick={this.highlight}>
                        {item.title} {highlighted ? "(highlighted)" : ""}{" "}
                    </li>
                )
            }
        }

        const { container } = render(
            <Provider state={state}>
                <ListComponent items={items} />
            </Provider>
        )

        expect(listRender).toBe(1)
        expect(injectRender).toBe(6)
        expect(itemRender).toBe(6)

        container.querySelectorAll(".hl_ItemB").forEach(e => e.click())
        expect(listRender).toBe(1)
        expect(injectRender).toBe(12) // ideally, 7
        expect(itemRender).toBe(7)

        container.querySelectorAll(".hl_ItemF").forEach(e => e.click())
        expect(listRender).toBe(1)
        expect(injectRender).toBe(18) // ideally, 9
        expect(itemRender).toBe(9)
    })
})

test("#612 - mixed context types", () => {
    const SomeContext = React.createContext(true)

    class MainCompClass extends React.Component {
        static contextType = SomeContext
        render() {
            let active = this.context
            return active ? this.props.value : "Inactive"
        }
    }

    const MainComp = inject(stores => ({
        value: stores.appState.value
    }))(MainCompClass)

    const appState = observable({
        value: "Something"
    })

    function App() {
        return (
            <Provider appState={appState}>
                <SomeContext.Provider value={true}>
                    <MainComp />
                </SomeContext.Provider>
            </Provider>
        )
    }

    render(<App />)
})
