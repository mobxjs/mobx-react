import { configure } from "enzyme"
import Adapter from "enzyme-adapter-react-16"
import React from "react"
import ReactDOM from "react-dom"

configure({ adapter: new Adapter() })

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
