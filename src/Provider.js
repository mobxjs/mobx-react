import { Children, Component, createContext, createElement } from "react"
import { shallowEqual } from "./utils/utils"

const specialReactKeys = { children: true, key: true, ref: true }

export const MobXProviderContext = createContext({})

export class Provider extends Component {
    static contextType = MobXProviderContext

    constructor(props, context) {
        super(props, context)
        this.state = {
            ...context,
            ...grabStores(props)
        }
    }

    render() {
        return createElement(
            MobXProviderContext.Provider,
            { value: this.state },
            Children.only(this.props.children)
        )
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (process.env.NODE_ENV !== "production") {
            const newStores = { ...prevState, ...grabStores(nextProps) } // spread in prevState for the context based stores
            if (!shallowEqual(prevState, newStores))
                throw new Error(
                    "MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
                )
        }
        return prevState // because they didn't change, remember!
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
