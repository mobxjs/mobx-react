import { configure } from "enzyme"
import Adapter from "enzyme-adapter-react-16"
import React from "react"
import ReactDOM from "react-dom"

configure({ adapter: new Adapter() })

export function createTestRoot() {
    if (!window.document.body) {
        window.document.body = document.createElement("body")
    }
    const testRoot = document.createElement("div")
    document.body.appendChild(testRoot)
    return testRoot
}

export function sleepHelper(time){
   return new Promise((resolve)=>{
       setTimeout(resolve, time);
   })
}

export function asyncReactDOMRender(Component,root){
    return new Promise((resolve)=>{
        ReactDOM.render(<Component />, root, resolve)
    })
}
