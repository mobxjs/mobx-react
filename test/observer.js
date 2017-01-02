import React, { createClass, createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import test from 'tape'
import mobx, { observable, action, computed} from 'mobx'
import mobxReact, { observer, inject } from '../'
import $ from 'jquery'

$('<div></div>').attr('id','testroot').appendTo($(window.document.body));
const testRoot = document.getElementById('testroot');

const store = mobx.observable({
  todos: [{
    title: 'a',
    completed: false
  }]
});

let todoItemRenderings = 0;
const TodoItem = observer(function TodoItem(props) {
  todoItemRenderings++;
  return <li>|{ props.todo.title }</li>
});

let todoListRenderings = 0;
let todoListWillReactCount = 0;
const TodoList = observer(createClass({
  renderings: 0,
  componentWillReact() {
    todoListWillReactCount++;
  },
  render() {
    todoListRenderings++;
    const todos = store.todos;
    return (
      <div>
        <hi>{ todos.length }</hi>
        { todos.map((todo, idx) => <TodoItem key={ idx } todo={ todo } />) }
      </div>
    )
  }
}));

const App = () => <TodoList />

const getDNode = (obj, prop) => obj.$mobx.values[prop]

test('nestedRendering', t => {
  ReactDOM.render(<App />, testRoot, () => {
    t.equal(todoListRenderings, 1, 'should have rendered list once');
    t.equal(todoListWillReactCount, 0, 'should not have reacted yet')
    t.equal($('li').length, 1);
    t.equal($('li').text(), '|a');

    t.equal(todoItemRenderings, 1, 'item1 should render once');

    t.equal(getDNode(store, 'todos').observers.length, 1);
    t.equal(getDNode(store.todos[0], 'title').observers.length, 1);

    store.todos[0].title += 'a';

    setTimeout(() => {
      t.equal(todoListRenderings, 1, 'should have rendered list once');
      t.equal(todoListWillReactCount, 0, 'should not have reacted')
      t.equal(todoItemRenderings, 2, 'item1 should have rendered twice');
      t.equal(getDNode(store, 'todos').observers.length, 1, 'observers count shouldn\'t change');
      t.equal(getDNode(store.todos[0], 'title').observers.length, 1, 'title observers should not have increased');

      store.todos.push({
        title: 'b',
        completed: true
      });

      setTimeout(() => {
        t.equal($('li').length, 2, 'list should two items in in the list');
        t.equal($('li').text(), '|aa|b');

        t.equal(todoListRenderings, 2, 'should have rendered list twice');
        t.equal(todoListWillReactCount, 1, 'should have reacted')
        t.equal(todoItemRenderings, 3, 'item2 should have rendered as well');
        t.equal(getDNode(store.todos[1], 'title').observers.length, 1, 'title observers should have increased');
        t.equal(getDNode(store.todos[1], 'completed').observers.length, 0, 'completed observers should not have increased');

        const oldTodo = store.todos.pop();
        setTimeout(() => {
          t.equal(todoListRenderings, 3, 'should have rendered list another time');
          t.equal(todoListWillReactCount, 2, 'should have reacted')
          t.equal(todoItemRenderings, 3, 'item1 should not have rerendered');
          t.equal($('li').length, 1, 'list should have only on item in list now');
          t.equal(getDNode(oldTodo, 'title').observers.length, 0, 'title observers should have decreased');
          t.equal(getDNode(oldTodo, 'completed').observers.length, 0, 'completed observers should not have decreased');

          t.end();
        });
      }, 100);
    }, 100);
  });
});

test('keep views alive', t => {
  let yCalcCount = 0;
  const data = mobx.observable({
    x: 3,
    get y() {
      yCalcCount++;
      return this.x * 2;
    },
    z: 'hi'
  });

  const TestComponent = observer(function testComponent() {
    return <div>{data.z}{data.y}</div>
  })

  ReactDOM.render(<TestComponent />, testRoot, function() {
    t.equal(yCalcCount, 1);
    t.equal($(testRoot).text(), 'hi6');

    data.z = 'hello';
    // test: rerender should not need a recomputation of data.y because the subscription is kept alive

    setTimeout(() => {
      t.equal(yCalcCount, 1);

      t.equal($(testRoot).text(), 'hello6');
      t.equal(yCalcCount, 1);

      t.equal(getDNode(data, 'y').observers.length, 1);

      ReactDOM.render(<div />, testRoot, () => {
        t.equal(getDNode(data, 'y').observers.length, 0);
        t.end();
      });
    }, 100);
  });
});

test('componentWillMount from mixin is run first', t => {
  t.plan(1)
  debugger;
  const Comp = observer(React.createClass({
    componentWillMount: function() {
      // ugly check, but proofs that observer.willmount has run
      t.equal(this.render.name, "initialRender");
    },
    render() {
      return null
    }
  }))
  ReactDOM.render(<Comp />, testRoot, () => {
    t.end()
  })
})

test('does not views alive when using static rendering', t => {
  mobxReact.useStaticRendering(true);

  let renderCount = 0;
  const data = mobx.observable({
    z: 'hi'
  });

  const TestComponent = observer(function testComponent() {
    renderCount++;
    return <div>{ data.z }</div>
  });

  ReactDOM.render(<TestComponent />, testRoot, function() {

    t.equal(renderCount, 1);
    t.equal($(testRoot).text(), 'hi');

    data.z = 'hello';
    // no re-rendering on static rendering

    setTimeout(() => {
      t.equal(renderCount, 1);

      t.equal($(testRoot).text(), 'hi');
      t.equal(renderCount, 1);

      t.equal(getDNode(data, 'z').observers.length, 0);

      mobxReact.useStaticRendering(false);
      t.end();
    }, 100);
  });
});

test('does not views alive when using static + string rendering', function(test) {
  mobxReact.useStaticRendering(true);

  let renderCount = 0;
  const data = mobx.observable({
    z: 'hi'
  });

  const TestComponent = observer(function testComponent() {
    renderCount++;
    return <div>{ data.z }</div>
  });

  const output = ReactDOMServer.renderToStaticMarkup(<TestComponent />)

  data.z = 'hello';

  setTimeout(() => {
    test.equal(output, '<div>hi</div>')
    test.equal(renderCount, 1);

    test.equal(getDNode(data, 'z').observers.length, 0);

    mobxReact.useStaticRendering(false);
    test.end();
  }, 100);
});

test('issue 12', function(t) {
  const data = mobx.observable({
    selected: 'coffee',
    items: [{
      name: 'coffee'
    }, {
      name: 'tea'
    }]
  });

  /** Row Class */
  class Row extends Component {
    constructor(props) {
      super(props)
    }

    render() {
      return (
        <div>
          { this.props.item.name }
          { data.selected === this.props.item.name ? '!' : '' }
        </div>
      )
    }
  }

  /** table stateles component */
  var Table = observer(function table() {
    return (
      <div>
        {  data.items.map(item => <Row key={ item.name } item={ item } />) }
      </div>
    )
  })

  ReactDOM.render(<Table />, testRoot, function() {
    t.equal($(testRoot).text(), 'coffee!tea');

    mobx.transaction(() => {
      data.items[1].name = 'boe';
      data.items.splice(0, 2, { name : 'soup' });
      data.selected = 'tea';
    });

    setTimeout(() => {
      t.equal($(testRoot).text(), 'soup');
      t.end();
    }, 50);
  });
});

test('changing state in render should fail', function(t) {
  const data = mobx.observable(2);
  const Comp = observer(() => {
    data(3);
    return <div>{ data() }</div>
  });

  t.throws(
    () => ReactDOM.render(<Comp />, testRoot),
    'It is not allowed to change the state during a view'
  );

  mobx._.resetGlobalState();
  t.end();
});

test('component should not be inject', function(t) {
  const msg = [];
  const baseWarn = console.warn;
  console.warn = m => msg.push(m);

  observer(inject('foo')(createClass({
    render() {
      return <div>context:{ this.props.foo }</div>
    }
  })));

  t.equal(msg.length, 1);
  console.warn = baseWarn;
  t.end();
});

test('observer component can be injected', t => {
  const msg = [];
  const baseWarn = console.warn;
  console.warn = m => msg.push(m)

  inject('foo')(observer(createClass({
    render: () => null
  })));

  // N.B, the injected component will be observer since mobx-react 4.0!
  inject(() => {})(observer(createClass({
    render: () => null
  })));

  t.equal(msg.length, 0);
  console.warn = baseWarn;
  t.end();
});

test('124 - react to changes in this.props via computed', function(t) {
  const Comp = observer(createClass({
    componentWillMount() {
      mobx.extendObservable(this, {
        get computedProp() {
          return this.props.x
        }
      })
    },
    render() {
      return <span>x:{ this.computedProp }</span>
    }
  }))

  const Parent = createClass({
    getInitialState() {
      return { v: 1 }
    },
    render() {
      return (
        <div onClick={ () => this.setState({ v: 2 }) }>
          <Comp x={ this.state.v } />
        </div>
      )
    }
  })

  ReactDOM.render(<Parent />, testRoot, () => {
    t.equal($('span').text(), 'x:1')
    $('div').click()
    setTimeout(() => {
      t.equal($('span').text(), 'x:2')
      t.end()
    }, 100)
  })
})

// Test on skip: since all reactions are now run in batched updates, the original issues can no longer be reproduced
test.skip('should stop updating if error was thrown in render (#134)', function(t) {
  const data = mobx.observable(0);
  let renderingsCount = 0;

  const Comp = observer(function() {
    renderingsCount += 1;
    if (data.get() === 2) {
      throw new Error('Hello');
    }
    return <div />
  });

  ReactDOM.render(<Comp />, testRoot, () => {
    t.equal(data.observers.length, 1);
    data.set(1);
    t.throws(() => data.set(2), 'Hello');
    t.equal(data.observers.length, 0);
    data.set(3);
    data.set(4);
    data.set(5);

    t.equal(renderingsCount, 3);
    t.end();
  });
});

test('should render component even if setState called with exactly the same props', function(t) {
  let renderCount = 0;
  const Component = observer(createClass({
    onClick() {
      this.setState({});
    },
    render() {
      renderCount++;
      return <div onClick={ this.onClick } id='clickableDiv' />
    }
  }));
  ReactDOM.render(<Component />, testRoot, () => {
    t.equal(renderCount, 1, 'renderCount === 1');
    $('#clickableDiv').click();
    t.equal(renderCount, 2, 'renderCount === 2');
    $('#clickableDiv').click();
    t.equal(renderCount, 3, 'renderCount === 3');
    t.end();
  });
});

test('it rerenders correctly if some props are non-observables - 1', t => {
  let renderCount = 0;
  let odata = mobx.observable({ x: 1 })
  let data = { y : 1 }

  @observer class Component extends React.Component {
    @mobx.computed get computed () {
      // n.b: data.y would not rerender! shallowly new equal props are not stored
      return this.props.odata.x;
    }
    render() {
      renderCount++;
      return <span onClick={stuff} >{this.props.odata.x}-{this.props.data.y}-{this.computed}</span>
    }
  }

  const Parent = observer(createClass({
    render() {
      // this.props.odata.x;
      return <Component data={this.props.data} odata={this.props.odata} />
    }
  }))

  function stuff() {
    data.y++;
    odata.x++;
  }

  ReactDOM.render(<Parent odata={odata} data={data} />, testRoot, () => {
    t.equal(renderCount, 1, 'renderCount === 1');
    t.equal($("span").text(), "1-1-1");

    $("span").click();
    setTimeout(() => {
      t.equal(renderCount, 2, 'renderCount === 2');
      t.equal($("span").text(), "2-2-2");

      $("span").click();
      setTimeout(() => {
        t.equal(renderCount, 3, 'renderCount === 3');
        t.equal($("span").text(), "3-3-3");

        t.end();
      }, 10);
    }, 20)
  });
})

test('it rerenders correctly if some props are non-observables - 2', t => {
  let renderCount = 0;
  let odata = mobx.observable({ x: 1 })

  @observer class Component extends React.Component {
    @mobx.computed get computed () {
      return this.props.data.y; // should recompute, since props.data is changed
    }

    render() {
      renderCount++;
      return <span onClick={stuff}>{this.props.data.y}-{this.computed}</span>
    }
  }

  const Parent = observer(createClass({
    render() {
      let data = { y : this.props.odata.x }
      return <Component data={data} odata={this.props.odata} />
    }
  }))

  function stuff() {
    odata.x++;
  }

  ReactDOM.render(<Parent odata={odata} />, testRoot, () => {
    t.equal(renderCount, 1, 'renderCount === 1');
    t.equal($("span").text(), "1-1");

    $("span").click();
    setTimeout(() => {
      t.equal(renderCount, 2, 'renderCount === 2');
      t.equal($("span").text(), "2-2");

      $("span").click();
      setTimeout(() => {
        t.equal(renderCount, 3, 'renderCount === 3');
        t.equal($("span").text(), "3-3");

        t.end();
      }, 10);
    }, 20)
  });
})

test('Observer regions should react', t => {
  const data = mobx.observable('hi')
  const Observer = mobxReact.Observer
  const Comp = () =>
    <div>
      <Observer>
        { () => <span>{ data.get() }</span> }
      </Observer>
      <li>{ data.get() }</li>
    </div>
  ReactDOM.render(<Comp />, testRoot, () => {
    t.equal($('span').text(), 'hi');
    t.equal($('li').text(), 'hi');

    data.set('hello');
    t.equal($('span').text(), 'hello');
    t.equal($('li').text(), 'hi');
    t.end();
  })

  test('Observer should not re-render on shallow equal new props', t => {
    let childRendering = 0;
    let parentRendering = 0;
    const data = { x : 1 }
    const odata = mobx.observable({ y: 1 })

    const Child = observer(({ data }) => {
      childRendering++
      return <span>{data.x}</span>
    })
    const Parent = observer(() => {
      parentRendering++
      odata.y; /// depend
      return <Child data={data} />
    })

    ReactDOM.render(<Parent />, testRoot, () => {
      t.equal(parentRendering, 1);
      t.equal(childRendering, 1);
      t.equal($('span').text(), '1');

      odata.y++;
      setTimeout(() => {
        t.equal(parentRendering, 2);
        t.equal(childRendering, 1);
        t.equal($('span').text(), '1');
        t.end();
      }, 20)
    })
  })
})

test('parent / childs render in the right order', t => {
  // See: https://jsfiddle.net/gkaemmer/q1kv7hbL/13/
  t.plan(2)
  let events = []

  class User {
    @observable name = "User's name";
  }

  class Store {
    @observable user = new User();
    @action logout() {
      this.user = null;
    }
  }

  function tryLogout() {
    console.log("Logging out...");
    try {
      // ReactDOM.unstable_batchedUpdates(() => {
        store.logout();
        t.ok(true)
      // });
    } catch(e) {
      t.fail(e)
    }
  }

  const store = new Store();

  const Parent =  observer(() => {
    events.push("parent")
    if (!store.user)
      return <span>Not logged in.</span>;
    return <div>
      <Child />
      <button onClick={tryLogout}>Logout</button>
    </div>;
  });

  const Child = observer(() => {
    events.push("child")
    return <span>Logged in as: {store.user.name}</span>;
  });

  ReactDOM.render(<Parent />, testRoot)

  tryLogout();

  t.deepEqual(events, ["parent", "child", "parent"])
  t.end()

})