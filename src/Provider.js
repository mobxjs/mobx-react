/* eslint-disable react/prop-types */
import React from "react"
import { shallowEqual } from "./utils/utils"

export const MobXProviderContext = React.createContext({})

export function Provider({ children, ...stores }) {
    const parentValue = React.useContext(MobXProviderContext)
    const value = React.useRef({
        ...parentValue,
        ...stores
    }).current

    if (process.env.NODE_ENV !== "production") {
        const newValue = { ...value, ...stores } // spread in previous state for the context based stores
        if (!shallowEqual(value, newValue)) {
            throw new Error(
                "MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
            )
        }
    }

    return <MobXProviderContext.Provider value={value}>{children}</MobXProviderContext.Provider>
}

Provider.displayName = "MobXProvider"
