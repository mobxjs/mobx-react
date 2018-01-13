import React, { createElement, Component } from "react"
import createClass from "create-react-class"
import ReactDOM from "react-dom"
import ReactDOMServer from "react-dom/server"
import TestUtils from 'react-dom/test-utils'
import * as mobx from "mobx"
import { observer, inject, onError, offError, useStaticRendering, Observer } from "../"
import { createTestRoot, sleepHelper, asyncReactDOMRender } from "./index"
import ErrorCatcher from "./ErrorCatcher"


/**
 *  some test suite is too tedious
 */

const testRoot = createTestRoot()

const getDNode = (obj, prop) => obj.$mobx.values[prop]

afterEach(()=>{
    // the side-effect in  does not views alive when using static rendering test suite
    useStaticRendering(false)
})

const asyncRender = (element,root)=>{
    return new Promise((resolve)=>{
       ReactDOM.render(<element/>)
    })
}

/*
 use TestUtils.renderIntoDocument  will re-mounted the component  with with different props
 some misunderstanding will be cause？
*/
describe("nestedRendering",async()=>{
    const testRoot = createTestRoot()

    // init element 
    const store = mobx.observable({
        todos: [
            {
                title: "a",
                completed: false
            }
        ]
    })
    
    let todoItemRenderings = 0
    const TodoItem = observer(function TodoItem(props) {
        todoItemRenderings++
        return <li>|{props.todo.title}</li>
    })
    
    let todoListRenderings = 0
    let todoListWillReactCount = 0
    const TodoList = observer(
        createClass({
            renderings: 0,
            componentWillReact() {
                todoListWillReactCount++
            },
            render() {
                todoListRenderings++
                const todos = store.todos
                return (
                    <div>
                        <span>{todos.length}</span>
                        {todos.map((todo, idx) => <TodoItem key={idx} todo={todo} />)}
                    </div>
                )
            }
        })
    )
   beforeAll(async(done)=>{
       await asyncReactDOMRender(TodoList, testRoot)
       done()
   })
    
   
    test("first rendering",()=>{
        expect(todoListRenderings).toBe(1)
        expect(todoListWillReactCount).toBe(0)
        expect(testRoot.querySelectorAll("li").length).toBe(1)
        expect(testRoot.querySelector("li").innerHTML).toBe("|a")
        expect(todoItemRenderings).toBe(1)
    })

    test("second rendering with inner store changed",()=>{
        store.todos[0].title += "a"
        expect(todoListRenderings).toBe(1)
        expect(todoListWillReactCount).toBe(0)
        expect(todoItemRenderings).toBe(2)
        expect(getDNode(store, "todos").observers.length).toBe(1)
        expect(getDNode(store.todos[0], "title").observers.length).toBe(1)
    })

    test("rerendering with outer store added",()=>{
        store.todos.push({
            title: "b",
            completed: true
        })
          const stub = TestUtils.scryRenderedComponentsWithType(container,TodoItem)
          expect(testRoot.querySelectorAll("li").length).toBe(2)
          expect(stub.map(sub=>(sub.props.todo.title)).sort()).toEqual(["aa","b"].sort())
          expect(todoListRenderings).toBe(2)
          expect(todoListWillReactCount).toBe(1)
          expect(todoItemRenderings).toBe(3)
          expect(getDNode(store.todos[1], "title").observers.length).toBe(1)
          expect(getDNode(store.todos[1], "completed").observers.length).toBe(0)   
    })

    // test("rerendering with outer store pop", ()=>{
    //     const oldTodo = store.todos.pop()
    //     const stub = TestUtils.scryRenderedComponentsWithType(container,TodoItem)
    //         expect(todoListRenderings).toBe(3)
    //         expect(todoListWillReactCount).toBe(2)
    //         expect(todoItemRenderings).toBe(3)
    //         expect(stub.length).toBe(1)
    //         expect(getDNode(oldTodo, "title").observers.length).toBe(0)
    //         expect(getDNode(oldTodo, "completed").observers.length).toBe(0)
    // })
})

// describe("keep views alive",()=>{
//     let yCalcCount = 0
//     const data = mobx.observable({
//         x: 3,
//         get y() {
//             yCalcCount++
//             return this.x * 2
//         },
//         z: "hi"
//     })
//     const TestComponent = observer(function testComponent() {
//         return (
//             <div>
//                 {data.z}
//                 {data.y}
//             </div>
//         )
//     })
//     const element = TestUtils.renderIntoDocument(<TestComponent />)
    
//     test("init state",()=>{
//         expect(yCalcCount).toBe(1)
//         expect(TestUtils.findRenderedDOMComponentWithTag(element, 'div').innerHTML).toBe('hi6')
//     })

//     test("rerender should not need a recomputation of data.y",(done)=>{
//         data.z = "hello"
//         expect(yCalcCount).toBe(1)
//         expect(TestUtils.findRenderedDOMComponentWithTag(element, 'div').innerHTML).toBe('hello6')
//         done()
//     })
// })

// test("componentWillMount from mixin is run first",()=>{
//     const Comp = observer(
//         createClass({
//             componentWillMount: function() {
//                 // ugly check, but proofs that observer.willmount has run
//                 expect(this.render.name).toBe("initialRender")
//             },
//             render() {
//                 return null
//             }
//         })
//     )
//     TestUtils.renderIntoDocument(<Comp />)
// })

// describe("does not views alive when using static rendering",()=>{
//     useStaticRendering(true)

//     let renderCount = 0
//     const data = mobx.observable({
//         z: "hi"
//     })

//     const TestComponent = observer(function testComponent() {
//         renderCount++
//         return <div>{data.z}</div>
//     })
//     const element = TestUtils.renderIntoDocument(<TestComponent />)

//     test('init state is correct',()=>{
//         expect(renderCount).toBe(1)
//         expect(TestUtils.findRenderedDOMComponentWithTag(element, 'div').innerHTML).toBe('hi')
//     })

//     test('no re-rendering on static rendering',()=>{
//         data.z = "hello"
//             expect(renderCount).toBe(1)
//             expect(TestUtils.findRenderedDOMComponentWithTag(element, 'div').innerHTML).toBe('hi')
//             expect(getDNode(data, "z").observers.length).toBe(0)
//             useStaticRendering(false)
//     })
// })

// describe("issue 12",()=>{
//     const data = mobx.observable({
//         selected: "coffee",
//         items: [
//             {
//                 name: "coffee"
//             },
//             {
//                 name: "tea"
//             }
//         ]
//     })

//     /** Row Class */
//     class Row extends Component {
//         constructor(props) {
//             super(props)
//         }

//         render() {
//             return (
//                 <span>
//                     {this.props.item.name}
//                     {data.selected === this.props.item.name ? "!" : ""}
//                 </span>
//             )
//         }
//     }
//     /** table stateles component */
//     const Table = observer(function table() {
//         return <div>{data.items.map(item => <Row key={item.name} item={item} />)}</div>
//     }) 

//     const container = TestUtils.renderIntoDocument(<Table />)

//     test("init state is correct",()=>{
//         expect(TestUtils.scryRenderedDOMComponentsWithTag(container, 'span').map(tag=>tag.innerHTML).sort()).toEqual(['coffee!','tea'].sort())
//     })
    
//     test.skip("run transaction",()=>{
//         mobx.transaction(() => {
//             data.items[1].name = "boe"
//             data.items.splice(0, 2, { name: "soup" })
//             data.selected = "tea"
//         })
//         expect(TestUtils.scryRenderedDOMComponentsWithTag(container, 'span').map(tag=>tag.innerHTML)).toEqual(["soup"])
       
//     })
// })

// test("changing state in render should fail",()=>{
//     const data = mobx.observable(2)
//     const Comp = observer(() => {
//         if (data.get() === 3) {
//             try {
//                 data.set(4) // wouldn't throw first time for lack of observers.. (could we tighten this?)
//             } catch (err) {
//                 expect(/Side effects like changing state are not allowed at this point/.test(err)).toBeTruthy()
//             }
//         }
//         return <div>{data.get()}</div>
//     })
//     TestUtils.renderIntoDocument(<Comp />)
    
//     data.set(3)
//     mobx.extras.resetGlobalState()
// })

// test("component should not be inject", ()=>{
//     const msg = []
//     const baseWarn = console.warn
//     console.warn = m => msg.push(m)

//     observer(
//         inject("foo")(
//             createClass({
//                 render() {
//                     return <div>context:{this.props.foo}</div>
//                 }
//             })
//         )
//     )

//     expect(msg.length).toBe(1)
//     console.warn = baseWarn
// })

// test("observer component can be injected", () => {
//     const msg = []
//     const baseWarn = console.warn
//     console.warn = m => msg.push(m)

//     inject("foo")(
//         observer(
//             createClass({
//                 render: () => null
//             })
//         )
//     )

//     // N.B, the injected component will be observer since mobx-react 4.0!
//     inject(() => {})(
//         observer(
//             createClass({
//                 render: () => null
//             })
//         )
//     )

//     expect(msg.length).toBe(0)
//     console.warn = baseWarn
// })

// describe("124 - react to changes in this.props via computed",()=>{
//     const Comp = observer(
//         createClass({
//             componentWillMount() {
//                 mobx.extendObservable(this, {
//                     get computedProp() {
//                         return this.props.x
//                     }
//                 })
//             },
//             render() {
//                 return <span>x:{this.computedProp}</span>
//             }
//         })
//     )

//     const Parent = createClass({
//         getInitialState() {
//             return { v: 1 }
//         },
//         render() {
//             return (
//                 <div onClick={() => this.setState({ v: 2 })}>
//                     <Comp x={this.state.v} />
//                 </div>
//             )
//         }
//     })

//     const container = TestUtils.renderIntoDocument(<Parent />)

//     test('init state is correct',()=>{
//         expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("x:1")  
//     })

//     test('change after click',(done)=>{
//         TestUtils.findRenderedDOMComponentWithTag(container,'div').click()
//         setTimeout(()=>{
//         expect(
//             TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML
//         ).toBe("x:2")  
//         done()
//         },100)
//     })
// })

//   // Test on skip: since all reactions are now run in batched updates, the original issues can no longer be reproduced
//   //this test case should be deprecated?
//   test.skip("should stop updating if error was thrown in render (#134)", (done)=>{
//     const data = mobx.observable(0)
//     let renderingsCount = 0

//     const Comp = observer(function() {
//         renderingsCount += 1
//         if (data.get() === 2) {
//             throw new Error("Hello")
//         }
//         return <div />
//     })
    
//     TestUtils.renderIntoDocument(<Comp />)
//     expect(data.observers.length).toBe(1)
//         data.set(1)
//         expect(data.set(2)).toThrow("Hello")
//         expect(data.observers.length).toBe(0)
//         data.set(3)
//         data.set(4)
//         data.set(5)

//         expect(renderingsCount).toBe(3)
//         done()
// })

// describe("should render component even if setState called with exactly the same props",()=>{
//     let renderCount = 0
//     const Component = observer(
//         createClass({
//             onClick() {
//                 this.setState({})
//             },
//             render() {
//                 renderCount++
//                 return <div onClick={this.onClick} id="clickableDiv" />
//             }
//         })
//     )
//     const element = TestUtils.renderIntoDocument(<Component />)

//     test("renderCount === 1",()=>{
//         expect(renderCount).toBe(1)
//     })
    
//     test("after click once renderCount === 2",(done)=>{
//       TestUtils.findRenderedDOMComponentWithTag(element,'div').click()
//       setTimeout(()=>{
//         expect(renderCount).toBe(2)
//       },10)
//       done()
//    })

//    test("after click twice renderCount === 3",(done)=>{
//     TestUtils.findRenderedDOMComponentWithTag(element,'div').click()
//     setTimeout(()=>{
//       expect(renderCount).toBe(3)
//     },10)
//     done()
//  })
// })

// describe("it rerenders correctly if some props are non-observables - 1",()=>{
//     let renderCount = 0
//     let odata = mobx.observable({ x: 1 })
//     let data = { y: 1 }

//     @observer
//     class Component extends React.Component {
//         @mobx.computed
//         get computed() {
//             // n.b: data.y would not rerender! shallowly new equal props are not stored
//             return this.props.odata.x
//         }
//         render() {
//             renderCount++
//             return (
//                 <span onClick={stuff}>
//                     {this.props.odata.x}-{this.props.data.y}-{this.computed}
//                 </span>
//             )
//         }
//     }

//     const Parent = observer(
//         createClass({
//             render() {
//                 // this.props.odata.x;
//                 return <Component data={this.props.data} odata={this.props.odata} />
//             }
//         })
//     )

//     function stuff() {
//         data.y++
//         odata.x++
//     }
    
//     const container = TestUtils.renderIntoDocument(<Parent odata={odata} data={data} />)

//     test("init renderCount === 1",()=>{
//         expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("1-1-1")
//     })

//     test("after click renderCount === 2",(done)=>{
//         TestUtils.findRenderedDOMComponentWithTag(container,'span').click()
//         setTimeout(()=>{
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("2-2-2")
//         },10)
//         done()
//     })
    
//     test("after click twice renderCount === 3",(done)=>{
//         TestUtils.findRenderedDOMComponentWithTag(container,'span').click()
//         setTimeout(()=>{
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("3-3-3")
//         },10)
//         done()
//     })
// })

// describe("it rerenders correctly if some props are non-observables - 2",()=>{
//     let renderCount = 0
//     let odata = mobx.observable({ x: 1 })

//     @observer
//     class Component extends React.Component {
//         @mobx.computed
//         get computed() {
//             return this.props.data.y // should recompute, since props.data is changed
//         }

//         render() {
//             renderCount++
//             return (
//                 <span onClick={stuff}>
//                     {this.props.data.y}-{this.computed}
//                 </span>
//             )
//         }
//     }

//     const Parent = observer(
//         createClass({
//             render() {
//                 let data = { y: this.props.odata.x }
//                 return <Component data={data} odata={this.props.odata} />
//             }
//         })
//     )

//     function stuff() {
//         odata.x++
//     }

//     const container = TestUtils.renderIntoDocument(<Parent odata={odata} />)

//     test("init renderCount === 1",()=>{
//         expect(renderCount).toBe(1)
//         expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("1-1")
//     })

//     test("after click renderCount === 2",(done)=>{
//         TestUtils.findRenderedDOMComponentWithTag(container,'span').click()
//         setTimeout(()=>{
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("2-2")
//         },10)
//         done()
//     })

//     test("after click renderCount === 3",(done)=>{
//         TestUtils.findRenderedDOMComponentWithTag(container,'span').click()
//         setTimeout(()=>{
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe("3-3")
//         },10)
//         done()
//     })
// })


// describe("Observer regions should react", () => {
//     const data = mobx.observable("hi")
//     const Comp = () => (
//         <div>
//             <Observer>{() => <span>{data.get()}</span>}</Observer>
//             <li>{data.get()}</li>
//         </div>
//     )
//         const container = TestUtils.renderIntoDocument(<Comp />)

//         test('init state is correct',(done)=>{
//             setTimeout(()=>{
//                expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe('hi')
//                expect(TestUtils.findRenderedDOMComponentWithTag(container,'li').innerHTML).toBe('hi')
//             },10)
//             done()
           
//         })
       
//         test('set the data to hello',(done)=>{
//             setTimeout(()=>{
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'span').innerHTML).toBe('hello')
//             expect(TestUtils.findRenderedDOMComponentWithTag(container,'li').innerHTML).toBe('hi')
//             },10)
//             done()
//         })
// })

// describe("Observer should not re-render on shallow equal new props",()=>{
//     let childRendering = 0
//     let parentRendering = 0
//     const data = { x: 1 }
//     const odata = mobx.observable({ y: 1 })

//     const Child = observer(({ data }) => {
//         childRendering++
//         return <span>{data.x}</span>
//     })
//     const Parent = observer(() => {
//         parentRendering++
//         odata.y /// depend
//         return <Child data={data} />
//     })

//     const element = TestUtils.renderIntoDocument(<Parent />)

//     test("init state is correct",()=>{
//         expect(parentRendering).toBe(1)
//         expect(childRendering).toBe(1)
//         expect(TestUtils.findRenderedDOMComponentWithTag(element,'span').innerHTML).toBe("1")
//     })

//     test("after odata change",(done)=>{
//         odata.y++
//         setTimeout(()=>{
//             expect(parentRendering).toBe(2)
//             expect(childRendering).toBe(1)
//             expect(TestUtils.findRenderedDOMComponentWithTag(element,'span').innerHTML).toBe("1")
//         },10)
//         done()
//     })
// })


// test("parent / childs render in the right order", done => {
//     // See: https://jsfiddle.net/gkaemmer/q1kv7hbL/13/
//     let events = []

//     class User {
//         @mobx.observable name = "User's name"
//     }

//     class Store {
//         @mobx.observable user = new User()
//         @mobx.action
//         logout() {
//             this.user = null
//         }
//     }

//     function tryLogout() {
//         console.log("Logging out...")
//         try {
//             // ReactDOM.unstable_batchedUpdates(() => {
//             store.logout()
//             expect(true).toBeTruthy(true)
//             // });
//         } catch (e) {
//             // t.fail(e)
//         }
//     }

//     const store = new Store()

//     const Parent = observer(() => {
//         events.push("parent")
//         if (!store.user) return <span>Not logged in.</span>
//         return (
//             <div>
//                 <Child />
//                 <button onClick={tryLogout}>Logout</button>
//             </div>
//         )
//     })

//     const Child = observer(() => {
//         events.push("child")
//         return <span>Logged in as: {store.user.name}</span>
//     })

//     const container = TestUtils.renderIntoDocument(<Parent />)

//     tryLogout()
//     expect(events).toEqual(["parent", "child", "parent"])
//     done()
// })

// describe("206 - @observer should produce usefull errors if it throws", () => {
//     const data = mobx.observable({ x: 1 })
//     let renderCount = 0

//     const emmitedErrors = []
//     const disposeErrorsHandler = onError(error => emmitedErrors.push(error))
    
//     @observer
//     class Child extends React.Component {
//         render() {
//             renderCount++
//             if (data.x === 42) throw new Error("Oops!")
//             return <span>{data.x}</span>
//         }
//     }

//     TestUtils.renderIntoDocument(<Child />)
    
//     beforeAll(()=>{
//         disposeErrorsHandler()
//     })

//     test('init renderCount should === 1',()=>{
//         expect(renderCount).toBe(1)
//     })

//     test('catch exception',()=>{
//         try{
//          data.x = 42
//         }catch(e){
//           expect(lines[0]).toBe("Error: Oops!")
//           expect(lines[1].indexOf("at Child.render")).toBe(4)
//           expect(renderCount).toBe(2)
//         }
//     })
    
//     test('component recovers!',(done)=>{
//         setTimeout(()=>{
//             data.x=3
//             expect(renderCount).toBe(3)
//             expect(emmitedErrors).toEqual([new Error("Oops!")])
//             done()
//         },500)
//     })
// })

// test("195 - async componentWillMount does not work",(done)=>{
//     const renderedValues = []

//     @observer
//     class WillMount extends React.Component {
//         @observable counter = 0

//         @action inc = () => this.counter++

//         componentWillMount() {
//             setTimeout(() => this.inc(), 300)
//         }

//         render() {
//             renderedValues.push(this.counter)
//             return (
//                 <p>
//                     {this.counter}
//                     <button onClick={this.inc}>+</button>
//                 </p>
//             )
//         }
//     }
//     TestUtils.renderIntoDocument(<WillMount />)

//     setTimeout(()=>{
//        expect(renderedValues).toEqual([0, 1])
//        done()
//     },500)
// })

// test.skip("195 - should throw if trying to overwrite lifecycle methods", done => {
//     // Test disabled, see #231...

//     @observer
//     class WillMount extends React.Component {
//         componentWillMount = () => {}

//         render() {
//             return null
//         }
//     }
//     expect(TestUtils.renderIntoDocument(<WillMount />)).toThrow(/Cannot assign to read only property 'componentWillMount'/)
//     done()
// })