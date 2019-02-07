import * as React from "react"
import { patch, newSymbol } from "./utils/utils"

const storeKey = newSymbol("disposeOnUnmount")

function checkFunc(prop) {
    if (typeof prop !== "function") {
        throw new Error(
            "[mobx-react] disposeOnUnmount only works on functions such as disposers returned by reactions, autorun, etc."
        )
    }
}

function check(prop) {
    if (Array.isArray(prop)) {
        prop.map(checkFunc)
    } else {
        checkFunc(prop)
    }
}

function runDisposersOnWillUnmount() {
    if (!this[storeKey]) {
        // when disposeOnUnmount is only set to some instances of a component it will still patch the prototype
        return
    }
    this[storeKey].forEach(propKeyOrFunction => {
        const prop =
            typeof propKeyOrFunction === "string" ? this[propKeyOrFunction] : propKeyOrFunction
        if (prop !== undefined && prop !== null) {
            check(prop)
            if (Array.isArray(prop)) prop.map(f => f())
            else prop()
        }
    })
    this[storeKey] = []
}

export function disposeOnUnmount(target, propertyKeyOrFunctionOrArray) {
    if (!target instanceof React.Component) {
        throw new Error("[mobx-react] disposeOnUnmount only works on class based React components.")
    }

    if (typeof propertyKeyOrFunctionOrArray !== "string") {
        check(propertyKeyOrFunctionOrArray)
    }

    // add property key / function we want run (disposed) to the store
    const componentWasAlreadyModified = !!target[storeKey]
    const store = target[storeKey] || (target[storeKey] = [])

    store.push(propertyKeyOrFunctionOrArray)

    // tweak the component class componentWillUnmount if not done already
    if (!componentWasAlreadyModified) {
        patch(target, "componentWillUnmount", runDisposersOnWillUnmount)
    }

    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunctionOrArray !== "string") {
        return propertyKeyOrFunctionOrArray
    }
}
