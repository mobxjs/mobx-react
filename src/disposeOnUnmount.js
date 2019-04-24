import * as React from "react"
import { patch, newSymbol } from "./utils/utils"

const protoStoreKey = newSymbol("disposeOnUnmountProto")
const instStoreKey = newSymbol("disposeOnUnmountInst")

function runDisposersOnWillUnmount() {
    ;[...(this[protoStoreKey] || []), ...(this[instStoreKey] || [])].forEach(propKeyOrFunction => {
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

    // decorator's target is the prototype, so it doesn't have any instance properties like props
    const isDecorator = !target.hasOwnProperty("props")

    // add property key / function we want run (disposed) to the store
    const componentWasAlreadyModified = !!target[protoStoreKey] || !!target[instStoreKey]
    const store = isDecorator
        ? // decorators are added to the prototype store
          target[protoStoreKey] || (target[protoStoreKey] = [])
        : // functions are added to the instance store
          target[instStoreKey] || (target[instStoreKey] = [])

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
