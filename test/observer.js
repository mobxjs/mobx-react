import { createClass, createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import test from 'tape'
import mobx from 'mobx'
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
const todoItem = observer(function TodoItem(props) {
  todoItemRenderings++;
  return createElement('li', {}, '|' + props.todo.title);
});

let todoListRenderings = 0;
let todoListWillReactCount = 0;
const todoList = observer(createClass({
  renderings: 0,
  componentWillReact() {
    todoListWillReactCount++;
  },
  render() {
    todoListRenderings++;
    const todos = store.todos;
    return createElement('div', {},
      createElement('h1', null, todos.length),
      todos.map(function(todo, idx) {
        return createElement(todoItem, {
          key: idx,
          todo: todo
        });
      })
    );
  }
}));

const app = createClass({
  render: () => createElement(todoList)
});

function getDNode(obj, prop) {
  return obj.$mobx.values[prop];
}

test('nestedRendering', t => {
  ReactDOM.render(createElement(app), testRoot, () => {
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
    y: function() {
      yCalcCount++;
      return this.x * 2;
    },
    z: 'hi'
  });

  const component = observer(function testComponent() {
    return createElement('div', {}, data.z + data.y)
  })

  ReactDOM.render(createElement(component), testRoot, function() {
    t.equal(yCalcCount, 1);
    t.equal($(testRoot).text(), 'hi6');

    data.z = 'hello';
    // test: rerender should not need a recomputation of data.y because the subscription is kept alive

    setTimeout(() => {
      t.equal(yCalcCount, 1);

      t.equal($(testRoot).text(), 'hello6');
      t.equal(yCalcCount, 1);

      t.equal(getDNode(data, 'y').observers.length, 1);

      ReactDOM.render(createElement('div'), testRoot, () => {
        t.equal(getDNode(data, 'y').observers.length, 0);
        t.end();
      });
    }, 100);
  });
});

test('does not views alive when using static rendering', t => {
  mobxReact.useStaticRendering(true);

  let renderCount = 0;
  const data = mobx.observable({
    z: 'hi'
  });

  const component = observer(function testComponent() {
    renderCount++;
    return createElement('div', {}, data.z);
  });

  ReactDOM.render(createElement(component), testRoot, function() {

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

  const component = observer(function testComponent() {
    renderCount++;
    return createElement('div', {}, data.z);
  });

  const output = ReactDOMServer.renderToStaticMarkup(createElement(component))

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
      return createElement('div', {}, this.props.item.name + (data.selected === this.props.item.name ? '!' : ""));
    }
  }

  /** table stateles component */
  var table = observer(function table() {
    return createElement('div', {}, data.items.map(function(item) {
      return createElement(Row, { key: item.name, item: item})
    }));
  })

  ReactDOM.render(createElement(table), testRoot, function() {
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
  const comp = observer(() => {
    data(3);
    return createElement('div', {}, data());
  });

  t.throws(
    () => ReactDOM.render(createElement(comp), testRoot),
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
      return createElement('div', {}, 'context:' + this.props.foo);
    }
  })));

  t.equal(msg.length, 1);
  console.warn = baseWarn;
  t.end();
});

test('124 - react to changes in this.props via computed', function(t) {
  const c = observer(createClass({
    componentWillMount() {
      mobx.extendObservable(this, {
        get computedProp() {
          return this.props.x
        }
      })
    },
    render() {
      return createElement('span', {}, 'x:' + this.computedProp)
    }
  }))

  const parent = createClass({
    getInitialState() {
      return { v: 1 }
    },
    render() {
      return createElement(
        'div',
        { onClick: () => this.setState({ v: 2 }) },
        createElement(c, { x: this.state.v })
      )
    }
  })

  ReactDOM.render(createElement(parent), testRoot, () => {
    t.equal($('span').text(), 'x:1')
    $('div').click()
    setTimeout(() => {
      t.equal($('span').text(), 'x:2')
      t.end()
    }, 100)
  })
})

test('should stop updating if error was thrown in render (#134)', function(t) {
  const data = mobx.observable(0);
  let renderingsCount = 0;

  const comp = observer(function() {
    renderingsCount += 1;
    if (data.get() === 2) {
      throw new Error('Hello');
    }
    return createElement('div', {});
  });

  ReactDOM.render(createElement(comp), testRoot, () => {
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
      return createElement('div', {onClick: this.onClick, id: 'clickableDiv'});
    }
  }));
  ReactDOM.render(createElement(Component), testRoot, () => {
    t.equal(renderCount, 1, 'renderCount === 1');
    $('#clickableDiv').click();
    t.equal(renderCount, 2, 'renderCount === 2');
    $('#clickableDiv').click();
    t.equal(renderCount, 3, 'renderCount === 3');
    t.end();
  });
});
test('Observer regions should react', t => {
  const data = mobx.observable('hi')
  const comp = () => createElement('div', {},
    createElement(mobxReact.Observer, {}, () => createElement('span', {}, data.get())),
    createElement('li', {}, data.get())
  );

  ReactDOM.render(createElement(comp), testRoot, () => {
    t.equal($('span').text(), 'hi');
    t.equal($('li').text(), 'hi');

    data.set('hello');
    t.equal($('span').text(), 'hello');
    t.equal($('li').text(), 'hi');
    t.end();
  })
})