delete global.Symbol

import React, { Component } from "react"
import { observer } from "../src"
import { asyncReactDOMRender, createTestRoot } from "./"
import { newSymbol } from "../src/utils/utils"

const testRoot = createTestRoot()

test("work without Symbol", async () => {
    const Component1 = observer(
        class extends Component {
            render() {
                return null
            }
        }
    )
    await asyncReactDOMRender(<Component1 />, testRoot)
})

test("cache newSymbol created Symbols", () => {
    const symbol1 = newSymbol("name")
    const symbol2 = newSymbol("name")

    expect(symbol1).toEqual(symbol2)
})
