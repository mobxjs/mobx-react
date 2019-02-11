import { Children, Component, createContext, createElement } from "react"
import { shallowEqual } from "./utils/utils"

const specialReactKeys = { children: true, key: true, ref: true }

export const MobXProviderContext = createContext({})

class Provider extends Component {
    render() {
        console.log("Provide " + Object.keys(this.state))
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
        const newStores = grabStores(nextProps)
        if (!prevState) return newStores
        if (!shallowEqual(prevState, newStores))
            throw new Error(
                "MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
            )
        return newStores
    }
}

function grabStores(from) {
    const res = {}
    if (!from) return res
    for (let key in from) if (validStoreName(key)) res[key] = from[key]
    return res
}

function validStoreName(key) {
    return !specialReactKeys[key] && key !== "suppressChangedStoreWarning"
}
export default Provider
