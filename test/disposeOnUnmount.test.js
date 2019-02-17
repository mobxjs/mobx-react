import * as React from "react"
import { disposeOnUnmount, observer } from "../src"
import { createTestRoot, asyncReactDOMRender } from "./"

const testRoot = createTestRoot()

async function testComponent(C, afterMount, afterUnmount) {
    const ref = React.createRef()
    await asyncReactDOMRender(<C ref={ref} />, testRoot)

    let cref = ref.current
    expect(cref.methodA).not.toHaveBeenCalled()
    expect(cref.methodB).not.toHaveBeenCalled()
    if (afterMount) {
        afterMount(cref)
    }

    await asyncReactDOMRender(null, testRoot)

    expect(cref.methodA).toHaveBeenCalledTimes(1)
    expect(cref.methodB).toHaveBeenCalledTimes(1)
    if (afterUnmount) {
        afterUnmount(cref)
    }
}

describe("without observer", () => {
    test("class without componentWillUnmount", async () => {
        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }
        }

        await testComponent(C)
    })

    test("class with componentWillUnmount in the prototype", async () => {
        let called = 0

        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }

            componentWillUnmount() {
                called++
            }
        }

        await testComponent(
            C,
            () => {
                expect(called).toBe(0)
            },
            () => {
                expect(called).toBe(1)
            }
        )
    })

    test("class with componentWillUnmount as an arrow function", async () => {
        let called = 0

        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }

            componentWillUnmount = () => {
                called++
            }
        }

        await testComponent(
            C,
            () => {
                expect(called).toBe(0)
            },
            () => {
                expect(called).toBe(1)
            }
        )
    })

    test("class without componentWillUnmount using non decorator version", async () => {
        let methodC = jest.fn()
        let methodD = jest.fn()
        class C extends React.Component {
            render() {
                return null
            }

            methodA = disposeOnUnmount(this, jest.fn())
            methodB = disposeOnUnmount(this, jest.fn())

            constructor(props) {
                super(props)
                disposeOnUnmount(this, [methodC, methodD])
            }
        }

        await testComponent(
            C,
            () => {
                expect(methodC).not.toHaveBeenCalled()
                expect(methodD).not.toHaveBeenCalled()
            },
            () => {
                expect(methodC).toHaveBeenCalledTimes(1)
                expect(methodD).toHaveBeenCalledTimes(1)
            }
        )
    })
})

describe("with observer", () => {
    test("class without componentWillUnmount", async () => {
        @observer
        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }
        }

        await testComponent(C)
    })

    test("class with componentWillUnmount in the prototype", async () => {
        let called = 0

        @observer
        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }

            componentWillUnmount() {
                called++
            }
        }

        await testComponent(
            C,
            () => {
                expect(called).toBe(0)
            },
            () => {
                expect(called).toBe(1)
            }
        )
    })

    test("class with componentWillUnmount as an arrow function", async () => {
        let called = 0

        @observer
        class C extends React.Component {
            @disposeOnUnmount
            methodA = jest.fn()
            @disposeOnUnmount
            methodB = jest.fn()
            @disposeOnUnmount
            methodC = null
            @disposeOnUnmount
            methodD = undefined

            render() {
                return null
            }

            componentWillUnmount = () => {
                called++
            }
        }

        await testComponent(
            C,
            () => {
                expect(called).toBe(0)
            },
            () => {
                expect(called).toBe(1)
            }
        )
    })

    test("class without componentWillUnmount using non decorator version", async () => {
        let methodC = jest.fn()
        let methodD = jest.fn()

        @observer
        class C extends React.Component {
            render() {
                return null
            }

            methodA = disposeOnUnmount(this, jest.fn())
            methodB = disposeOnUnmount(this, jest.fn())

            constructor(props) {
                super(props)
                disposeOnUnmount(this, [methodC, methodD])
            }
        }

        await testComponent(
            C,
            () => {
                expect(methodC).not.toHaveBeenCalled()
                expect(methodD).not.toHaveBeenCalled()
            },
            () => {
                expect(methodC).toHaveBeenCalledTimes(1)
                expect(methodD).toHaveBeenCalledTimes(1)
            }
        )
    })
})

test("custom patching should work", async () => {
    class BaseComponent extends React.Component {
        constructor(props, context) {
            super(props, context)

            _makeAllSafe(this, BaseComponent.prototype, [
                "componentWillMount",
                "componentDidMount",
                "componentWillUpdate",
                "componentWillReceiveProps",
                "render",
                "componentDidUpdate",
                "componentWillUnmount"
            ])
        }

        componentDidMount() {
            this.didMountCalled = true
        }

        componentWillUnmount() {
            this.willUnmountCalled = true
        }
    }

    function _makeAllSafe(obj, prototype, methodNames) {
        for (let i = 0, len = methodNames.length; i < len; i++) {
            _makeSafe(obj, prototype, methodNames[i])
        }
    }

    function _makeSafe(obj, prototype, methodName) {
        let classMethod = obj[methodName]
        let prototypeMethod = prototype[methodName]

        if (classMethod || prototypeMethod) {
            obj[methodName] = function() {
                this.patchRunFor = this.patchRunFor || []
                this.patchRunFor.push(methodName)

                let retVal

                if (prototypeMethod) {
                    retVal = prototypeMethod.apply(this, arguments)
                }
                if (classMethod !== prototypeMethod) {
                    retVal = classMethod.apply(this, arguments)
                }

                return retVal
            }
        }
    }

    @observer
    class C extends BaseComponent {
        @disposeOnUnmount
        methodA = jest.fn()
        @disposeOnUnmount
        methodB = jest.fn()
        @disposeOnUnmount
        methodC = null
        @disposeOnUnmount
        methodD = undefined

        render() {
            return null
        }
    }

    await testComponent(
        C,
        ref => {
            expect(ref.patchRunFor).toEqual(["render", "componentDidMount"])
            expect(ref.didMountCalled).toBeTruthy()
        },
        ref => {
            expect(ref.patchRunFor).toEqual(["render", "componentDidMount", "componentWillUnmount"])
            expect(ref.willUnmountCalled).toBeTruthy()
        }
    )
})

describe("super calls should work", async () => {
    async function doTest(baseObserver, cObserver) {
        const events = []

        const sharedMethod = jest.fn()

        class BaseComponent extends React.Component {
            @disposeOnUnmount
            method0 = sharedMethod

            @disposeOnUnmount
            methodA = jest.fn()

            componentDidMount() {
                events.push("baseDidMount")
            }

            componentWillUnmount() {
                events.push("baseWillUnmount")
            }
        }

        class C extends BaseComponent {
            @disposeOnUnmount
            method0 = sharedMethod

            @disposeOnUnmount
            methodB = jest.fn()

            componentDidMount() {
                super.componentDidMount()
                events.push("CDidMount")
            }

            componentWillUnmount() {
                super.componentWillUnmount()
                events.push("CWillUnmount")
            }

            render() {
                return null
            }
        }

        if (baseObserver) {
            BaseComponent = observer(BaseComponent)
        }
        if (cObserver) {
            C = observer(C)
        }

        await testComponent(
            C,
            ref => {
                expect(events).toEqual(["baseDidMount", "CDidMount"])
                expect(sharedMethod).toHaveBeenCalledTimes(0)
            },
            ref => {
                expect(events).toEqual([
                    "baseDidMount",
                    "CDidMount",
                    "baseWillUnmount",
                    "CWillUnmount"
                ])
                expect(sharedMethod).toHaveBeenCalledTimes(2)
            }
        )
    }

    it("none is observer", async () => {
        await doTest(false, false)
    })
    it("base is observer", async () => {
        await doTest(true, false)
    })
    it("C is observer", async () => {
        await doTest(false, true)
    })
    it("both observers", async () => {
        await doTest(true, true)
    })
})

it("componentDidMount should be different between components", async () => {
    async function doTest(withObserver) {
        const events = []

        class A extends React.Component {
            componentDidMount() {
                this.didMount = "A"
                events.push("mountA")
            }

            componentWillUnmount() {
                this.willUnmount = "A"
                events.push("unmountA")
            }

            render() {
                return null
            }
        }

        class B extends React.Component {
            componentDidMount() {
                this.didMount = "B"
                events.push("mountB")
            }

            componentWillUnmount() {
                this.willUnmount = "B"
                events.push("unmountB")
            }

            render() {
                return null
            }
        }

        if (withObserver) {
            A = observer(A)
            B = observer(B)
        }

        const aRef = React.createRef()
        await asyncReactDOMRender(<A ref={aRef} />, testRoot)
        const caRef = aRef.current

        expect(caRef.didMount).toBe("A")
        expect(caRef.willUnmount).toBeUndefined()
        expect(events).toEqual(["mountA"])

        const bRef = React.createRef()
        await asyncReactDOMRender(<B ref={bRef} />, testRoot)
        const cbRef = bRef.current

        expect(caRef.didMount).toBe("A")
        expect(caRef.willUnmount).toBe("A")

        expect(cbRef.didMount).toBe("B")
        expect(cbRef.willUnmount).toBeUndefined()
        expect(events).toEqual(["mountA", "unmountA", "mountB"])

        await asyncReactDOMRender(null, testRoot)

        expect(caRef.didMount).toBe("A")
        expect(caRef.willUnmount).toBe("A")

        expect(cbRef.didMount).toBe("B")
        expect(cbRef.willUnmount).toBe("B")
        expect(events).toEqual(["mountA", "unmountA", "mountB", "unmountB"])
    }

    await doTest(true)
    await doTest(false)
})

describe("inheritance with prototype methods", async () => {
    async function doTest(patchBase, patchOther, callSuper) {
        let Bcall = 0
        let Ccall = 0
        let c = 0
        let c2 = 0

        class B extends React.Component {
            componentWillUnmount() {
                Bcall++
            }
        }

        class C extends B {
            componentWillUnmount() {
                if (callSuper) {
                    super.componentWillUnmount()
                }
                Ccall++
            }
            render() {
                return null
            }
        }

        if (patchBase) {
            let target = B.prototype
            target.fn = () => {
                c++
            }
            disposeOnUnmount(target, "fn")
        }

        if (patchOther) {
            let target2 = C.prototype
            target2.fn2 = () => {
                c2++
            }
            disposeOnUnmount(target2, "fn2")
        }

        await asyncReactDOMRender(<C />, testRoot)
        await asyncReactDOMRender(null, testRoot)

        expect(Ccall).toBe(1)
        expect(c).toBe(patchBase ? 1 : 0)
        expect(Bcall).toBe(callSuper ? 1 : 0)
        expect(c2).toBe(patchOther ? 1 : 0)
    }

    for (const base of [false, true]) {
        for (const other of [false, true]) {
            for (const callSuper of [false, true]) {
                test(`base: ${base}, other: ${other}, callSuper: ${callSuper}`, async () => {
                    if (base && !other && !callSuper) {
                        // this one is expected to fail, since we are patching only the base and the other one totally ignores the base method
                        try {
                            await doTest(base, other, callSuper)
                            fail("should have failed")
                        } catch (e) {}
                    } else {
                        await doTest(base, other, callSuper)
                    }
                })
            }
        }
    }
})

describe("inheritance with arrow functions", async () => {
    async function doTest(patchBase, patchOther, callSuper) {
        let Bcall = 0
        let Ccall = 0
        let c = 0
        let c2 = 0

        class B extends React.Component {
            constructor() {
                super()
                if (patchBase) {
                    this.fn = function() {
                        c++
                    }
                    disposeOnUnmount(this, this.fn)
                }
            }
            componentWillUnmount() {
                Bcall++
            }
        }

        class C extends B {
            constructor() {
                super()
                if (patchOther) {
                    this.fn2 = function() {
                        c2++
                    }
                    disposeOnUnmount(this, this.fn2)
                }
            }
            componentWillUnmount = () => {
                if (callSuper) {
                    super.componentWillUnmount()
                }
                Ccall++
            }
            render() {
                return null
            }
        }

        await asyncReactDOMRender(<C />, testRoot)
        await asyncReactDOMRender(null, testRoot)

        expect(c).toBe(patchBase ? 1 : 0)
        expect(c2).toBe(patchOther ? 1 : 0)
        expect(Ccall).toBe(1)
        expect(Bcall).toBe(callSuper ? 1 : 0)
    }

    for (const base of [false, true]) {
        for (const other of [false, true]) {
            for (const callSuper of [false, true]) {
                test(`base: ${base}, other: ${other}, callSuper: ${callSuper}`, async () => {
                    await doTest(base, other, callSuper)
                })
            }
        }
    }
})

test("base cWU should not be called if overriden", async () => {
    let baseCalled = 0
    let dCalled = 0
    let oCalled = 0

    class C extends React.Component {
        componentWillUnmount() {
            baseCalled++
        }

        constructor() {
            super()
            this.componentWillUnmount = () => {
                oCalled++
            }
        }

        render() {
            return null
        }

        @disposeOnUnmount
        fn() {
            dCalled++
        }
    }

    await asyncReactDOMRender(<C />, testRoot)
    await asyncReactDOMRender(null, testRoot)
    expect(dCalled).toBe(1)
    expect(oCalled).toBe(1)
    expect(baseCalled).toBe(0)
})
