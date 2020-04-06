import { configure, observable } from "mobx"
import { Component } from "react"
import { unstable_batchedUpdates as rdBatched } from "react-dom"

if (!Component) throw new Error("mobx-react requires React to be available")
if (!observable) throw new Error("mobx-react requires mobx to be available")

if (typeof rdBatched === "function") configure({ reactionScheduler: rdBatched })

export {
    Observer,
    useObserver,
    useAsObservableSource,
    useLocalStore,
    isUsingStaticRendering,
    useStaticRendering,
    observerBatching,
    observerBatchingOptOut,
    isObserverBatched
} from "mobx-react-lite"

export { observer } from "./observer"

export { MobXProviderContext, Provider, ProviderProps } from "./Provider"
export { inject } from "./inject"
export { disposeOnUnmount } from "./disposeOnUnmount"
export { PropTypes } from "./propTypes"
export { IWrappedComponent } from "./types/IWrappedComponent"
