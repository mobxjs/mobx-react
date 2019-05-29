import React from "react"
import ReactDOM from "react-dom"

// Uglyness to find missing 'act' more easily
// 14-2-19 / React 16.8.1, temporarily work around, as error message misses a stack-trace
Error.stackTraceLimit = Infinity
const origError = console.error
console.error = function(msg) {
    if (/react-wrap-tests-with-act/.test("" + msg)) throw new Error("missing act")
    return origError.apply(this, arguments)
}

export function createTestRoot() {
    if (!window.document.body) {
        window.document.body = document.createElement("body")
    }
    const testRoot = document.createElement("div")
    document.body.appendChild(testRoot)
    return testRoot
}

export function sleepHelper(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}

export function asyncReactDOMRender(Component, root) {
    return new Promise(resolve => {
        ReactDOM.render(Component, root, resolve)
    })
}

export function withConsole(fn) {
    const { warn, error, info } = global.console
    const warnings = []
    const errors = []
    const infos = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}

export async function withAsyncConsole(fn) {
    const { warn, error, info } = global.console
    const warnings = []
    const errors = []
    const infos = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        await fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}
