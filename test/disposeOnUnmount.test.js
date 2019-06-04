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

test("should error on inheritance", async () => {
    class C extends React.Component {
        render() {
            return null
        }
    }

    expect(() => {
        class B extends C {
            @disposeOnUnmount
            fn() {
                dCalled++
            }
        }
    }).toThrow("disposeOnUnmount only supports direct subclasses")
})

test("should error on inheritance - 2", async () => {
    class C extends React.Component {
        render() {
            return null
        }
    }

    class B extends C {
        constructor() {
            super()
            expect(() => {
                this.fn = disposeOnUnmount(this, function() {})
            }).toThrow("disposeOnUnmount only supports direct subclasses")
        }
    }

    await asyncReactDOMRender(<B />, testRoot)
})

describe("should works with arrays", async () => {
    test("as function", async () => {
        class C extends React.Component {
            methodA = jest.fn()
            methodB = jest.fn()

            componentDidMount() {
                disposeOnUnmount(this, [this.methodA, this.methodB])
            }

            render() {
                return null
            }
        }

        await testComponent(C)
    })

    test("as decorator", async () => {
        class C extends React.Component {
            methodA = jest.fn()
            methodB = jest.fn()

            @disposeOnUnmount
            disposers = [this.methodA, this.methodB]

            render() {
                return null
            }
        }

        await testComponent(C)
    })
})
