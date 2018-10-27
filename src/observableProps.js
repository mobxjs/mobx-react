import { observable, reaction, set, remove } from "mobx"
import { disposeOnUnmount } from "./disposeOnUnmount"
import { isObserverComponent } from "./observer"
import { getMobxCapabilities } from "./utils/mobxCapabilities"

function updateObservableObject(oldObj, newObj) {
    // add/update props
    Object.keys(newObj).forEach(propName => {
        const value = newObj[propName]

        // it is ok to call set even if the value doesn't change
        // since internally it won't trigger a change if the value is the same
        set(oldObj, propName, value)
    })

    // remove removed props
    Object.keys(oldObj).forEach(propName => {
        if (!(propName in newObj)) {
            remove(oldObj, propName)
        }
    })
}

function observableProperty(methodName, component, componentPropName) {
    if (!getMobxCapabilities().canDetectNewProperties) {
        throw new Error(`[mobx-react] ${methodName} requires mobx 5 or higher`)
    }

    if (!isObserverComponent(component)) {
        throw new Error(`[mobx-react] ${methodName} only works on observer components`)
    }

    // to properly use "deep" properties the passed object should be observable
    // or else react won't trigger a re-render by itself since the object ref will be the same
    const observed = observable({}, undefined, { deep: false })

    disposeOnUnmount(
        component,
        reaction(
            () => component[componentPropName],
            unobserved => {
                if (unobserved) {
                    updateObservableObject(observed, unobserved)
                } else {
                    // remove all props if props is null (sometimes it happens)
                    Object.keys(observed).forEach(propName => {
                        remove(observed, propName)
                    })
                }
            },
            { fireImmediately: true }
        )
    )

    return observed
}

export function observableProps(component) {
    return observableProperty("observableProps", component, "props")
}
