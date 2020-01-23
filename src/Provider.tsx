import * as React from "react"
import { shallowEqual } from "./utils/utils"
import { IValueMap } from "./inject"

export type TProviderShape = Record<string, any>
export const MobXProviderContext: React.Context<TProviderShape> = React.createContext({})

export interface ProviderProps extends IValueMap {
    children: React.ReactNode
}

export function Provider(props: ProviderProps) {
    const { children, ...stores } = props
    const parentValue = React.useContext(MobXProviderContext)
    const mutableProviderRef = React.useRef({ ...parentValue, ...stores })
    const value = mutableProviderRef.current

    if (process && typeof process.env !== "undefined" && process.env.NODE_ENV !== "production") {
        const newValue = { ...value, ...stores } // spread in previous state for the context based stores
        if (!shallowEqual(value, newValue)) {
            throw new Error(
                "MobX Provider: The set of provided stores has changed. See: https://github.com/mobxjs/mobx-react#the-set-of-provided-stores-has-changed-error."
            )
        }
    }

    return <MobXProviderContext.Provider value={value}>{children}</MobXProviderContext.Provider>
}

Provider.displayName = "MobXProvider"
