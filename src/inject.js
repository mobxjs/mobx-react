import React, { Component, createElement } from "react"
import { observer } from "./observer"
import { copyStaticProperties } from "./utils/utils"
import { MobXProviderContext } from "./Provider"

/**
 * Store Injection
 */
function createStoreInjector(grabStoresFn, component, injectNames, makeReactive) {
    // Support forward refs
    let Injector = React.forwardRef((props, ref) => {
        const newProps = { ...props }
        const context = React.useContext(MobXProviderContext)
        Object.assign(newProps, grabStoresFn(context || {}, newProps) || {})

        if (ref) {
            newProps.ref = ref
        }

        return createElement(component, newProps)
    })

    if (makeReactive) Injector = observer(Injector)
    Injector.isMobxInjector = true // assigned late to suppress observer warning

    // Static fields from component should be visible on the generated Injector
    copyStaticProperties(component, Injector)
    Injector.wrappedComponent = component
    Injector.displayName = getInjectName(component, injectNames)
    return Injector
}

function getInjectName(component, injectNames) {
    let displayName
    const componentName =
        component.displayName ||
        component.name ||
        (component.constructor && component.constructor.name) ||
        "Component"
    if (injectNames) displayName = "inject-with-" + injectNames + "(" + componentName + ")"
    else displayName = "inject(" + componentName + ")"
    return displayName
}

function grabStoresByName(storeNames) {
    return function(baseStores, nextProps) {
        storeNames.forEach(function(storeName) {
            if (
                storeName in nextProps // prefer props over stores
            )
                return
            if (!(storeName in baseStores))
                throw new Error(
                    "MobX injector: Store '" +
                        storeName +
                        "' is not available! Make sure it is provided by some Provider"
                )
            nextProps[storeName] = baseStores[storeName]
        })
        return nextProps
    }
}

/**
 * higher order component that injects stores to a child.
 * takes either a varargs list of strings, which are stores read from the context,
 * or a function that manually maps the available stores from the context to props:
 * storesToProps(mobxStores, props, context) => newProps
 */
export function inject(/* fn(stores, nextProps) or ...storeNames */ ...storeNames) {
    let grabStoresFn
    if (typeof arguments[0] === "function") {
        grabStoresFn = arguments[0]
        return componentClass =>
            createStoreInjector(grabStoresFn, componentClass, grabStoresFn.name, true)
    } else {
        return componentClass =>
            createStoreInjector(
                grabStoresByName(storeNames),
                componentClass,
                storeNames.join("-"),
                false
            )
    }
}
