import * as React from "react"
import { createTestRoot, asyncReactDOMRender } from "./"
import { patch } from "../src/utils/utils"

const testRoot = createTestRoot()

async function testComponent(C, didMountMixin, willUnmountMixin, doMixinTest = true) {
    if (doMixinTest) {
        expect(didMountMixin).not.toHaveBeenCalled()
        expect(willUnmountMixin).not.toHaveBeenCalled()
    }

    await asyncReactDOMRender(<C />, testRoot)

    if (doMixinTest) {
        expect(didMountMixin).toHaveBeenCalledTimes(1)
        expect(willUnmountMixin).not.toHaveBeenCalled()
    }

    await asyncReactDOMRender(null, testRoot)

    if (doMixinTest) {
        expect(didMountMixin).toHaveBeenCalledTimes(1)
        expect(willUnmountMixin).toHaveBeenCalledTimes(1)
    }
}

test("no overrides", async () => {
    const cdm = jest.fn()
    const cwu = jest.fn()
    class C extends React.Component {
        render() {
            return null
        }
    }
    patch(C.prototype, "componentDidMount", cdm)
    patch(C.prototype, "componentWillUnmount", cwu)

    await testComponent(C, cdm, cwu)
})

test("prototype overrides", async () => {
    const cdm = jest.fn()
    const cwu = jest.fn()
    let cdmCalls = 0
    let cwuCalls = 0
    class C extends React.Component {
        componentDidMount() {
            cdmCalls++
        }
        componentWillUnmount() {
            cwuCalls++
        }
        render() {
            return null
        }
    }
    patch(C.prototype, "componentDidMount", cdm)
    patch(C.prototype, "componentWillUnmount", cwu)

    await testComponent(C, cdm, cwu)
    expect(cdmCalls).toBe(1)
    expect(cwuCalls).toBe(1)
})

test("arrow function overrides", async () => {
    const cdm = jest.fn()
    const cwu = jest.fn()
    let cdmCalls = 0
    let cwuCalls = 0
    class C extends React.Component {
        componentDidMount = () => {
            cdmCalls++
        }
        componentWillUnmount = () => {
            cwuCalls++
        }
        render() {
            return null
        }
    }
    patch(C.prototype, "componentDidMount", cdm)
    patch(C.prototype, "componentWillUnmount", cwu)

    await testComponent(C, cdm, cwu)
    expect(cdmCalls).toBe(1)
    expect(cwuCalls).toBe(1)
})

test("recursive calls", async () => {
    const cdm = jest.fn()
    const cwu = jest.fn()
    let cdmCalls = 0
    let cwuCalls = 0
    class C extends React.Component {
        componentDidMount() {
            cdmCalls++
            while (cdmCalls < 10) {
                this.componentDidMount()
            }
        }
        componentWillUnmount() {
            cwuCalls++
            while (cwuCalls < 10) {
                this.componentWillUnmount()
            }
        }
        render() {
            return null
        }
    }
    patch(C.prototype, "componentDidMount", cdm)
    patch(C.prototype, "componentWillUnmount", cwu)

    await testComponent(C, cdm, cwu)
    expect(cdmCalls).toBe(10)
    expect(cwuCalls).toBe(10)
})

test("prototype + arrow function overrides", async () => {
    const cdm = jest.fn()
    const cwu = jest.fn()
    let cdmCalls = 0
    let cwuCalls = 0
    class C extends React.Component {
        componentDidMount() {
            cdmCalls++
        }
        componentWillUnmount() {
            cwuCalls++
        }
        render() {
            return null
        }
        constructor(props) {
            super(props)
            this.componentDidMount = () => {
                cdmCalls++
            }
            this.componentWillUnmount = () => {
                cwuCalls++
            }
        }
    }
    patch(C.prototype, "componentDidMount", cdm)
    patch(C.prototype, "componentWillUnmount", cwu)

    await testComponent(C, cdm, cwu)
    expect(cdmCalls).toBe(1)
    expect(cwuCalls).toBe(1)
})

describe("inheritance with prototype methods", async () => {
    async function doTest(patchBase, patchOther, callSuper) {
        const cdm = jest.fn()
        const cwu = jest.fn()
        let cdmCalls = 0
        let cwuCalls = 0

        class B extends React.Component {
            componentDidMount() {
                cdmCalls++
            }
            componentWillUnmount() {
                cwuCalls++
            }
        }

        class C extends B {
            componentDidMount() {
                if (callSuper) {
                    super.componentDidMount()
                }
                cdmCalls++
            }
            componentWillUnmount() {
                if (callSuper) {
                    super.componentWillUnmount()
                }
                cwuCalls++
            }
            render() {
                return null
            }
        }

        if (patchBase) {
            patch(B.prototype, "componentDidMount", cdm)
            patch(B.prototype, "componentWillUnmount", cwu)
        }
        if (patchOther) {
            patch(C.prototype, "componentDidMount", cdm)
            patch(C.prototype, "componentWillUnmount", cwu)
        }

        await testComponent(C, cdm, cwu, patchBase || patchOther)
        expect(cdmCalls).toBe(callSuper ? 2 : 1)
        expect(cwuCalls).toBe(callSuper ? 2 : 1)
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
        const cdm = jest.fn()
        const cwu = jest.fn()
        let cdmCalls = 0
        let cwuCalls = 0

        class B extends React.Component {
            componentDidMount() {
                cdmCalls++
            }
            componentWillUnmount() {
                cwuCalls++
            }
        }

        class C extends B {
            componentDidMount = () => {
                if (callSuper) {
                    super.componentDidMount()
                }
                cdmCalls++
            }
            componentWillUnmount = () => {
                if (callSuper) {
                    super.componentWillUnmount()
                }
                cwuCalls++
            }
            render() {
                return null
            }
        }

        if (patchBase) {
            patch(B.prototype, "componentDidMount", cdm)
            patch(B.prototype, "componentWillUnmount", cwu)
        }
        if (patchOther) {
            patch(C.prototype, "componentDidMount", cdm)
            patch(C.prototype, "componentWillUnmount", cwu)
        }

        await testComponent(C, cdm, cwu, patchBase || patchOther)
        expect(cdmCalls).toBe(callSuper ? 2 : 1)
        expect(cwuCalls).toBe(callSuper ? 2 : 1)
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

test("custom decorator #579", async () => {
    async function doTest(customFirst) {
        const customDidMount = jest.fn()
        const customConstruct = jest.fn()

        function logMountingPerformance() {
            return target => {
                var original = target
                var instance

                // a utility function to generate instances of a class
                function construct(oldConstructor, args) {
                    var c = function() {
                        return oldConstructor.apply(this, args)
                    }
                    c.prototype = oldConstructor.prototype
                    instance = new c()

                    customConstruct()
                    return instance
                }

                // the new constructor behaviour
                var f = function(...args) {
                    return construct(original, args)
                }

                var originalComponentDidMount = original.prototype.componentDidMount
                // copy prototype so intanceof operator still works
                f.prototype = original.prototype

                f.prototype.componentDidMount = function() {
                    var returnValue
                    if (originalComponentDidMount) {
                        returnValue = originalComponentDidMount.apply(instance)
                    }
                    customDidMount()
                    return returnValue
                }

                // return new constructor (will override original)
                return f
            }
        }

        const cdm = jest.fn()
        const cwu = jest.fn()
        let cdmCalls = 0
        let cwuCalls = 0

        class C extends React.Component {
            componentDidMount() {
                cdmCalls++
            }
            componentWillUnmount() {
                cwuCalls++
            }
            render() {
                return null
            }
        }
        if (customFirst) {
            C = logMountingPerformance()(C)
        }
        patch(C.prototype, "componentDidMount", cdm)
        patch(C.prototype, "componentWillUnmount", cwu)
        if (!customFirst) {
            C = logMountingPerformance()(C)
        }

        expect(customConstruct).toHaveBeenCalledTimes(0)
        expect(customDidMount).toHaveBeenCalledTimes(0)

        await testComponent(C, cdm, cwu)
        expect(cdmCalls).toBe(1)
        expect(cwuCalls).toBe(1)

        expect(customConstruct).toHaveBeenCalledTimes(1)
        expect(customDidMount).toHaveBeenCalledTimes(1)
    }

    await doTest(true)
    await doTest(false)
})
