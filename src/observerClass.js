import { PureComponent, Component } from "react"
import { createAtom, _allowStateChanges, Reaction, $mobx } from "mobx"
import { useStaticRendering as useStaticRenderingLite } from "mobx-react-lite"

import { newSymbol, shallowEqual, setHiddenProp } from "./utils/utils"

let isUsingStaticRendering = false

const mobxAdminProperty = $mobx || "$mobx"
const mobxIsUnmounted = newSymbol("isUnmounted")
const skipRenderKey = newSymbol("skipRender")
const isForcingUpdateKey = newSymbol("isForcingUpdate")

export function useStaticRendering(useStaticRendering) {
    isUsingStaticRendering = useStaticRendering
    useStaticRenderingLite(useStaticRendering)
}

export function makeClassComponentObserver(componentClass) {
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
    target.render = function() {
        return makeComponentReactive.call(this, baseRender)
    }
    const baseWillUnmount = target.componentWillUnmount
    target.componentWillUnmount = function() {
        if (isUsingStaticRendering === true) return
        this.render[mobxAdminProperty] && this.render[mobxAdminProperty].dispose()
        this[mobxIsUnmounted] = true
        if (baseWillUnmount) baseWillUnmount.call(this)
    }
    return componentClass
}

function makeComponentReactive(render) {
    if (isUsingStaticRendering === true) return render.call(this)

    function reactiveRender() {
        isRenderingPending = false
        let exception = undefined
        let rendering = undefined
        reaction.track(() => {
            try {
                rendering = _allowStateChanges(false, baseRender)
            } catch (e) {
                exception = e
            }
        })
        if (exception) {
            throw exception
        }
        return rendering
    }

    // Generate friendly name for debugging
    const initialName =
        this.displayName ||
        this.name ||
        (this.constructor && (this.constructor.displayName || this.constructor.name)) ||
        "<component>"
    /**
     * If props are shallowly modified, react will render anyway,
     * so atom.reportChanged() should not result in yet another re-render
     */
    setHiddenProp(this, skipRenderKey, false)
    /**
     * forceUpdate will re-assign this.props. We don't want that to cause a loop,
     * so detect these changes
     */
    setHiddenProp(this, isForcingUpdateKey, false)

    // wire up reactive render
    const baseRender = render.bind(this)
    let isRenderingPending = false

    const reaction = new Reaction(`${initialName}.render()`, () => {
        if (!isRenderingPending) {
            // N.B. Getting here *before mounting* means that a component constructor has side effects (see the relevant test in misc.js)
            // This unidiomatic React usage but React will correctly warn about this so we continue as usual
            // See #85 / Pull #44
            isRenderingPending = true
            if (typeof this.componentWillReact === "function") this.componentWillReact() // TODO: wrap in action?
            if (this[mobxIsUnmounted] !== true) {
                // If we are unmounted at this point, componentWillReact() had a side effect causing the component to unmounted
                // TODO: remove this check? Then react will properly warn about the fact that this should not happen? See #73
                // However, people also claim this might happen during unit tests..
                let hasError = true
                try {
                    setHiddenProp(this, isForcingUpdateKey, true)
                    if (!this[skipRenderKey]) Component.prototype.forceUpdate.call(this)
                    hasError = false
                } finally {
                    setHiddenProp(this, isForcingUpdateKey, false)
                    if (hasError) reaction.dispose()
                }
            }
        }
    })
    reaction.reactComponent = this
    reactiveRender[mobxAdminProperty] = reaction
    this.render = reactiveRender
    return reactiveRender.call(this)
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
