import { configure, observable } from "mobx"
import { Component } from "react"
import { unstable_batchedUpdates as rdBatched } from "react-dom"

if (!Component) throw new Error("mobx-react requires React to be available")
if (!observable) throw new Error("mobx-react requires mobx to be available")

if (typeof rdBatched === "function") configure({ reactionScheduler: rdBatched })

export {
    isUsingStaticRendering,
    Observer,
    useObserver,
    useAsObservableSource,
    useLocalStore,
    useStaticRendering
} from "mobx-react-lite"

export { observer } from "./observer"

export { MobXProviderContext, Provider, ProviderProps } from "./Provider"
export { inject, IStoresToProps, IValueMap, IWrappedComponent } from "./inject"
export { disposeOnUnmount } from "./disposeOnUnmount"
export { PropTypes } from "./propTypes"

export type IReactComponent<P = any> =
    | React.ClassicComponentClass<P>
    | React.ComponentClass<P>
    | React.StatelessComponent<P>
