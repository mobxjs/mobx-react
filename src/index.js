import { spy, configure, getDebugName } from "mobx"
import { Component } from "react"
import { unstable_batchedUpdates as rdBatched } from "react-dom"
import { unstable_batchedUpdates as rnBatched } from "react-native"

if (!Component) throw new Error("mobx-react requires React to be available")
if (!spy) throw new Error("mobx-react requires mobx to be available")

if (typeof rdBatched === "function") configure({ reactionScheduler: rdBatched })
else if (typeof rnBatched === "function") configure({ reactionScheduler: rnBatched })

export {
    observer,
    Observer,
    renderReporter,
    componentByNodeRegistry as componentByNodeRegistery,
    componentByNodeRegistry,
    trackComponents,
    useStaticRendering
} from "./observer"

export { withObservableProps } from "./withObservableProps"

export { default as Provider } from "./Provider"
export { default as inject } from "./inject"
export { disposeOnUnmount } from "./disposeOnUnmount"

import * as propTypes from "./propTypes"
export { propTypes }
export { propTypes as PropTypes }

import { errorsReporter } from "./observer"
export const onError = fn => errorsReporter.on(fn)

/* DevTool support */
// See: https://github.com/andykog/mobx-devtools/blob/d8976c24b8cb727ed59f9a0bc905a009df79e221/src/backend/installGlobalHook.js

import { renderReporter, componentByNodeRegistry, trackComponents } from "./observer"
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
    const mobx = { spy, extras: { getDebugName } }
    const mobxReact = {
        renderReporter,
        componentByNodeRegistry,
        componentByNodeRegistery: componentByNodeRegistry,
        trackComponents
    }
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobxReact(mobxReact, mobx)
}
