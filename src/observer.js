import React, { Component, PureComponent, forwardRef } from "react"
import { createAtom, _allowStateChanges } from "mobx"
import {
    observer as observerLite,
    useStaticRendering as useStaticRenderingLite,
    Observer
} from "mobx-react-lite"

import { newSymbol, shallowEqual } from "./utils/utils"

let isUsingStaticRendering = false

const skipRenderKey = newSymbol("skipRender")
const isForcingUpdateKey = newSymbol("isForcingUpdate")

// Using react-is had some issues (and operates on elements, not on types), see #608 / #609
const ReactForwardRefSymbol =
    typeof forwardRef === "function" && forwardRef((_props, _ref) => {})["$$typeof"]

/**
 * Helper to set `prop` to `this` as non-enumerable (hidden prop)
 * @param target
 * @param prop
 * @param value
 */
function setHiddenProp(target, prop, value) {
    if (!Object.hasOwnProperty.call(target, prop)) {
        Object.defineProperty(target, prop, {
            enumerable: false,
            configurable: true,
            writable: true,
            value
        })
    } else {
        target[prop] = value
    }
}

export function useStaticRendering(useStaticRendering) {
    isUsingStaticRendering = useStaticRendering
    useStaticRenderingLite(useStaticRendering)
}

function observerSCU(nextProps, nextState) {
    if (isUsingStaticRendering) {
        console.warn(
            "[mobx-react] It seems that a re-rendering of a React component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side."
        )
    }
    // update on any state changes (as is the default)
    if (this.state !== nextState) {
        return true
    }
    // update if props are shallowly not equal, inspired by PureRenderMixin
    // we could return just 'false' here, and avoid the `skipRender` checks etc
    // however, it is nicer if lifecycle events are triggered like usually,
    // so we return true here if props are shallowly modified.
    return !shallowEqual(this.props, nextProps)
}

function makeObservableProp(target, propName) {
    const valueHolderKey = newSymbol(`reactProp_${propName}_valueHolder`)
    const atomHolderKey = newSymbol(`reactProp_${propName}_atomHolder`)
    function getAtom() {
        if (!this[atomHolderKey]) {
            setHiddenProp(this, atomHolderKey, createAtom("reactive " + propName))
        }
        return this[atomHolderKey]
    }
    Object.defineProperty(target, propName, {
        configurable: true,
        enumerable: true,
        get: function() {
            getAtom.call(this).reportObserved()
            return this[valueHolderKey]
        },
        set: function set(v) {
            if (!this[isForcingUpdateKey] && !shallowEqual(this[valueHolderKey], v)) {
                setHiddenProp(this, valueHolderKey, v)
                setHiddenProp(this, skipRenderKey, true)
                getAtom.call(this).reportChanged()
                setHiddenProp(this, skipRenderKey, false)
            } else {
                setHiddenProp(this, valueHolderKey, v)
            }
        }
    })
}

/**
 * Observer function / decorator
 */
export function observer(componentClass) {
    if (componentClass.isMobxInjector === true) {
        console.warn(
            "Mobx observer: You are trying to use 'observer' on a component that already has 'inject'. Please apply 'observer' before applying 'inject'"
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

function makeClassComponentObserver(componentClass) {
    const target = componentClass.prototype || componentClass
    if (target.componentWillReact)
        throw new Error("The componentWillReact life-cycle event is no longer supported")
    if (componentClass.__proto__ !== PureComponent) {
        if (!target.shouldComponentUpdate) target.shouldComponentUpdate = observerSCU
        else if (target.shouldComponentUpdate !== observerSCU)
            throw new Error(
                "It is not allowed to use shouldComponentUpdate in observer based components."
            )
    }
    makeObservableProp(target, "props")
    makeObservableProp(target, "state")
    const baseRender = target.render

    target.render = function renderWrapper() {
        if (!this.baseRender) {
            // safe the closure, as it won't change!
            const bound = baseRender.bind(this)
            this.baseRender = () => bound()
        }
        return <Observer>{this.baseRender}</Observer>
    }
    return componentClass
}
