import React from "react"
import { Provider } from "../src"
import { render } from "@testing-library/react"
import { MobXProviderContext } from "../src/Provider"

describe("Provider", () => {
    it("should not provide the children prop", () => {
        function A() {
            return (
                <Provider>
                    <MobXProviderContext.Consumer>
                        {stores =>
                            stores.hasOwnProperty("children")
                                ? "children was provided"
                                : "children was not provided"
                        }
                    </MobXProviderContext.Consumer>
                </Provider>
            )
        }

        const { container } = render(<A />)
        expect(container).toHaveTextContent("children was not provided")
    })

    it("supports overriding stores", () => {
        function B() {
            return (
                <MobXProviderContext.Consumer>
                    {({ overridable, nonOverridable }) => `${overridable} ${nonOverridable}`}
                </MobXProviderContext.Consumer>
            )
        }

        function A() {
            return (
                <Provider overridable="original" nonOverridable="original">
                    <B />
                    <Provider overridable="overriden">
                        <B />
                    </Provider>
                </Provider>
            )
        }
        const { container } = render(<A />)
        expect(container).toMatchInlineSnapshot(`
<div>
  original original
  overriden original
</div>
`)
    })

    it("should throw an error when changing stores", () => {
        const baseError = console.error
        console.error = () => {}

        function A({ foo }) {
            return (
                <Provider foo={foo}>
                    <MobXProviderContext.Consumer>{({ foo }) => foo}</MobXProviderContext.Consumer>
                </Provider>
            )
        }

        const { rerender } = render(<A foo={1} />)

        expect(() => {
            rerender(<A foo={2} />)
        }).toThrow(
            "The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
        )

        console.error = baseError
    })
})
