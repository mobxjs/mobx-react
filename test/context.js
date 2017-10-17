import React from "react"
import createClass from "create-react-class"
import { mount } from "enzyme"
import test from "tape"
import mobx from "mobx"
import { observer, Provider } from "../"
import ErrorCatcher from "./ErrorCatcher"

test("observer based context", t => {
    test("using observer to inject throws warning", t => {
        const w = console.warn
        const warns = []
        console.warn = msg => warns.push(msg)

        observer(["test"], () => null)

        t.equal(warns.length, 1)
        t.equal(
            warns[0],
            'Mobx observer: Using observer to inject stores is deprecated since 4.0. Use `@inject("store1", "store2") @observer ComponentClass` or `inject("store1", "store2")(observer(componentClass))` instead of `@observer(["store1", "store2"]) ComponentClass`'
        )

        console.warn = w
        t.end()
    })

    test("basic context", t => {
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
        t.equal(wrapper.find("div").text(), "context:bar")
        t.end()
    })

    test("props override context", t => {
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
        t.equal(wrapper.find("div").text(), "context:42")
        t.end()
    })

    test("overriding stores is supported", t => {
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
        t.equal(wrapper.find("span").text(), "context:bar1337")
        t.equal(wrapper.find("section").text(), "context:421337")
        t.end()
    })

    // FIXME: this test works correct, but since React in dev always rethrows exception, it is impossible to prevent tape-run from dying on the uncaught exception
    // See: https://github.com/facebook/react/issues/10474#issuecomment-332810203
    test.skip("ErrorCatcher should work", t => {
        t.plan(1)
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
        setTimeout(() => {
            t.ok(/Oops/.test(ErrorCatcher.getError()))
            t.end()
        }, 100)
    })

    test.skip("store should be available", t => {
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
        t.ok(
            /Store 'foo' is not available! Make sure it is provided by some Provider/.test(
                ErrorCatcher.getError()
            )
        )
        t.end()
    })

    test("store is not required if prop is available", t => {
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
        t.equal(wrapper.find("div").text(), "context:bar")
        t.end()
    })

    test("warning is printed when changing stores", t => {
        let msg = null
        const baseWarn = console.warn
        console.warn = m => (msg = m)
        const a = mobx.observable(3)
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
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
        t.equal(wrapper.find("span").text(), "3")
        t.equal(wrapper.find("div").text(), "context:3")
        a.set(42)
        t.equal(wrapper.find("span").text(), "42")
        t.equal(wrapper.find("div").text(), "context:3")
        t.equal(
            msg,
            "MobX Provider: Provided store 'foo' has changed. Please avoid replacing stores as the change might not propagate to all children"
        )
        console.warn = baseWarn
        t.end()
    })

    test("warning is not printed when changing stores, but suppressed explicitly", t => {
        let msg = null
        const baseWarn = console.warn
        console.warn = m => (msg = m)
        const a = mobx.observable(3)
        const C = observer(
            ["foo"],
            createClass({
                render() {
                    return <div>context:{this.props.foo}</div>
                }
            })
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
                        <Provider foo={a.get()} suppressChangedStoreWarning>
                            <B />
                        </Provider>
                    </section>
                )
            })
        )
        const wrapper = mount(<A />)
        t.equal(wrapper.find("span").text(), "3")
        t.equal(wrapper.find("div").text(), "context:3")
        a.set(42)
        t.equal(wrapper.find("span").text(), "42")
        t.equal(wrapper.find("div").text(), "context:3")
        t.equal(msg, null)
        console.warn = baseWarn
        t.end()
    })

    t.end()
})
