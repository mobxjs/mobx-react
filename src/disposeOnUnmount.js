import * as React from "react"
import { newSymbol } from "./utils/utils"

const protoStoreKey = newSymbol("disposeOnUnmountProto")
const instStoreKey = newSymbol("disposeOnUnmountInst")

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

export function runDisposersOnWillUnmount() {
    ;[...(this[protoStoreKey] || []), ...(this[instStoreKey] || [])].forEach(propKeyOrFunction => {
        const prop =
            typeof propKeyOrFunction === "string" ? this[propKeyOrFunction] : propKeyOrFunction
        if (prop !== undefined && prop !== null) {
            check(prop)
            if (Array.isArray(prop)) prop.map(f => f.call(this))
            else prop.call(this)
        }
    })
}

export function disposeOnUnmount(target, propertyKeyOrFunction) {
    if (Array.isArray(propertyKeyOrFunction)) {
        return propertyKeyOrFunction.map(fn => disposeOnUnmount(target, fn))
    }

    if (typeof propertyKeyOrFunction !== "string") {
        check(propertyKeyOrFunction)
    }

    // decorator's target is the prototype, so it doesn't have any instance properties like props
    const isDecorator = typeof propertyKeyOrFunction === "string"

    // add property key / function we want run (disposed) to the store
    const store = isDecorator
        ? // decorators are added to the prototype store
          target[protoStoreKey] || (target[protoStoreKey] = [])
        : // functions are added to the instance store
          target[instStoreKey] || (target[instStoreKey] = [])

    store.push(propertyKeyOrFunction)

    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunction !== "string") {
        return propertyKeyOrFunction
    }
}
