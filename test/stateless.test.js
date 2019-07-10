import React, { Component } from "react"
import * as PropTypes from "prop-types"
import * as mobx from "mobx"
import { observer, PropTypes as MRPropTypes } from "../src"
import { render, cleanup } from "@testing-library/react"
import renderer, { act } from "react-test-renderer"
import { observable } from "mobx"

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
        const { container } = render(<StatelessCompObserver testProp="hello world" />)
        expect(container.textContent).toBe("result: hello world")
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
            <StateLessCompWithContextObserver />
        </C.Provider>
    )

    const { container } = render(<ContextProvider />)
    expect(container.textContent).toBe("context: hello world")
})

test("component with observable propTypes", () => {
    class Comp extends Component {
        render() {
            return null
        }
        static propTypes = {
            a1: MRPropTypes.observableArray,
            a2: MRPropTypes.arrayOrObservableArray
        }
    }
    const originalConsoleError = console.error
    const warnings = []
    console.error = msg => warnings.push(msg)
    const firstWrapper = <Comp a1={[]} a2={[]} />
    expect(warnings.length).toBe(1)
    const secondWrapper = <Comp a1={mobx.observable([])} a2={mobx.observable([])} />
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

afterEach(cleanup)
