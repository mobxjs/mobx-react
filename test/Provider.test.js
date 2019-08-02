import React, { Component } from "react"
import * as mobx from "mobx"
import { observer, inject, Provider } from "../src"
import { render } from "@testing-library/react"
import renderer, { act } from "react-test-renderer"
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
        const C = inject("foo", "bar")(
            observer(
                class C extends Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.foo}
                                {this.props.bar}
                            </div>
                        )
                    }
                }
            )
        )
        const B = () => <C />
        const A = class A extends Component {
            render() {
                return (
                    <Provider foo="bar" bar={1337}>
                        <div>
                            <span>
                                <B />
                            </span>
                            <section>
                                <Provider foo={42}>
                                    <B />
                                </Provider>
                            </section>
                        </div>
                    </Provider>
                )
            }
        }
        const wrapper = renderer.create(<A />)
        expect(wrapper).toMatchInlineSnapshot(`
<div>
  <span>
    <div>
      context:
      bar
      1337
    </div>
  </span>
  <section>
    <div>
      context:
      42
      1337
    </div>
  </section>
</div>
`)
    })

    it("should throw an error when changing stores", () => {
        let msgs = []
        const baseError = console.error
        console.error = m => msgs.push(m.split("\n").slice(0, 7)) // drop stacktraces to avoid line number issues
        const a = mobx.observable.box(3)
        const C = inject("foo")(
            observer(
                class C extends Component {
                    render() {
                        return (
                            <div>
                                context:
                                {this.props.foo}
                            </div>
                        )
                    }
                }
            )
        )
        const B = observer(
            class B extends Component {
                render() {
                    return <C />
                }
            }
        )
        const A = observer(
            class A extends Component {
                render() {
                    return (
                        <section>
                            <span>{a.get()}</span>
                            <Provider foo={a.get()}>
                                <B />
                            </Provider>
                        </section>
                    )
                }
            }
        )
        const wrapper = renderer.create(<A />)

        expect(wrapper).toMatchInlineSnapshot(`
<section>
  <span>
    3
  </span>
  <div>
    context:
    3
  </div>
</section>
`)

        expect(() => {
            act(() => {
                a.set(42)
            })
        }).toThrow(
            "The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"
        )
        expect(msgs).toMatchSnapshot() // nobody caught the error of the rendering

        console.error = baseError
    })
})
