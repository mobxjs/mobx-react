import * as React from "react"
import { patch, newSymbol } from "./utils/utils"

const storeKey = newSymbol("disposeOnUnmount")

function runDisposersOnWillUnmount() {
    if (!this[storeKey]) {
        // when disposeOnUnmount is only set to some instances of a component it will still patch the prototype
        return
    }
    this[storeKey].forEach(propKeyOrFunction => {
        const prop =
            typeof propKeyOrFunction === "string" ? this[propKeyOrFunction] : propKeyOrFunction
        if (prop !== undefined && prop !== null) {
            if (typeof prop !== "function") {
                throw new Error(
                    "[mobx-react] disposeOnUnmount only works on functions such as disposers returned by reactions, autorun, etc."
                )
            }
            prop()
        }
    })
    this[storeKey] = []
}

export function disposeOnUnmount(target, propertyKeyOrFunction) {
    if (Array.isArray(propertyKeyOrFunction)) {
        return propertyKeyOrFunction.map(fn => disposeOnUnmount(target, fn))
    }

    if (!target instanceof React.Component) {
        throw new Error("[mobx-react] disposeOnUnmount only works on class based React components.")
    }

    if (typeof propertyKeyOrFunction !== "string" && typeof propertyKeyOrFunction !== "function") {
        throw new Error(
            "[mobx-react] disposeOnUnmount only works if the parameter is either a property key or a function."
        )
    }

    // add property key / function we want run (disposed) to the store
    const componentWasAlreadyModified = !!target[storeKey]
    const store = target[storeKey] || (target[storeKey] = [])

    store.push(propertyKeyOrFunction)

    // tweak the component class componentWillUnmount if not done already
    if (!componentWasAlreadyModified) {
        patch(target, "componentWillUnmount", runDisposersOnWillUnmount)
    }

    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunction !== "string") {
        return propertyKeyOrFunction
    }
}
