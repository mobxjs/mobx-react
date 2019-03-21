import { observable, configure } from "mobx"
import { Component } from "react"
import { unstable_batchedUpdates as rdBatched } from "react-dom"

if (!Component) throw new Error("mobx-react requires React to be available")
if (!observable) throw new Error("mobx-react requires mobx to be available")

if (typeof rdBatched === "function") configure({ reactionScheduler: rdBatched })

export { useObservable, useComputed, useDisposable, useObserver, Observer } from "mobx-react-lite"

export { observer, useStaticRendering } from "./observer"

export { Provider } from "./Provider"
export { inject } from "./inject"
export { disposeOnUnmount } from "./disposeOnUnmount"
export { PropTypes } from "./propTypes"
