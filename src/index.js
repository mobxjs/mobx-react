import { observable, configure } from "mobx"
import { Component } from "react"
import { unstable_batchedUpdates as rdBatched } from "react-dom"
import { unstable_batchedUpdates as rnBatched } from "react-native"

if (!Component) throw new Error("mobx-react requires React to be available")
if (!observable) throw new Error("mobx-react requires mobx to be available")

if (typeof rdBatched === "function") configure({ reactionScheduler: rdBatched })
else if (typeof rnBatched === "function") configure({ reactionScheduler: rnBatched })

// TODO: re-export more mobx-react-lite stuff?
// TODO; do we still need separate RN build?
export { Observer } from "mobx-react-lite"

export { observer, useStaticRendering } from "./observer"

export { default as Provider } from "./Provider"
export { default as inject } from "./inject"
export { disposeOnUnmount } from "./disposeOnUnmount"

import * as propTypes from "./propTypes"
export { propTypes }
export { propTypes as PropTypes }
