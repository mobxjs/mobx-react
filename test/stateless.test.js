import React, { createElement } from "react"
import * as PropTypes from "prop-types"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import TestUtils from "react-dom/test-utils"
import * as mobx from "mobx"
import { observer, propTypes } from "../src"
import { createTestRoot } from "./index"
import renderer from "react-test-renderer"
import { observable } from "mobx"

const testRoot = createTestRoot()

const stateLessComp = ({ testProp }) => <div>result: {testProp}</div>

stateLessComp.propTypes = {
    testProp: PropTypes.string
}
stateLessComp.defaultProps = {
    testProp: "default value for prop testProp"
}

describe("stateless component with propTypes", () => {
    const StatelessCompObserver = observer(stateLessComp)
    test("default property value should be propagated", () => {
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
    test("render test correct", () => {
        const component = TestUtils.renderIntoDocument(
            <StatelessCompObserver testProp="hello world" />
        )
        expect(TestUtils.findRenderedDOMComponentWithTag(component, "div").innerHTML).toBe(
            "result: hello world"
        )
    })
})

test("stateless component with context support", () => {
    const StateLessCompWithContext = (props, context) =>
        createElement("div", {}, "context: " + context.testContext)
    StateLessCompWithContext.contextTypes = { testContext: PropTypes.string }
    const StateLessCompWithContextObserver = observer(StateLessCompWithContext)
    const ContextProvider = createClass({
        childContextTypes: StateLessCompWithContext.contextTypes,
        getChildContext: () => ({ testContext: "hello world" }),
        render: () => <StateLessCompWithContextObserver />
    })
    const component = TestUtils.renderIntoDocument(<ContextProvider />)
    expect(
        TestUtils.findRenderedDOMComponentWithTag(component, "div").innerHTML.replace(/\n/, "")
    ).toBe("context: hello world")
})

test("component with observable propTypes", () => {
    const Component = createClass({
        render: () => null,
        propTypes: {
            a1: propTypes.observableArray,
            a2: propTypes.arrayOrObservableArray
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
        a.x++
        expect(component).toMatchSnapshot()
    })
})
