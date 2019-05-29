import React, { useState, useEffect } from "react"
import { observer, Observer, useLocalStore, useAsObservableSource } from "../src"
import { sleepHelper } from "."
import renderer, { act } from "react-test-renderer"

test("computed properties react to props when using hooks", async () => {
    const seen = []

    const Child = ({ x }) => {
        const props = useAsObservableSource({ x })
        const store = useLocalStore(() => ({
            get getPropX() {
                return props.x
            }
        }))

        return <Observer>{() => (seen.push(store.getPropX), <div>{store.getPropX}</div>)}</Observer>
    }

    const Parent = () => {
        const [state, setState] = useState({ x: 0 })
        seen.push("parent")
        useEffect(() => {
            setTimeout(() => {
                act(() => {
                    setState({ x: 2 })
                })
            }, 100)
        }, [])
        return <Child x={state.x} />
    }

    let wrapper
    act(() => {
        wrapper = renderer.create(<Parent />)
    })
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  0
</div>
`)

    await sleepHelper(400)
    expect(seen).toEqual(["parent", 0, "parent", 2])
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  2
</div>
`)
})

test("computed properties result in double render when using observer instead of Observer", async () => {
    const seen = []

    const Child = observer(({ x }) => {
        const props = useAsObservableSource({ x })
        const store = useLocalStore(() => ({
            get getPropX() {
                return props.x
            }
        }))

        seen.push(store.getPropX)
        return <div>{store.getPropX}</div>
    })

    const Parent = () => {
        const [state, setState] = useState({ x: 0 })
        seen.push("parent")
        useEffect(() => {
            setTimeout(() => {
                act(() => {
                    setState({ x: 2 })
                })
            }, 100)
        }, [])
        return <Child x={state.x} />
    }

    let wrapper
    act(() => {
        wrapper = renderer.create(<Parent />)
    })
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  0
</div>
`)

    await sleepHelper(400)
    expect(seen).toEqual([
        "parent",
        0,
        "parent",
        2,
        2 // should contain "2" only once! But with hooks, one update is scheduled based the fact that props change, the other because the observable source changed.
    ])
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  2
</div>
`)
})
