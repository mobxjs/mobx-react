import React from "react"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import TestUtils from "react-dom/test-utils"
import * as mobx from "mobx"
import * as mobxReact from "../src"
import { createTestRoot, sleepHelper, asyncReactDOMRender } from "./index"

test("mobx issue 50", async () => {
    const testRoot = createTestRoot()
    const foo = {
        a: mobx.observable.box(true),
        b: mobx.observable.box(false),
        c: mobx.computed(function() {
            // console.log("evaluate c")
            return foo.b.get()
        })
    }
    function flipStuff() {
        mobx.transaction(() => {
            foo.a.set(!foo.a.get())
            foo.b.set(!foo.b.get())
        })
    }
    let asText = ""
    mobx.autorun(() => (asText = [foo.a.get(), foo.b.get(), foo.c.get()].join(":")))
    const Test = mobxReact.observer(
        createClass({
            render: () => <div id="x">{[foo.a.get(), foo.b.get(), foo.c.get()].join(",")}</div>
        })
    )

    await asyncReactDOMRender(<Test />, testRoot)

    // In 3 seconds, flip a and b. This will change c.
    await sleepHelper(200)
    flipStuff()

    await sleepHelper(400)
    expect(asText).toBe("false:true:true")
    // console.log(document.getElementById("x").innerHTML)
    expect(document.getElementById("x").innerHTML).toBe("false,true,true")
})

test("React.render should respect transaction", async () => {
    const testRoot = createTestRoot()
    const a = mobx.observable.box(2)
    const loaded = mobx.observable.box(false)
    const valuesSeen = []

    const Component = mobxReact.observer(() => {
        valuesSeen.push(a.get())
        if (loaded.get()) return <div>{a.get()}</div>
        else return <div>loading</div>
    })

    await asyncReactDOMRender(<Component />, testRoot)

    mobx.transaction(() => {
        a.set(3)
        a.set(4)
        loaded.set(true)
    })

    await sleepHelper(400)
    expect(testRoot.textContent.replace(/\s+/g, "")).toBe("4")
    expect(valuesSeen.sort()).toEqual([2, 4].sort())
    testRoot.parentNode.removeChild(testRoot)
})

test("React.render in transaction should succeed", async () => {
    const testRoot = createTestRoot()
    const a = mobx.observable.box(2)
    const loaded = mobx.observable.box(false)
    const valuesSeen = []
    const Component = mobxReact.observer(() => {
        valuesSeen.push(a.get())
        if (loaded.get()) return <div>{a.get()}</div>
        else return <div>loading</div>
    })

    mobx.transaction(() => {
        a.set(3)
        ReactDOM.render(<Component />, testRoot)
        a.set(4)
        loaded.set(true)
    })

    await sleepHelper(400)
    expect(testRoot.textContent.replace(/\s+/g, "")).toBe("4")
    expect(valuesSeen.sort()).toEqual([3, 4].sort())
    testRoot.parentNode.removeChild(testRoot)
})
