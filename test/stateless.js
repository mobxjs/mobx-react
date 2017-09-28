import React, { createElement } from "react"
import * as PropTypes from 'prop-types'
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import test from "tape"
import mobx from "mobx"
import { observer, propTypes } from "../"
import { createTestRoot } from "./index"

const testRoot = createTestRoot()

const stateLessComp = ({ testProp }) => <div>result: {testProp}</div>

stateLessComp.propTypes = {
    testProp: PropTypes.string
}
stateLessComp.defaultProps = {
    testProp: "default value for prop testProp"
}

test("stateless component with propTypes", t => {
    const StatelessCompObserver = observer(stateLessComp)
    t.equal(
        StatelessCompObserver.defaultProps.testProp,
        "default value for prop testProp",
        "default property value should be propagated"
    )
    const originalConsoleError = console.error
    let beenWarned = false
    console.error = () => (beenWarned = true)
    const wrapper = <StatelessCompObserver testProp={10} />
    console.error = originalConsoleError
    t.equal(beenWarned, true, "an error should be logged with a property type warning")

    ReactDOM.render(<StatelessCompObserver testProp="hello world" />, testRoot, function() {
        t.equal(testRoot.innerText, "result: hello world")
        t.end()
    })
})

test("stateless component with context support", t => {
    const StateLessCompWithContext = (props, context) =>
        createElement("div", {}, "context: " + context.testContext)
    StateLessCompWithContext.contextTypes = { testContext: PropTypes.string }
    const StateLessCompWithContextObserver = observer(StateLessCompWithContext)
    const ContextProvider = createClass({
        childContextTypes: StateLessCompWithContext.contextTypes,
        getChildContext: () => ({ testContext: "hello world" }),
        render: () => <StateLessCompWithContextObserver />
    })
    ReactDOM.render(<ContextProvider />, testRoot, () => {
        t.equal(testRoot.innerText.replace(/\n/, ""), "context: hello world")
        t.end()
    })
})

test("component with observable propTypes", t => {
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
    t.equal(warnings.length, 1)
    const secondWrapper = <Component a1={mobx.observable([])} a2={mobx.observable([])} />
    t.equal(warnings.length, 1)
    console.error = originalConsoleError
    t.end()
})
