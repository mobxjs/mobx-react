import { createClass, createElement } from 'react'
import ReactDOM from 'react-dom'
import { mount, shallow } from 'enzyme'
import test from 'tape'
import mobx from 'mobx'
import { observer } from '../'

test('custom shouldComponentUpdate is not respected for observable changes (#50)', t => {
  let called = 0;
  const x = mobx.observable(3);
  const C = observer(createClass({
    render: () => createElement('div', {}, 'value:' + x.get()),
    shouldComponentUpdate: () => called++
  }));
  const wrapper = mount(createElement(C));
  t.equal(wrapper.find('div').text(), 'value:3');
  t.equal(called, 0)
  x.set(42);
  t.equal(wrapper.find('div').text(), 'value:42');
  t.equal(called, 0);
  t.end();
});

test('custom shouldComponentUpdate is not respected for observable changes (#50) - 2', t => {
  // TODO: shouldComponentUpdate is meaningless with observable props...., just show warning in component definition?
  let called = 0;
  const y = mobx.observable(5)
  const C = observer(createClass({
    render() {
      return createElement('div', {}, 'value:' + this.props.y);
    },
    shouldComponentUpdate(nextProps) {
      called++;
      return nextProps.y !== 42;
    }
  }));
  const B = observer(createClass({
    render: () => createElement('span', {}, createElement(C, {y: y.get()}))
  }));
  const wrapper = mount(createElement(B));
  t.equal(wrapper.find('div').text(), 'value:5');
  t.equal(called, 0)

  y.set(6);
  t.equal(wrapper.find('div').text(), 'value:6');
  t.equal(called, 1)

  y.set(42)
  // t.equal(wrapper.find('div').text(), 'value:6'); // not updated! TODO: fix
  t.equal(called, 2)

  y.set(7)
  t.equal(wrapper.find('div').text(), 'value:7');
  t.equal(called, 3)

  t.end();
})

test('issue mobx 405', t => {
  function ExampleState() {
    mobx.extendObservable(this, {
      name: 'test',
      greetings: function() {
        return 'Hello my name is ' + this.name;
      }
    })
  }

  const ExampleView = observer(createClass({
    render: function() {
      return createElement('div', {},
        createElement('input', {
          type: 'text',
          value: this.props.exampleState.name,
          onChange: e => this.props.exampleState.name = e.target.value
        }),
        createElement('span', {}, this.props.exampleState.greetings)
      );
    }
  }));

  const exampleState = new ExampleState();
  const wrapper = shallow(createElement(ExampleView, { exampleState }));
  t.equal(wrapper.find('span').text(), 'Hello my name is test');

  t.end();
});

test('#85 Should handle state changing in constructors', function(t) {
  const a = mobx.observable(2);
  const child = observer(createClass({
    displayName: 'Child',
    getInitialState() {
      a.set(3); // one shouldn't do this!
      return {};
    },
    render: () => createElement('div', {}, 'child:', a.get(), ' - ')
  }));
  const parent = observer(function Parent() {
    return createElement('span', {},
      createElement(child, {}),
      'parent:',
      a.get()
    );
  });
  ReactDOM.render(createElement(parent, {}), document.getElementById('testroot'), () => {
    t.equal(document.getElementsByTagName('span')[0].textContent, 'child:3 - parent:3');
    a.set(5);
    t.equal(document.getElementsByTagName('span')[0].textContent, 'child:5 - parent:5');
    a.set(7);
    t.equal(document.getElementsByTagName('span')[0].textContent, 'child:7 - parent:7');
    t.end();
  });
});