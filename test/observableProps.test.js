import * as React from "react"
import * as mobx from "mobx"
import { observer } from "../src"
import { observableProps } from "../src/observableProps"
import { createTestRoot, asyncReactDOMRender } from "./index"
import { getMobxCapabilities } from "../src/utils/mobxCapabilities"

const testRoot = createTestRoot()

if (!getMobxCapabilities().canDetectNewProperties) {
    it("observableProps should throw when using mobx4", async () => {
        let errorThrown

        const C = observer(
            class C extends React.Component {
                constructor(props) {
                    super(props)
                    try {
                        this.oProps = observableProps(this)
                    } catch (e) {
                        errorThrown = e
                    }
                }

                render() {
                    return null
                }
            }
        )

        await asyncReactDOMRender(<C />, testRoot)
        expect(errorThrown).toBeTruthy()
        expect(errorThrown.message).toMatch("observableProps requires mobx 5 or higher")
    })
} else {
    describe(`verify change of non-accessed prop do not trigger reaction`, async () => {
        const computedCalls = []
        let renders = 0

        const Component = observer(
            class Component extends React.Component {
                constructor(props) {
                    super(props)

                    this.oProps = observableProps(this)

                    this.computedWithProp1 = mobx.computed(() => {
                        const prop1Value = this.oProps.prop1
                        computedCalls.push("prop1: " + JSON.stringify(prop1Value))
                        return prop1Value
                    })

                    this.computedWithProp2 = mobx.computed(() => {
                        const prop2Value = this.oProps.prop2
                        computedCalls.push("prop2: " + JSON.stringify(prop2Value))
                        return prop2Value
                    })

                    this.deepComputed = mobx.computed(() => {
                        const prop3Value = this.oProps.prop3 && this.oProps.prop3.x
                        computedCalls.push("prop3.x: " + JSON.stringify(prop3Value))
                        return prop3Value
                    })

                    this.computedComponent = mobx.computed(() => {
                        const value = this.oProps.componentProp
                        computedCalls.push("componentProp: " + JSON.stringify(!!value))
                        return value
                    })
                }

                render() {
                    this.computedWithProp1.get()
                    this.computedWithProp2.get()
                    this.deepComputed.get()
                    this.computedComponent.get()
                    renders++
                    return null
                }
            }
        )

        const Container = observer(
            class Container extends React.Component {
                constructor(props) {
                    super(props)
                    this.oProps = observableProps(this)
                }

                render() {
                    return this.oProps.renderStore.get()()
                }
            }
        )

        const renderFnStore = mobx.observable.box(function() {
            return null
        })

        beforeEach(() => {
            computedCalls.length = 0
            renders = 0
        })

        it("initial state", async () => {
            await asyncReactDOMRender(<Container renderStore={renderFnStore} />, testRoot)
            renderFnStore.set(function() {
                return <Component prop1={1} />
            })
            expect(computedCalls).toEqual([
                "prop1: 1",
                "prop2: undefined",
                "prop3.x: undefined",
                "componentProp: false"
            ])
            expect(renders).toBe(1)
        })

        it("prop1 changed from 1 to 2, prop2 is untouched", async () => {
            renderFnStore.set(function() {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("prop1 is untouched, prop2 appears", async () => {
            renderFnStore.set(function() {
                return <Component prop1={2} prop2={1} />
            })
            expect(computedCalls).toEqual(["prop2: 1"])
            expect(renders).toBe(1)
        })

        it("prop1 is untouched, prop2 changes from 1 to 2", async () => {
            renderFnStore.set(function() {
                return <Component prop1={2} prop2={2} />
            })
            expect(computedCalls).toEqual(["prop2: 2"])
            expect(renders).toBe(1)
        })

        it("prop2 is untouched, prop1 changes from 2 to 1", async () => {
            renderFnStore.set(function() {
                return <Component prop1={1} prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: 1"])
            expect(renders).toBe(1)
        })

        it("nothing changed - no recalc", async () => {
            renderFnStore.set(function() {
                return <Component prop1={1} prop2={2} />
            })
            expect(computedCalls).toEqual([])
            expect(renders).toBe(0) // no re-render needed
        })

        it("prop1 disappear, prop2 is untouched", async () => {
            renderFnStore.set(function() {
                return <Component prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("if we replace prop2 to prop1, both computeds should be recalculated", async () => {
            renderFnStore.set(function() {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2", "prop2: undefined"])
            expect(renders).toBe(1)
        })

        it("remove prop1 should only recalc prop1", async () => {
            renderFnStore.set(function() {
                return <Component />
            })
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("correctly catch prop1 appearing after disappearing", async () => {
            renderFnStore.set(function() {
                return <Component prop1={2} />
            })
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("swap again - all recalculated", async () => {
            renderFnStore.set(function() {
                return <Component prop2={2} />
            })
            expect(computedCalls).toEqual(["prop1: undefined", "prop2: 2"])
            expect(renders).toBe(1)
        })

        it("remove all", async () => {
            renderFnStore.set(function() {
                return <Component />
            })
            expect(computedCalls).toEqual(["prop2: undefined"])
            expect(renders).toBe(1)
        })

        let dp = mobx.observable({})

        it("(obs object) deep prop with empty object", async () => {
            renderFnStore.set(function() {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        it("(obs object) deep prop with value set", async () => {
            mobx.set(dp, "x", 5)
            renderFnStore.set(function() {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(obs object) deep prop with value removed", async () => {
            mobx.remove(dp, "x")
            renderFnStore.set(function() {
                return <Component prop3={dp} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        it("(new obj) deep prop with empty object", async () => {
            renderFnStore.set(function() {
                return <Component prop3={{}} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        it("(new obj) deep prop with value set", async () => {
            renderFnStore.set(function() {
                return <Component prop3={{ x: 5 }} />
            })
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(new obj) deep prop with value removed", async () => {
            renderFnStore.set(function() {
                return <Component prop3={{}} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        it("passing a component works", async () => {
            renderFnStore.set(function() {
                return <Component componentProp={<div>hi</div>} />
            })
            expect(computedCalls).toEqual(["prop3.x: undefined", "componentProp: true"])
            expect(renders).toBe(1)
        })
    })
}
