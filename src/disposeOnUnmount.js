import * as React from "react"
import { patch } from "./utils/utils"

const storeKey = "__$mobxDisposeOnUnmount"

function customComponentWillUnmount() {
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
    target[storeKey] = target[storeKey] || []
    const store = target[storeKey]

    store.push(propertyKeyOrFunction)

    // tweak the component class componentWillUnmount if not done already
    if (!componentWasAlreadyModified) {
        patch(target, "componentWillUnmount", customComponentWillUnmount, false)
    }

    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunction !== "string") {
        return propertyKeyOrFunction
    }
}
