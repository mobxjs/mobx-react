import { Children, Component } from "react"
import { observable, autorun, computed, Atom } from "mobx"
import * as PropTypes from "./propTypes"
import { shallowEqual } from "./utils/utils"

const specialReactKeys = { children: true, key: true, ref: true }

let isSuppressChangedStoreWarning = false

export default class Provider extends Component {
    static contextTypes = {
        mobxStores: PropTypes.observableComputed
    }

    static childContextTypes = {
        mobxStores: PropTypes.observableComputed.isRequired
    }

    componentWillMount() {
        makePropertyObservableReference(this, "props")
        makePropertyObservableReference(this, "context")
    }

    getChildContext() {
        return { mobxStores: this.getContext }
    }

    render() {
        return Children.only(this.props.children)
    }

    getContext = computed(() => {
        const context = this.context
        const props = this.props
        const stores = {}
        // inherit stores
        const baseStores = context.mobxStores && context.mobxStores.get()
        if (baseStores)
            for (let key in baseStores) {
                stores[key] = baseStores[key]
            }
        // add own stores
        for (let key in props)
            if (!specialReactKeys[key] && key !== "suppressChangedStoreWarning")
                stores[key] = props[key]
        return stores
    })
}

export function suppressChangedStoreWarning(suppressChangedStoreWarning) {
    // TODO deprecate this option in next version, and then remove
    isSuppressChangedStoreWarning = suppressChangedStoreWarning
}

function makePropertyObservableReference(provider, propName) {
    let valueHolder = provider[propName]
    const atom = new Atom("reactive " + propName)
    Object.defineProperty(provider, propName, {
        configurable: true,
        enumerable: true,
        get: function() {
            atom.reportObserved()
            return valueHolder
        },
        set: function set(nextValue) {
            const valueHolderWithoutSpecials = Object.assign({}, valueHolder, specialReactKeys)
            const nextValueWithoutSpecials = Object.assign({}, nextValue, specialReactKeys)
            if (!shallowEqual(valueHolderWithoutSpecials, nextValueWithoutSpecials)) {
                if (
                    !isSuppressChangedStoreWarning &&
                    propName === "props" &&
                    !nextValue.suppressChangedStoreWarning
                ) {
                    // TODO remove this warning in next version
                    console.warn(
                        "MobX Provider: The set of provided stores has changed. Propagation to all children now in experimental support status"
                    )
                }
                valueHolder = nextValue
                atom.reportChanged()
            } else {
                valueHolder = nextValue
            }
        }
    })
}
