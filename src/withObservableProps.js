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

// makes sure observable objects were created by us and not passed along
let ownObserved

const EMPTY_OBJECT = {}

let prechecksPassed = false

export function withObservableProps(C, options) {
    if (!prechecksPassed) {
        if (!getMobxCapabilities().canDetectNewProperties) {
            throw new Error(`[mobx-react] withObservableProps requires mobx 5 or higher`)
        }

        if (!ownObserved) {
            if (typeof WeakMap === "undefined") {
                throw new Error(`[mobx-react] withObservableProps requires WeakMap`)
            }
            ownObserved = new WeakMap()
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

function updateObservableValue(oldV, newV) {
    if (isObservable(newV)) {
        return newV
    }
    if (Array.isArray(newV)) {
        return updateObservableArray(oldV, newV)
    }
    if (isPlainObject(newV)) {
        return updateObservableObject(oldV, newV, undefined)
    }
    if (newV instanceof Map) {
        return updateObservableMap(oldV, newV)
    }
    return newV
}

function updateObservableArray(oldArr, newArr) {
    if (!isObservableArray(oldArr) || !ownObserved.has(oldArr)) {
        oldArr = observable.array([], { deep: false })
        ownObserved.set(oldArr, true)
    }

    // add/update items
    const len = newArr.length
    oldArr.length = len
    for (let i = 0; i < len; i++) {
        const oldV = oldArr[i]
        const newV = newArr[i]

        // it is ok to call set even if the value doesn't change
        // since internally it won't trigger a change if the value is the same
        set(oldArr, i, updateObservableValue(oldV, newV))
    }

    return oldArr
}

function updateObservableMap(oldMap, newMap) {
    if (!isObservableMap(oldMap) || !ownObserved.has(oldMap)) {
        oldMap = observable.map({}, { deep: false })
        ownObserved.set(oldMap, true)
    }

    // add/update props
    newMap.forEach((value, propName) => {
        const oldValue = oldMap.get(propName)

        // it is ok to call set even if the value doesn't change
        // since internally it won't trigger a change if the value is the same
        set(oldMap, propName, updateObservableValue(oldValue, value))
    })

    // remove removed props
    oldMap.forEach((_, propName) => {
        if (!newMap.has(propName)) {
            remove(oldMap, propName)
        }
    })

    return oldMap
}

function updateObservableObject(oldObj, newObj, isDeepProp) {
    if (!isObservableObject(oldObj) || !ownObserved.has(oldObj)) {
        oldObj = observable.object({}, undefined, { deep: false })
        ownObserved.set(oldObj, true)
    }

    // add/update props
    Object.keys(newObj).forEach(propName => {
        const value = newObj[propName]

        const newValue =
            isDeepProp && !isDeepProp(propName)
                ? value
                : updateObservableValue(oldObj[propName], value)

        // it is ok to call set even if the value doesn't change
        // since internally it won't trigger a change if the value is the same
        set(oldObj, propName, newValue)
    })

    // remove removed props
    Object.keys(oldObj).forEach(propName => {
        if (!(propName in newObj)) {
            remove(oldObj, propName)
        }
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

    const observed = observable.object({}, undefined, { deep: false })
    ownObserved.set(observed, true)

    disposeOnUnmount(
        component,
        reaction(
            () => component.props,
            unobserved => {
                updateObservableObject(observed, unobserved || EMPTY_OBJECT, isDeepProp)
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
