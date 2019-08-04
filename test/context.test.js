import React from "react"
import * as mobx from "mobx"
import { Provider, observer, inject } from "../src"
import TestRenderer from "react-test-renderer"
import withConsole from "./utils/withConsole"

test("no warnings in modern react", () => {
    const box = mobx.observable.box(3)
    const Child = inject("store")(
        observer(
            class Child extends React.Component {
                render() {
                    return (
                        <div>
                            {this.props.store} + {box.get()}
                        </div>
                    )
                }
            }
        )
    )

    class App extends React.Component {
        render() {
            return (
                <div>
                    <React.StrictMode>
                        <Provider store="42">
                            <Child />
                        </Provider>
                    </React.StrictMode>
                </div>
            )
        }
    }

    const testRenderer = TestRenderer.create(<App />)
    expect(testRenderer.toJSON()).toMatchSnapshot()

    withConsole(["info", "warn", "error"], () => {
        TestRenderer.act(() => {
            box.set(4)
        })
        expect(testRenderer.toJSON()).toMatchSnapshot()

        expect(console.info).not.toHaveBeenCalled()
        expect(console.warn).not.toHaveBeenCalled()
        expect(console.error).not.toHaveBeenCalled()
    })
})

test("getDerivedStateFromProps works #447", () => {
    class Main extends React.Component {
        static getDerivedStateFromProps(nextProps, prevState) {
            return {
                count: prevState.count + 1
            }
        }

        state = {
            count: 0
        }

        render() {
            return (
                <div>
                    <h2>{`${this.state.count ? "One " : "No "}${this.props.thing}`}</h2>
                </div>
            )
        }
    }

    const MainInjected = inject(({ store }) => ({ thing: store.thing }))(Main)

    const store = { thing: 3 }

    const App = () => (
        <Provider store={store}>
            <MainInjected />
        </Provider>
    )

    const testRenderer = TestRenderer.create(<App />)
    expect(testRenderer.toJSON()).toMatchSnapshot()
})

test("no double runs for getDerivedStateFromProps", () => {
    let derived = 0
    @observer
    class Main extends React.Component {
        state = {
            activePropertyElementMap: {}
        }

        constructor(props) {
            // console.log("CONSTRUCTOR")
            super(props)
        }

        static getDerivedStateFromProps() {
            derived++
            // console.log("PREVSTATE", nextProps)
            return null
        }

        render() {
            return <div>Test-content</div>
        }
    }
    // This results in
    //PREVSTATE
    //CONSTRUCTOR
    //PREVSTATE
    let MainInjected = inject(() => ({
        componentProp: "def"
    }))(Main)
    // Uncomment the following line to see default behaviour (without inject)
    //CONSTRUCTOR
    //PREVSTATE
    //MainInjected = Main;

    const store = {}

    const App = () => (
        <Provider store={store}>
            <MainInjected injectedProp={"abc"} />
        </Provider>
    )

    const testRenderer = TestRenderer.create(<App />)
    expect(testRenderer.toJSON()).toMatchSnapshot()
    expect(derived).toBe(1)
})
