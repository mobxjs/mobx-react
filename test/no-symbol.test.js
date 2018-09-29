delete global.Symbol

import React, { Component } from "react"
import { observer } from "../src"
import { asyncReactDOMRender, createTestRoot } from "./"

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
