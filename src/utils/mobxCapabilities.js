import { observable, runInAction, reaction } from "mobx"

let capabilities

export function getMobxCapabilities() {
    if (!capabilities) {
        capabilities = {
            canDetectNewProperties: canDetectNewProperties()
        }
    }
    return capabilities
}

function canDetectNewProperties() {
    // check that support detecting new props as they get added to objects
    let passed = false
    const obj = observable({})
    const r = reaction(
        () => obj && obj.x,
        () => {
            passed = true
        }
    )
    runInAction(() => {
        obj.x = 5
    })
    r()
    return passed
}
