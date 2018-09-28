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

    expect(cref.methodA).toHaveBeenCalled()
    expect(cref.methodB).toHaveBeenCalled()
    if (afterUnmount) {
        afterUnmount(cref)
    }
}

describe("without observer", () => {
    test("class without componentWillUnmount", async () => {
        class C extends React.Component {
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

            render() {
                return null
            }
        }

        await testComponent(C)
    })

    test("class with componentWillUnmount in the prototype", async () => {
        let called = 0

        class C extends React.Component {
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

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
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

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
        let methodA = jest.fn()
        let methodB = jest.fn()
        class C extends React.Component {
            render() {
                return null
            }

            methodA = disposeOnUnmount(this, jest.fn())
            methodB = disposeOnUnmount(this, jest.fn())

            constructor(props) {
                super(props)
                disposeOnUnmount(this, methodA)
                disposeOnUnmount(this, methodB)
            }
        }

        await testComponent(C)
    })
})

describe("with observer", () => {
    test("class without componentWillUnmount", async () => {
        @observer
        class C extends React.Component {
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

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
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

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
            @disposeOnUnmount methodA = jest.fn()
            @disposeOnUnmount methodB = jest.fn()
            @disposeOnUnmount methodC = null
            @disposeOnUnmount methodD = undefined

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
        let methodA = jest.fn()
        let methodB = jest.fn()

        @observer
        class C extends React.Component {
            render() {
                return null
            }

            methodA = disposeOnUnmount(this, jest.fn())
            methodB = disposeOnUnmount(this, jest.fn())

            constructor(props) {
                super(props)
                disposeOnUnmount(this, methodA)
                disposeOnUnmount(this, methodB)
            }
        }

        await testComponent(C)
    })
})
