import React, { createElement } from "react"
import * as PropTypes from "prop-types"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import TestUtils from "react-dom/test-utils"
import * as mobx from "mobx"
import { observer, PropTypes as MRPropTypes } from "../src"
import { createTestRoot, asyncReactDOMRender } from "./index"
import renderer, { act } from "react-test-renderer"
import { observable } from "mobx"

const testRoot = createTestRoot()

const StatelessComp = ({ testProp }) => <div>result: {testProp}</div>

StatelessComp.propTypes = {
    testProp: PropTypes.string
}
StatelessComp.defaultProps = {
    testProp: "default value for prop testProp"
}

describe("stateless component with propTypes", () => {
    const StatelessCompObserver = observer(StatelessComp)

    test("default property value should be propagated", () => {
        expect(StatelessComp.defaultProps.testProp).toBe("default value for prop testProp")
        expect(StatelessCompObserver.defaultProps.testProp).toBe("default value for prop testProp")
    })

    const originalConsoleError = console.error
    let beenWarned = false
    console.error = () => (beenWarned = true)
    const wrapper = <StatelessCompObserver testProp={10} />
    console.error = originalConsoleError

    test("an error should be logged with a property type warning", () => {
        expect(beenWarned).toBeTruthy()
    })

    test("render test correct", async () => {
        await asyncReactDOMRender(<StatelessCompObserver testProp="hello world" />, testRoot)
        expect(testRoot.querySelector("div").innerHTML).toBe("result: hello world")
    })
})

test("stateless component with context support", async () => {
    const C = React.createContext()

    const StateLessCompWithContext = (props, context) => (
        <C.Consumer>{value => <div>context: {value.testContext}</div>}</C.Consumer>
    )

    const StateLessCompWithContextObserver = observer(StateLessCompWithContext)

    const ContextProvider = () => (
        <C.Provider value={{ testContext: "hello world" }}>
            <StateLessCompWithContext />
        </C.Provider>
    )

    await asyncReactDOMRender(<ContextProvider />, testRoot)
    expect(testRoot.querySelector("div").innerHTML.replace(/\n/, "")).toBe("context: hello world")
})

test("component with observable propTypes", () => {
    const Component = createClass({
        render: () => null,
        propTypes: {
            a1: MRPropTypes.observableArray,
            a2: MRPropTypes.arrayOrObservableArray
        }
    })
    const originalConsoleError = console.error
    const warnings = []
    console.error = msg => warnings.push(msg)
    const firstWrapper = <Component a1={[]} a2={[]} />
    expect(warnings.length).toBe(1)
    const secondWrapper = <Component a1={mobx.observable([])} a2={mobx.observable([])} />
    expect(warnings.length).toBe(1)
    console.error = originalConsoleError
})

describe("stateless component with forwardRef", () => {
    const a = observable({
        x: 1
    })
    const ForwardRefCompObserver = observer(
        React.forwardRef(({ testProp }, ref) => {
            return (
                <div>
                    result: {testProp}, {ref ? "got ref" : "no ref"}, a.x: {a.x}
                </div>
            )
        })
    )

    test("render test correct", () => {
        const component = renderer.create(
            <ForwardRefCompObserver testProp="hello world" ref={React.createRef()} />
        )
        expect(component).toMatchSnapshot()
    })

    test("is reactive", () => {
        const component = renderer.create(
            <ForwardRefCompObserver testProp="hello world" ref={React.createRef()} />
        )
        act(() => {
            a.x++
        })
        expect(component).toMatchSnapshot()
    })
})
