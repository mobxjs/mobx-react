import { createClass, createElement } from 'react'
import { mount } from 'enzyme'
import test from 'tape'
import mobx from 'mobx'
import { observer, inject, Provider } from '../'

test('observer based context', t => {
  test('basic context', t => {
    const C = observer(['foo'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    const B = createClass({
      render:() => createElement(C, {})
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    });
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('div').text(), 'context:bar');
    t.end();
  });

  test('props override context', t => {
    const C = observer(['foo'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    const B = createClass({
      render: () => createElement(C, { foo: 42 })
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    });
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('div').text(), 'context:42');
    t.end();
  });

  test('overriding stores is supported', t => {
    const C = observer(['foo', 'bar'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo + this.props.bar);
      }
    }));
    const B = createClass({
      render: () => createElement(C, {})
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar', bar: 1337 },
        createElement('div', {},
          createElement('span', {},
            createElement(B, {})
          ),
          createElement('section', {},
            createElement(Provider, { foo: 42}, createElement(B, {}))
          )
        )
      )
    });
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('span').text(), 'context:bar1337');
    t.equal(wrapper.find('section').text(), 'context:421337');
    t.end();
  });

  test('store should be available', t => {
    const C = observer(['foo'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    const B = createClass({
      render: () => createElement(C, {})
    });
    const A = createClass({
      render: () => createElement(Provider, { baz: 42 }, createElement(B, {}))
    });
    t.throws(() => mount(createElement(A)), /Store 'foo' is not available! Make sure it is provided by some Provider/);
    t.end();
  });

  test('store is not required if prop is available', t => {
    const C = observer(['foo'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo)
      }
    }));
    const B = createClass({
      render: () => createElement(C, { foo: 'bar' })
    });
    const wrapper = mount(createElement(B));
    t.equal(wrapper.find('div').text(), 'context:bar');
    t.end();
  });

  test('warning is printed when changing stores', t => {
    let msg = null;
    const baseWarn = console.warn;
    console.warn = m => msg = m;
    const a = mobx.observable(3);
    const C = observer(['foo'], createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    const B = observer(createClass({
      render: () => createElement(C, {})
    }));
    const A = observer(createClass({
      render: () => createElement('section', {},
        createElement('span', {}, a.get()),
        createElement(Provider, { foo: a.get() }, createElement(B, {}))
      )
    }));
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('span').text(), '3');
    t.equal(wrapper.find('div').text(), 'context:3');
    a.set(42);
    t.equal(wrapper.find('span').text(), '42');
    t.equal(wrapper.find('div').text(), 'context:3');
    t.equal(msg, 'MobX Provider: Provided store \'foo\' has changed. Please avoid replacing stores as the change might not propagate to all children');
    console.warn = baseWarn;
    t.end();
  });

  test('warning is printed when attaching propTypes/defaultProps/contextTypes to HOC not in production', t => {
    let msg = [];
    const baseWarn = console.warn;
    console.warn = m => msg.push(m);
    const C = inject(['foo'])(createClass({
      displayName: 'C',
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    C.propTypes = {};
    C.defaultProps = {};
    C.contextTypes = {};
    const B = createClass({
      render: () => createElement(C, {})
    })
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    })
    const wrapper = mount(createElement(A));
    t.equal(msg.length, 3);
    t.deepEqual(
      msg,
      [
        'Mobx Injector: you are trying to attach propTypes to HOC instead of C. Use `wrappedComponent` property.',
        'Mobx Injector: you are trying to attach defaultProps to HOC instead of C. Use `wrappedComponent` property.',
        'Mobx Injector: you are trying to attach contextTypes to HOC instead of C. Use `wrappedComponent` property.'
      ]
    );
    console.warn = baseWarn;
    t.end();
  });


  test('warning is not printed when attaching propTypes to wrappedComponent', t => {
    let msg = [];
    const baseWarn = console.warn;
    console.warn = m => msg = m;
    const C = inject(['foo'])(createClass({
      displayName: 'C',
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    C.wrappedComponent.propTypes = {};
    const B = createClass({
      render: () => createElement(C, {})
    })
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    });
    const wrapper = mount(createElement(A));
    t.equal(msg.length, 0);
    console.warn = baseWarn;
    t.end();
  })

  t.end();
});
