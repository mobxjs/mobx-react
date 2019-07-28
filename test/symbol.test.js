delete global.Symbol

import React, { Component } from "react"
import { observer } from "../src"
import { render } from "@testing-library/react"
import { newSymbol } from "../src/utils/utils"

test("work without Symbol", () => {
    const Component1 = observer(
        class extends Component {
            render() {
                return null
            }
        }
    )
    render(<Component1 />)
})

test("cache newSymbol created Symbols", () => {
    const symbol1 = newSymbol("name")
    const symbol2 = newSymbol("name")

    expect(symbol1).toEqual(symbol2)
})
