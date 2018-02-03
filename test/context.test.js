import React from "react"
import createClass from "create-react-class"
import { mount } from "enzyme"
import { isEqualWith } from "lodash"
import { observable, spy } from "mobx"
import { shallow } from "enzyme"
import ErrorCatcher from "./ErrorCatcher"
import { Provider, observer, inject } from "../"
import { sleepHelper } from "./"

describe("observer based context", () => {
    test("jest test", () => {
        const sum = 1 + 2
        expect(sum).toBe(3)
    })

    test("using observer to inject throws warning", done => {
        const w = console.warn
        const warns = []
        console.warn = msg => warns.push(msg)

        observer(["test"], () => null)

        expect(warns.length).toBe(1)
        expect(warns[0]).toBe(
            'Mobx observer: Using observer to inject stores is deprecated since 4.0. Use `@inject("store1", "store2") @observer ComponentClass` or `inject("store1", "store2")(observer(componentClass))` instead of `@observer(["store1", "store2"]) ComponentClass`'
        )

        console.warn = w
        done()
    })

    test("basic context", done => {
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        const B = () => <C />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = mount(<A />)
        expect(wrapper.find("div").text()).toEqual("context:bar")
        done()
    })

    test("props override context", done => {
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        const B = () => <C foo={42} />
        const A = () => (
            <Provider foo="bar">
                <B />
            </Provider>
        )
        const wrapper = mount(<A />)
        expect(wrapper.find("div").text()).toEqual("context:42")
        done()
    })

    test("overriding stores is supported", done => {
        const C = observer(
            ["foo", "bar"],
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
        const B = () => <C />
        const A = () => (
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
        const wrapper = mount(<A />)
        expect(wrapper.find("span").text()).toEqual("context:bar1337")
        expect(wrapper.find("section").text()).toEqual("context:421337")
        done()
    })

    //FIXME: this test works correct, but since React in dev always rethrows exception, it is impossible to prevent tape-run from dying on the uncaught exception
    // See: https://github.com/facebook/react/issues/10474#issuecomment-332810203
    test("ErrorCatcher should work", async () => {
        const C = createClass({
            render() {
                throw new Error("Oops")
            }
        })
        const B = () => (
            <ErrorCatcher>
                <C />
            </ErrorCatcher>
        )
        console.log("About to mount")
        mount(<B />)
        console.log("mounted")
        await sleepHelper(10)
        expect(/Oops/.test(ErrorCatcher.getError())).toBeTruthy()
    })

    test("store should be available", done => {
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        const B = () => (
            <ErrorCatcher>
                <C />
            </ErrorCatcher>
        )
        const A = () => (
            <Provider baz={42}>
                <B />
            </Provider>
        )
        mount(<A />)
        expect(
            /Store 'foo' is not available! Make sure it is provided by some Provider/.test(
                ErrorCatcher.getError()
            )
        ).toBeTruthy()
        done()
    })

    test("store is not required if prop is available", done => {
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
        )
        const B = () => <C foo="bar" />
        const wrapper = mount(<B />)
        expect(wrapper.find("div").text()).toEqual("context:bar")
        done()
    })

    test("warning is printed when changing stores, but injected component updated correctly", done => {
        let msg = null
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
                        <span>{a.get()}</span>,
                        <Provider foo={a.get()}>
                            <B />
                        </Provider>
                    </section>
                )
            })
        )
        const wrapper = mount(<A />)
        expect(wrapper.find("span").text()).toEqual("3")
        expect(wrapper.find("div").text()).toEqual("context:3")
        a.set(42)
        expect(wrapper.find("span").text()).toEqual("42")
        expect(wrapper.find("div").text()).toEqual("context:42")
        expect(msg).toEqual(
            "MobX Provider: The set of provided stores has changed. Propagation to all children now in experimental support status"
        )
        console.warn = baseWarn
        done()
    })

    test("changing store worked through another Provider", done => {
        let computeCount = 0
        spy(event => {
            if (event.type === "compute") {
                computeCount++
            }
        })
        const a = observable(3)
        const b = observable(30)
        const C = inject("foo", "bar")(
            observer(
                createClass({
                    render() {
                        return (
                            <div>
                                context:{this.props.foo}_{this.props.bar}
                            </div>
                        )
                    }
                })
            )
        )
        const NotUpdatable = observer(
            createClass({
                shouldComponentUpdate(nextProps) {
                    return !isEqualWith(this.props, nextProps, customEquality)
                    function customEquality(objValue, othValue) {
                        if (objValue.props || othValue.props) {
                            return isEqualWith(objValue.props, othValue.props, customEquality)
                        }
                    }
                },
                render() {
                    return this.props.children
                }
            })
        )
        const A = observer(
            createClass({
                render: () => (
                    <section>
                        <span>
                            {a.get()}_{b.get()}
                        </span>,
                        <Provider foo={a.get()}>
                            <NotUpdatable>
                                <Provider bar={b.get()}>
                                    <NotUpdatable>
                                        <C />
                                    </NotUpdatable>
                                </Provider>
                            </NotUpdatable>
                        </Provider>
                    </section>
                )
            })
        )
        const wrapper = mount(<A />)
        expect(computeCount).toBe(2)
        expect(wrapper.find("span").text()).toEqual("3_30")
        expect(wrapper.find("div").text()).toEqual("context:3_30")

        a.set(42)
        expect(computeCount).toBe(4)
        expect(wrapper.find("span").text()).toEqual("42_30")
        expect(wrapper.find("div").text()).toEqual("context:42_30")

        b.set(420)
        expect(computeCount).toBe(5)
        expect(wrapper.find("span").text()).toEqual("42_420")
        expect(wrapper.find("div").text()).toEqual("context:42_420")

        done()
    })
})
