import React from "react"
import { shallowEqual } from "./utils/utils"

export const MobXProviderContext = React.createContext({})

export function Provider(props) {
    const parentValue = React.useContext(MobXProviderContext)
    const value = React.useRef({
        ...parentValue,
        ...grabStores(props)
    }).current

    if (process.env.NODE_ENV !== "production") {
        const newValue = { ...value, ...grabStores(props) } // spread in previous state for the context based stores
        if (!shallowEqual(value, newValue)) {
            throw new Error(
                "MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
            )
        }
    }

    return (
        <MobXProviderContext.Provider value={value}>{props.children}</MobXProviderContext.Provider>
    )
}

Provider.displayName = "MobXProvider"

function grabStores(from) {
    const res = {}
    if (!from) return res
    for (let key in from) if (key !== "children") res[key] = from[key]
    return res
}
