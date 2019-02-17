import * as React from "react"
import { newSymbol } from "./utils/utils"

const storeKey = newSymbol("disposeOnUnmount")
const baseUnmountKey = newSymbol("originalOnUnmount")

function runDisposersOnWillUnmount() {
    if (this[baseUnmountKey]) this[baseUnmountKey]()
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

    const c = Object.getPrototypeOf(target).constructor || Object.getPrototypeOf(target.constructor)
    const c2 = Object.getPrototypeOf(target.constructor)
    if (
        !(
            c === React.Component ||
            c === React.PureComponent ||
            c2 === React.Component ||
            c2 === React.PureComponent
        )
    ) {
        throw new Error(
            "[mobx-react] disposeOnUnmount only supports direct subclasses of React.Component or React.PureComponent."
        )
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
        // make sure original definition is invoked
        if (target.componentWillUnmount) target[baseUnmountKey] = target.componentWillUnmount

        Object.defineProperty(target, "componentWillUnmount", {
            get() {
                return runDisposersOnWillUnmount
            },
            set(fn) {
                // this will happen if componentWillUnmount is being assigned after patching the prototype
                this[storeKey].push(fn)
                // assigning a new local value to componentWillUnmount would hide the super implementation...
                this[baseUnmountKey] = undefined
            },
            configurable: false,
            enumerable: false
        })
    }

    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunction !== "string") {
        return propertyKeyOrFunction
    }
}
