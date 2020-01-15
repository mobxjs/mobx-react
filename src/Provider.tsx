import * as React from "react"
import { shallowEqual } from "./utils/utils"
import { IValueMap } from "./inject"

export const MobXProviderContext: React.Context<any> = React.createContext({})

export interface ProviderProps extends IValueMap {
    children: React.ReactNode
}

export function Provider(props: ProviderProps): React.ReactElement {
    const { children, ...stores } = props
    const parentValue: any = React.useContext(MobXProviderContext)
    const value: React.MutableRefObject<any> = React.useRef({
        ...parentValue,
        ...stores
    }).current

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
