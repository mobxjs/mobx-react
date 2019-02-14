import React, { createElement } from "react"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import * as mobx from "mobx"
import { observer } from "../src"
import _ from "lodash"
import { createTestRoot, sleepHelper, asyncReactDOMRender } from "./index"

const testRoot = createTestRoot()
let topRenderCount = 0

const wizardModel = mobx.observable(
    {
        steps: [
            {
                title: "Size",
                active: true
            },
            {
                title: "Fabric",
                active: false
            },
            {
                title: "Finish",
                active: false
            }
        ],
        get activeStep() {
            return _.find(this.steps, "active")
        },
        activateNextStep: function() {
            const nextStep = this.steps[_.findIndex(this.steps, "active") + 1]
            if (!nextStep) {
                return false
            }
            this.setActiveStep(nextStep)
        },
        setActiveStep(modeToActivate) {
            const self = this
            mobx.transaction(() => {
                _.find(self.steps, "active").active = false
                modeToActivate.active = true
            })
        }
    },
    {
        activateNextStep: mobx.observable.ref
    }
)

/** RENDERS **/

const Wizard = observer(
    createClass({
        displayName: "Wizard",
        render() {
            return createElement(
                "div",
                null,
                <div>
                    <h1>Active Step: </h1>
                    <WizardStep step={this.props.model.activeStep} key="activeMode" tester />
                </div>,
                <div>
                    <h1>All Step: </h1>
                    <p>
                        Clicking on these steps will render the active step just once. This is what
                        I expected.
                    </p>
                    <WizardStep step={this.props.model.steps} key="modeList" />
                </div>
            )
        }
    })
)

const WizardSteps = observer(
    createClass({
        displayName: "WizardSteps",
        componentWillMount() {
            this.renderCount = 0
        },
        render() {
            var steps = _.map(this.props.steps, step =>
                createElement(
                    "div",
                    { key: step.title },
                    <WizardStep step={step} key={step.title} />
                )
            )
            return createElement("div", null, steps)
        }
    })
)

const WizardStep = observer(
    createClass({
        displayName: "WizardStep",
        componentWillMount() {
            this.renderCount = 0
        },
        componentWillUnmount() {
            // console.log("Unmounting!")
        },
        render() {
            // weird test hack:
            if (this.props.tester === true) {
                topRenderCount++
            }
            return createElement(
                "div",
                { onClick: this.modeClickHandler },
                "RenderCount: " +
                    this.renderCount++ +
                    " " +
                    this.props.step.title +
                    ": isActive:" +
                    this.props.step.active
            )
        },
        modeClickHandler() {
            var step = this.props.step
            wizardModel.setActiveStep(step)
        }
    })
)

/** END RENDERERS **/

const changeStep = stepNumber => wizardModel.setActiveStep(wizardModel.steps[stepNumber])

test("verify issue 21", async () => {
    await asyncReactDOMRender(<Wizard model={wizardModel} />, testRoot)
    expect(topRenderCount).toBe(1)
    changeStep(0)
    await sleepHelper(100)
    expect(topRenderCount).toBe(2)
    changeStep(2)
    await sleepHelper(100)
    expect(topRenderCount).toBe(3)
})

test("verify prop changes are picked up", async () => {
    function createItem(subid, label) {
        const res = mobx.observable(
            {
                id: 1,
                label: label,
                get text() {
                    events.push(["compute", this.subid])
                    return (
                        this.id +
                        "." +
                        this.subid +
                        "." +
                        this.label +
                        "." +
                        data.items.indexOf(this)
                    )
                }
            },
            {},
            { proxy: false }
        )
        res.subid = subid // non reactive
        return res
    }
    const data = mobx.observable({
        items: [createItem(1, "hi")]
    })
    const events = []
    const Child = observer(
        createClass({
            componentWillReceiveProps(nextProps) {
                events.push(["receive", this.props.item.subid, nextProps.item.subid])
            },
            componentWillUpdate(nextProps) {
                events.push(["update", this.props.item.subid, nextProps.item.subid])
            },
            render() {
                events.push(["render", this.props.item.subid, this.props.item.text])
                return <span>{this.props.item.text}</span>
            }
        })
    )

    const Parent = observer(
        createClass({
            render() {
                return (
                    <div onClick={changeStuff.bind(this)} id="testDiv">
                        {data.items.map(item => (
                            <Child key="fixed" item={item} />
                        ))}
                    </div>
                )
            }
        })
    )

    const Wrapper = () => <Parent />

    function changeStuff() {
        mobx.transaction(() => {
            data.items[0].label = "hello" // schedules state change for Child
            data.items[0] = createItem(2, "test") // Child should still receive new prop!
        })
        this.setState({}) // trigger update
    }

    await asyncReactDOMRender(<Wrapper />, testRoot)
    expect(events.sort()).toEqual([["compute", 1], ["render", 1, "1.1.hi.0"]].sort())
    events.splice(0)
    testRoot.querySelector("#testDiv").click()
    await sleepHelper(100)
    expect(events.sort()).toEqual(
        [
            ["compute", 1],
            ["receive", 1, 2],
            ["update", 1, 2],
            ["compute", 2],
            ["render", 2, "1.2.test.0"]
        ].sort()
    )
})

test("verify props is reactive", async () => {
    function createItem(subid, label) {
        const res = mobx.observable(
            {
                id: 1,
                label: label,
                get text() {
                    events.push(["compute", this.subid])
                    return (
                        this.id +
                        "." +
                        this.subid +
                        "." +
                        this.label +
                        "." +
                        data.items.indexOf(this)
                    )
                }
            },
            {},
            { proxy: false }
        )
        res.subid = subid // non reactive
        return res
    }

    const data = mobx.observable({
        items: [createItem(1, "hi")]
    })
    const events = []

    const Child = observer(
        createClass({
            componentWillMount() {
                events.push(["mount"])
                mobx.extendObservable(this, {
                    get computedLabel() {
                        events.push(["computed label", this.props.item.subid])
                        return this.props.item.label
                    }
                })
            },
            componentWillReceiveProps(nextProps) {
                events.push(["receive", this.props.item.subid, nextProps.item.subid])
            },
            componentWillUpdate(nextProps) {
                events.push(["update", this.props.item.subid, nextProps.item.subid])
            },
            render() {
                events.push([
                    "render",
                    this.props.item.subid,
                    this.props.item.text,
                    this.computedLabel
                ])
                return (
                    <span>
                        {this.props.item.text}
                        {this.computedLabel}
                    </span>
                )
            }
        })
    )

    const Parent = observer(
        createClass({
            render() {
                return (
                    <div onClick={changeStuff.bind(this)} id="testDiv">
                        {data.items.map(item => (
                            <Child key="fixed" item={item} />
                        ))}
                    </div>
                )
            }
        })
    )

    const Wrapper = () => <Parent />

    function changeStuff() {
        mobx.transaction(() => {
            // components start rendeirng a new item, but computed is still based on old value
            data.items = [createItem(2, "test")]
        })
    }

    await asyncReactDOMRender(<Wrapper />, testRoot)
    expect(events.sort()).toEqual(
        [["mount"], ["compute", 1], ["computed label", 1], ["render", 1, "1.1.hi.0", "hi"]].sort()
    )

    events.splice(0)
    testRoot.querySelector("#testDiv").click()
    await sleepHelper(100)
    expect(events.sort()).toEqual(
        [
            ["compute", 1],
            ["receive", 1, 2],
            ["update", 1, 2],
            ["compute", 2],
            ["computed label", 2],
            ["render", 2, "1.2.test.0", "test"]
        ].sort()
    )
})

test("no re-render for shallow equal props", async () => {
    function createItem(subid, label) {
        const res = mobx.observable({
            id: 1,
            label: label
        })
        res.subid = subid // non reactive
        return res
    }

    const data = mobx.observable({
        items: [createItem(1, "hi")],
        parentValue: 0
    })
    const events = []

    const Child = observer(
        createClass({
            componentWillMount() {
                events.push(["mount"])
            },
            componentWillReceiveProps(nextProps) {
                events.push(["receive", this.props.item.subid, nextProps.item.subid])
            },

            componentWillUpdate(nextProps) {
                events.push(["update", this.props.item.subid, nextProps.item.subid])
            },
            render() {
                events.push(["render", this.props.item.subid, this.props.item.label])
                return <span>{this.props.item.label}</span>
            }
        })
    )

    const Parent = observer(
        createClass({
            render() {
                // "object has become observable!"
                expect(mobx.isObservable(this.props.nonObservable)).toBeFalsy()
                events.push(["parent render", data.parentValue])
                return (
                    <div onClick={changeStuff.bind(this)} id="testDiv">
                        {data.items.map(item => (
                            <Child key="fixed" item={item} value={5} />
                        ))}
                    </div>
                )
            }
        })
    )

    const Wrapper = () => <Parent nonObservable={{}} />

    function changeStuff() {
        data.items[0].label = "hi" // no change.
        data.parentValue = 1 // rerender parent
    }

    await asyncReactDOMRender(<Wrapper />, testRoot)
    expect(events.sort()).toEqual([["parent render", 0], ["mount"], ["render", 1, "hi"]].sort())
    events.splice(0)
    testRoot.querySelector("#testDiv").click()
    await sleepHelper(100)
    expect(events.sort()).toEqual([["parent render", 1], ["receive", 1, 1]].sort())
})

test("lifecycle callbacks called with correct arguments", async () => {
    var Component = observer(
        createClass({
            componentWillReceiveProps(nextProps) {
                // "componentWillReceiveProps: nextProps.counter === 1"
                expect(nextProps.counter).toBe(1)
                // "componentWillReceiveProps: this.props.counter === 1"
                expect(this.props.counter).toBe(0)
            },
            componentWillUpdate(nextProps, nextState) {
                // "componentWillReceiveProps: nextProps.counter === 1"
                expect(nextProps.counter).toBe(1)
                // "componentWillReceiveProps: this.props.counter === 1"
                expect(this.props.counter).toBe(0)
            },
            componentDidUpdate(prevProps, prevState) {
                // "componentWillReceiveProps: nextProps.counter === 1"
                expect(prevProps.counter).toBe(0)
                // "componentWillReceiveProps: this.props.counter === 1"
                expect(this.props.counter).toBe(1)
            },
            render() {
                return (
                    <div>
                        <span key="1">{[this.props.counter]}</span>
                        <button key="2" id="testButton" onClick={this.props.onClick} />
                    </div>
                )
            }
        })
    )
    const Root = createClass({
        getInitialState() {
            return {}
        },
        onButtonClick() {
            this.setState({ counter: (this.state.counter || 0) + 1 })
        },
        render() {
            return <Component counter={this.state.counter || 0} onClick={this.onButtonClick} />
        }
    })
    await asyncReactDOMRender(<Root />, testRoot)
    testRoot.querySelector("#testButton").click()
})

test("verify props are reactive in componentWillMount and constructor", async () => {
    const prop1Values = []
    const prop2Values = []
    let componentWillMountCallsCount = 0
    let constructorCallsCount = 0

    const Component = observer(
        class Component extends React.Component {
            constructor(props, context) {
                super(props, context)
                constructorCallsCount++
                this.disposer1 = mobx.reaction(
                    () => this.props.prop1,
                    prop => prop1Values.push(prop),
                    {
                        fireImmediately: true
                    }
                )
            }

            componentWillMount() {
                componentWillMountCallsCount++
                this.disposer2 = mobx.reaction(
                    () => this.props.prop2,
                    prop => prop2Values.push(prop),
                    {
                        fireImmediately: true
                    }
                )
            }

            componentWillUnmount() {
                this.disposer1()
                this.disposer2()
            }

            render() {
                return <div />
            }
        }
    )

    await asyncReactDOMRender(<Component prop1="1" prop2="4" />, testRoot)
    await asyncReactDOMRender(<Component prop1="2" prop2="3" />, testRoot)
    await asyncReactDOMRender(<Component prop1="3" prop2="2" />, testRoot)
    await asyncReactDOMRender(<Component prop1="4" prop2="1" />, testRoot)
    expect(constructorCallsCount).toEqual(1)
    expect(componentWillMountCallsCount).toEqual(1)
    expect(prop1Values).toEqual(["1", "2", "3", "4"])
    expect(prop2Values).toEqual(["4", "3", "2", "1"])
})
