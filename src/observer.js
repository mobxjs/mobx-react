import React, { Component, forwardRef, memo } from "react"
import { _allowStateChanges } from "mobx"
import { observer as observerLite, Observer } from "mobx-react-lite"

import { makeClassComponentObserver } from "./observerClass"

const hasSymbol = typeof Symbol === "function" && Symbol.for

// Using react-is had some issues (and operates on elements, not on types), see #608 / #609
const ReactForwardRefSymbol = hasSymbol
    ? Symbol.for("react.forward_ref")
    : typeof forwardRef === "function" && forwardRef((_props, _ref) => {})["$$typeof"]

const ReactMemoSymbol = hasSymbol
    ? Symbol.for("react.memo")
    : typeof memo === "function" && memo(_props => {})["$$typeof"]

/**
 * Observer function / decorator
 */
export function observer(componentClass) {
    if (componentClass.isMobxInjector === true) {
        console.warn(
            "Mobx observer: You are trying to use 'observer' on a component that already has 'inject'. Please apply 'observer' before applying 'inject'"
        )
    }

    if (ReactMemoSymbol && componentClass["$$typeof"] === ReactMemoSymbol) {
        throw new Error(
            "Mobx observer: You are trying to use 'observer' on function component wrapped to either another observer or 'React.memo'. The observer already applies 'React.memo' for you."
        )
    }

    // Unwrap forward refs into `<Observer>` component
    // we need to unwrap the render, because it is the inner render that needs to be tracked,
    // not the ForwardRef HoC
    if (ReactForwardRefSymbol && componentClass["$$typeof"] === ReactForwardRefSymbol) {
        const baseRender = componentClass.render
        if (typeof baseRender !== "function")
            throw new Error("render property of ForwardRef was not a function")
        return forwardRef(function ObserverForwardRef() {
            return <Observer>{() => baseRender.apply(undefined, arguments)}</Observer>
        })
    }

    // Function component
    if (
        typeof componentClass === "function" &&
        (!componentClass.prototype || !componentClass.prototype.render) &&
        !componentClass.isReactClass &&
        !Component.isPrototypeOf(componentClass)
    ) {
        return observerLite(componentClass)
    }

    return makeClassComponentObserver(componentClass)
}
