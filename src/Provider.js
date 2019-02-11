import { Children, Component, createContext, createElement } from "react"
import { shallowEqual } from "./utils/utils"

const specialReactKeys = { children: true, key: true, ref: true }

export const MobXProviderContext = createContext({})

class Provider extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = {}
        copyStores(props, this.state)
    }

    render() {
        return createElement(
            MobXProviderContext.Provider,
            { value: this.state },
            Children.only(this.props.children)
        )
    }

    // getChildContext() {
    //     const stores = {}
    //     // inherit stores
    //     copyStores(this.context.mobxStores, stores)
    //     // add own stores
    //     copyStores(this.props, stores)
    //     return {
    //         mobxStores: stores
    //     }
    // }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!nextProps) return null
        if (!prevState) return nextProps

        const baseStores = { ...prevState, ...specialReactKeys } // mix in specialReactKeys, so that they are ignored in the diff
        const newStores = { ...nextProps, ...specialReactKeys }
        if (!shallowEqual(baseStores, newStores))
            throw new Error(
                "MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
            )
        return nextProps
    }
}

function copyStores(from, to) {
    if (!from) return
    for (let key in from) if (validStoreName(key)) to[key] = from[key]
}

function validStoreName(key) {
    return !specialReactKeys[key] && key !== "suppressChangedStoreWarning"
}
export default Provider
