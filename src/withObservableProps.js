import * as React from "react"
import {
    observable,
    reaction,
    set,
    remove,
    isObservable,
    isObservableArray,
    isObservableMap,
    isObservableObject
} from "mobx"
import { observer } from "./observer"
import { disposeOnUnmount } from "./disposeOnUnmount"
import { getMobxCapabilities } from "./utils/mobxCapabilities"

const EMPTY_OBJECT = {}

let prechecksPassed = false

export function withObservableProps(C, options) {
    if (!prechecksPassed) {
        if (!getMobxCapabilities().canDetectNewProperties) {
            throw new Error(`[mobx-react] withObservableProps requires mobx 5 or higher`)
        }

        if (typeof WeakMap === "undefined") {
            throw new Error(`[mobx-react] withObservableProps requires WeakMap`)
        }

        prechecksPassed = true
    }

    // make observer if needed
    if (!C.isMobXReactObserver) {
        C = observer(C)
    }

    return observer(
        class WithObservableProps extends React.Component {
            obsProps = observableProps(this, options)

            render() {
                return <C obs={this.obsProps} />
            }
        }
    )
}

function updateObservableValue(oldV, newV, localObservables) {
    if (isObservable(newV)) {
        return newV
    }
    if (Array.isArray(newV)) {
        return updateObservableArray(oldV, newV, localObservables)
    }
    if (isPlainObject(newV)) {
        return updateObservableObject(oldV, newV, undefined, localObservables)
    }
    if (newV instanceof Map) {
        return updateObservableMap(oldV, newV, localObservables)
    }
    return newV
}

function updateObservableArray(oldArr, newArr, localObservables) {
    if (!isObservableArray(oldArr) || !localObservables.has(oldArr)) {
        oldArr = observable.array([], { deep: false })
        localObservables.set(oldArr, true)
    }

    // add/update items
    const len = newArr.length
    oldArr.length = len
    for (let i = 0; i < len; i++) {
        const oldValue = oldArr[i]
        const newValue = newArr[i]

        if (oldValue !== newValue) {
            set(oldArr, i, updateObservableValue(oldValue, newValue, localObservables))
        }
    }

    return oldArr
}

function updateObservableMap(oldMap, newMap, localObservables) {
    if (!isObservableMap(oldMap) || !localObservables.has(oldMap)) {
        oldMap = observable.map({}, { deep: false })
        localObservables.set(oldMap, true)
    }

    const oldMapKeysToRemove = new Set(oldMap.keys())

    // add/update props
    newMap.forEach((newValue, propName) => {
        oldMapKeysToRemove.delete(propName)
        const oldValue = oldMap.get(propName)

        if (oldValue !== newValue) {
            set(oldMap, propName, updateObservableValue(oldValue, newValue, localObservables))
        }
    })

    // remove missing props
    oldMapKeysToRemove.forEach(propName => {
        remove(oldMap, propName)
    })

    return oldMap
}

function updateObservableObject(oldObj, newObj, isDeepProp, localObservables) {
    if (!isObservableObject(oldObj) || !localObservables.has(oldObj)) {
        oldObj = observable.object({}, undefined, { deep: false })
        localObservables.set(oldObj, true)
    }

    const oldObjKeysToRemove = new Set(Object.keys(oldObj))

    // add/update props
    Object.keys(newObj).forEach(propName => {
        oldObjKeysToRemove.delete(propName)
        const maybeNewValue = newObj[propName]
        const oldValue = oldObj[propName]

        const newValue =
            isDeepProp && !isDeepProp(propName)
                ? maybeNewValue
                : updateObservableValue(oldValue, maybeNewValue, localObservables)

        if (oldValue !== newValue) {
            set(oldObj, propName, newValue)
        }
    })

    // remove missing props
    oldObjKeysToRemove.forEach(propName => {
        remove(oldObj, propName)
    })

    return oldObj
}

function observableProps(component, options) {
    options = {
        deepProps: false,
        ...options
    }

    let isDeepProp
    if (options.deepProps === true) {
        isDeepProp = () => true
    } else if (options.deepProps === false) {
        isDeepProp = () => false
    } else {
        // convert array to object so lookup is faster
        let deepProps = {}
        options.deepProps.forEach(propName => {
            deepProps[propName] = true
        })

        isDeepProp = propName => deepProps[propName]
    }

    // keeps track of which observable comes from props and which were generated locally
    const localObservables = new WeakMap()

    const observed = observable.object({}, undefined, { deep: false })
    localObservables.set(observed, true)

    disposeOnUnmount(
        component,
        reaction(
            () => component.props,
            unobserved => {
                updateObservableObject(
                    observed,
                    unobserved || EMPTY_OBJECT,
                    isDeepProp,
                    localObservables
                )
            },
            { fireImmediately: true }
        )
    )

    return observed
}

export function isPlainObject(value) {
    if (value === null || typeof value !== "object") return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}
