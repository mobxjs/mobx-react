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
})
