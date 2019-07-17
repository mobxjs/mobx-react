import React, { Component } from "react"
import * as mobx from "mobx"
import * as mobxReact from "../src"
import { sleepHelper } from "./index"
import { render } from "@testing-library/react"

test("mobx issue 50", async () => {
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
        class Test extends Component {
            render() {
                return <div id="x">{[foo.a.get(), foo.b.get(), foo.c.get()].join(",")}</div>
            }
        }
    )

    render(<Test />)

    // In 3 seconds, flip a and b. This will change c.
    await sleepHelper(200)
    flipStuff()

    await sleepHelper(400)
    expect(asText).toBe("false:true:true")
    // console.log(document.getElementById("x").innerHTML)
    expect(document.getElementById("x").innerHTML).toBe("false,true,true")
})

test("ReactDOM.render should respect transaction", async () => {
    const a = mobx.observable.box(2)
    const loaded = mobx.observable.box(false)
    const valuesSeen = []

    const Component = mobxReact.observer(() => {
        valuesSeen.push(a.get())
        if (loaded.get()) return <div>{a.get()}</div>
        else return <div>loading</div>
    })

    const { container } = render(<Component />)

    mobx.transaction(() => {
        a.set(3)
        a.set(4)
        loaded.set(true)
    })

    await sleepHelper(400)
    expect(container.textContent).toBe("4")
    expect(valuesSeen.sort()).toEqual([2, 4].sort())
})

test("ReactDOM.render in transaction should succeed", async () => {
    const a = mobx.observable.box(2)
    const loaded = mobx.observable.box(false)
    const valuesSeen = []
    const Component = mobxReact.observer(() => {
        valuesSeen.push(a.get())
        if (loaded.get()) return <div>{a.get()}</div>
        else return <div>loading</div>
    })

    let container

    mobx.transaction(() => {
        a.set(3)
        container = render(<Component />).container
        a.set(4)
        loaded.set(true)
    })

    await sleepHelper(400)
    expect(container.textContent).toBe("4")
    expect(valuesSeen.sort()).toEqual([3, 4].sort())
})
