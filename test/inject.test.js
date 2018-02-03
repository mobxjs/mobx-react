import React from "react"
import * as PropTypes from "prop-types"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import { mount } from "enzyme"
import { action, observable, computed } from "mobx"
import { observer, inject, Provider } from "../"
import { createTestRoot } from "./index"
import { sleepHelper } from "./index"

const testRoot = createTestRoot()

describe("inject based context", () => {
    test("basic context", () => {
        const C = inject("foo")(
            observer(
                createClass({
                    render() {
                        return <div>context:{this.props.foo}</div>
                    }
                })
            )
        )
        const B = () => <C />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = mount(<A />)
        expect(wrapper.find("div").text()).toEqual("context:bar")
    })

    test("props override context", () => {
        const C = inject("foo")(
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        const B = () => <C foo={42} />
        const A = createClass({
            render: () => (
                <Provider foo="bar">
                    <B />
                </Provider>
            )
        })
        const wrapper = mount(<A />)
        expect(wrapper.find("div").text()).toEqual("context:42")
    })

    test("overriding stores is supported", () => {
        const C = inject("foo", "bar")(
            observer(
                createClass({
                    render() {
                        return (
                            <div>
                                context:{this.props.foo}
                                {this.props.bar}
                            </div>
                        )
                    }
                })
            )
        )
        const B = () => <C />
        const A = createClass({
            render: () => (
                <Provider foo="bar" bar={1337}>
                    <div>
                        <span>
                            <B />
                        </span>
                        <section>
                            <Provider foo={42}>
                                <B />
                            </Provider>
                        </section>
                    </div>
                </Provider>
            )
        })
        const wrapper = mount(<A />)
        expect(wrapper.find("span").text()).toEqual("context:bar1337")
        expect(wrapper.find("section").text()).toEqual("context:421337")
    })

    // FIXME: see other comments related to error catching in React
    // test does work as expected when running manually
    test("store should be available", () => {
        const C = inject("foo")(
            observer(
                createClass({
                    render() {
                        return <div>context:{this.props.foo}</div>
                    }
                })
            )
        )
        const B = () => <C />
        const A = createClass({
            render: () => (
                <Provider baz={42}>
                    <B />
                </Provider>
            )
        })
        expect(() => mount(<A />)).toThrow(
            /Store 'foo' is not available! Make sure it is provided by some Provider/
        )
    })

    test("store is not required if prop is available", () => {
        const C = inject("foo")(
            observer(
                createClass({
                    render() {
                        return <div>context:{this.props.foo}</div>
                    }
                })
            )
        )
        const B = () => <C foo="bar" />
        const wrapper = mount(<B />)
        expect(wrapper.find("div").text()).toEqual("context:bar")
    })

    test("inject merges (and overrides) props", () => {
        const C = inject(() => ({ a: 1 }))(
            observer(
                createClass({
                    render() {
                        expect(this.props).toEqual({ a: 1, b: 2 })
                        return null
                    }
                })
            )
        )
        const B = () => <C a={2} b={2} />
        mount(<B />)
    })

    test("warning is printed when changing stores", () => {
        let msg
        const baseWarn = console.warn
        console.warn = m => (msg = m)
        const a = observable(3)
        const C = inject("foo")(
            observer(
                createClass({
                    render() {
                        return <div>context:{this.props.foo}</div>
                    }
                })
            )
        )
        const B = observer(
            createClass({
                render: () => <C />
            })
        )
        const A = observer(
            createClass({
                render: () => (
                    <section>
                        <span>{a.get()}</span>
                        <Provider foo={a.get()}>
                            <B />
                        </Provider>
                    </section>
                )
            })
        )
        const wrapper = mount(<A />)

        expect(wrapper.find("span").text()).toBe("3")
        expect(wrapper.find("div").text()).toBe("context:3")

        a.set(42)

        expect(wrapper.find("span").text()).toBe("42")
        expect(wrapper.find("div").text()).toBe("context:42")
        expect(msg).toBe(
            "MobX Provider: The set of provided stores has changed. Propagation to all children now in experimental support status"
        )

        console.warn = baseWarn
    })

    test("custom storesToProps", () => {
        const C = inject((stores, props, context) => {
            expect(context).toEqual({ mobxStores: { foo: "bar" } })
            expect(stores).toEqual({ foo: "bar" })
            expect(props).toEqual({ baz: 42 })
            return {
                zoom: stores.foo,
                baz: props.baz * 2
            }
        })(
            observer(
                createClass({
                    render() {
                        return (
                            <div>
                                context:{this.props.zoom}
                                {this.props.baz}
                            </div>
                        )
                    }
                })
            )
        )
        const B = createClass({
            render: () => <C baz={42} />
        })
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = mount(<A />)
        expect(wrapper.find("div").text()).toBe("context:bar84")
    })

    test("support static hoisting, wrappedComponent and wrappedInstance", async () => {
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

        const wrapper = mount(<C booh={42} />)
        await sleepHelper(10)
        expect(wrapper.instance().wrappedInstance.testField).toBe(1)
    })

    test("warning is printed when attaching contextTypes to HOC", () => {
        const msg = []
        const baseWarn = console.warn
        console.warn = m => msg.push(m)
        const C = inject(["foo"])(
            createClass({
                displayName: "C",
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        C.propTypes = {}
        C.defaultProps = {}
        C.contextTypes = {}

        const B = () => <C />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        mount(<A />)
        expect(msg.length).toBe(1)
        expect(msg[0]).toBe(
            "Mobx Injector: you are trying to attach `contextTypes` on an component decorated with `inject` (or `observer`) HOC. Please specify the contextTypes on the wrapped component instead. It is accessible through the `wrappedComponent`"
        )

        console.warn = baseWarn
    })

    test("propTypes and defaultProps are forwarded", () => {
        const msg = []
        const baseError = console.error
        console.error = m => msg.push(m)

        const C = inject(["foo"])(
            createClass({
                displayName: "C",
                render() {
                    expect(this.props.y).toEqual(3)
                    expect(this.props.x).toBeUndefined()
                    return null
                }
            })
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
        mount(<A />)
        expect(msg.length).toBe(2)
        expect(msg[0].split("\n")[0]).toBe(
            "Warning: Failed prop type: The prop `x` is marked as required in `inject-C-with-foo`, but its value is `undefined`."
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
            createClass({
                displayName: "C",
                render: () => <div>context:{this.props.foo}</div>
            })
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
            createClass({
                displayName: "C",
                render: () => <div>context:{this.props.foo}</div>
            })
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
        const wrapper = mount(<App />)

        expect(wrapper.find("h1").text()).toBe("Noa")
        user.name = "Veria"
        expect(wrapper.find("h1").text()).toBe("Veria")
    })

    test("using a custom injector is not too reactive", done => {
        let listRender = 0
        let itemRender = 0
        let injectRender = 0

        function connect() {
            return component => inject.apply(this, arguments)(observer(component))
        }

        class State {
            @observable highlighted = null
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

        class ListComponent extends React.Component {
            render() {
                listRender++
                const { items } = this.props

                return <ul>{items.map(item => <ItemComponent key={item.title} item={item} />)}</ul>
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
        class ItemComponent extends React.Component {
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

        ReactDOM.render(
            <Provider state={state}>
                <ListComponent items={items} />
            </Provider>,
            testRoot,
            async () => {
                expect(listRender).toBe(1)
                expect(injectRender).toBe(6)
                expect(itemRender).toBe(6)

                testRoot.querySelectorAll(".hl_ItemB").forEach(e => e.click())
                await sleepHelper(20)
                expect(listRender).toBe(1)
                expect(injectRender).toBe(12) // ideally, 7
                expect(itemRender).toBe(7)

                testRoot.querySelectorAll(".hl_ItemF").forEach(e => e.click())
                await sleepHelper(20)
                expect(listRender).toBe(1)
                expect(injectRender).toBe(18) // ideally, 9
                expect(itemRender).toBe(9)

                testRoot.parentNode.removeChild(testRoot)
                done()
            }
        )
    })
})
