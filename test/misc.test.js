import React, { createElement } from "react"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import { mount, shallow } from "enzyme"
import * as mobx from "mobx"
import { observer } from "../src"
import { createTestRoot, withConsole } from "./index"

const testRoot = createTestRoot()

describe("custom shouldComponentUpdate is not respected for observable changes (#50)", () => {
    describe("(#50)-1", () => {
        expect(
            withConsole(() => {
                let called = 0
                const x = mobx.observable.box(3)
                const C = observer(
                    createClass({
                        render: () => <div>value:{x.get()}</div>,
                        shouldComponentUpdate: () => called++
                    })
                )
                const wrapper = mount(<C />)
                test("init div context  === value:3 and shouldUpdate hook did not run ", () => {
                    expect(wrapper.find("div").text()).toBe("value:3")
                    expect(called).toBe(0)
                })
                test("update div context === value:42 and shouldUpdate hook did not run  ", () => {
                    x.set(42)
                    expect(wrapper.find("div").text()).toBe("value:42")
                    expect(called).toBe(0)
                })
            })
        ).toMatchSnapshot()
    })

    describe("(#50) - 2", () => {
        expect(
            withConsole(() => {
                // shouldComponentUpdate is meaningless with observable props...., just show warning in component definition?
                let called = 0
                const y = mobx.observable.box(5)
                const C = observer(
                    createClass({
                        render() {
                            return <div>value:{this.props.y}</div>
                        },
                        shouldComponentUpdate(nextProps) {
                            called++
                            return nextProps.y !== 42
                        }
                    })
                )
                const B = observer(
                    createClass({
                        render: () => (
                            <span>
                                <C y={y.get()} />
                            </span>
                        )
                    })
                )
                const wrapper = mount(<B />)
                test("init div context === value:5", () => {
                    expect(wrapper.find("div").text()).toBe("value:5")
                    expect(called).toBe(0)
                })

                test("update div context === value:6 and shouldComponentUpdate hook run", () => {
                    y.set(6)
                    expect(wrapper.find("div").text()).toBe("value:6")
                    expect(called).toBe(1)
                })

                test("update div context === value:6 and shouldComponentUpdate hook run 2", () => {
                    y.set(42)
                    // expect(wrapper.find('div').text()).toBe('value:6'); // not updated! TODO: fix
                    expect(called).toBe(2)
                })

                test("update div context === value:7 and shouldComponentUpdate hook run 3", () => {
                    y.set(7)
                    expect(wrapper.find("div").text()).toBe("value:7")
                    expect(called).toBe(3)
                })
            })
        ).toMatchSnapshot()
    })
})

test("issue mobx 405", () => {
    function ExampleState() {
        mobx.extendObservable(this, {
            name: "test",
            get greetings() {
                return "Hello my name is " + this.name
            }
        })
    }

    const ExampleView = observer(
        createClass({
            render() {
                return (
                    <div>
                        <input
                            type="text"
                            onChange={e => (this.props.exampleState.name = e.target.value)}
                            value={this.props.exampleState.name}
                        />
                        <span>{this.props.exampleState.greetings}</span>
                    </div>
                )
            }
        })
    )

    const exampleState = new ExampleState()
    const wrapper = shallow(<ExampleView exampleState={exampleState} />)
    expect(wrapper.find("span").text()).toBe("Hello my name is test")
})

test("#85 Should handle state changing in constructors", done => {
    const a = mobx.observable.box(2)
    const Child = observer(
        createClass({
            displayName: "Child",
            getInitialState() {
                a.set(3) // one shouldn't do this!
                return {}
            },
            render: () => <div>child:{a.get()} - </div>
        })
    )
    const ParentWrapper = observer(function Parent() {
        return (
            <span>
                <Child />parent:{a.get()}
            </span>
        )
    })
    ReactDOM.render(<ParentWrapper />, testRoot, () => {
        expect(testRoot.getElementsByTagName("span")[0].textContent).toBe("child:3 - parent:2")
        a.set(5)
        setTimeout(() => {
            expect(testRoot.getElementsByTagName("span")[0].textContent).toBe("child:5 - parent:5")
            a.set(7)
            setTimeout(() => {
                expect(testRoot.getElementsByTagName("span")[0].textContent).toBe(
                    "child:7 - parent:7"
                )
                testRoot.parentNode.removeChild(testRoot)
                done()
            }, 10)
        }, 10)
    })
})

test("testIsComponentReactive", () => {
    const C = observer(() => null)
    const wrapper = mount(<C />)
    const instance = wrapper.instance()

    expect(C.isMobXReactObserver).toBeTruthy()

    // instance is something different then the rendering reaction!
    expect(mobx.isObservable(instance)).toBeFalsy()
    expect(mobx.isObservable(instance.render)).toBeTruthy()

    mobx.extendObservable(instance, {})
    expect(mobx.isObservable(instance)).toBeTruthy()
})

test("testGetDNode", () => {
    const C = observer(() => null)

    const wrapper = mount(<C />)
    expect(wrapper.instance().render.$mobx).toBeTruthy()
    expect(mobx.getAtom(wrapper.instance().render)).toBeTruthy()

    mobx.extendObservable(wrapper.instance(), {
        x: 3
    })
    expect(mobx.getAtom(wrapper.instance(), "x")).not.toEqual(
        mobx.getAtom(wrapper.instance().render)
    )
})

test("Do not warn about custom shouldComponentUpdate when it is the one provided by ReactiveMixin", () => {
    expect(
        withConsole(() => {
            const A = observer(
                class A extends React.Component {
                    render() {
                        return null
                    }
                }
            )

            observer(
                class B extends A {
                    render() {
                        return null
                    }
                }
            )
        })
    ).toMatchSnapshot()
})
