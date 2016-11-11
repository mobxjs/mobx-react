import { createClass, createElement, PropTypes } from 'react'
import { mount } from 'enzyme'
import test from 'tape'
import mobx from 'mobx'
import { observer, inject, Provider } from '../'

test('inject based context', t => {
  test('basic context', t => {
    const C = inject('foo')(observer(createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    })));
    const B = createClass({
      render: () => createElement(C, {})
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    });
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('div').text(), 'context:bar');
    t.end();
  });

  test('props override context', t => {
    const C = inject('foo')(createClass({
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
    const C = inject('foo', 'bar')(observer(createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo + this.props.bar);
      }
    })));
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
    const C = inject('foo')(observer(createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    })));
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
    const C = inject('foo')(observer(createClass({
      render() {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    })));
    const B = createClass({
      render: () => createElement(C, { foo: 'bar' })
    });
    const wrapper = mount(createElement(B));
    t.equal(wrapper.find('div').text(), 'context:bar');
    t.end();
  });

  test('inject merges (and overrides) props', t => {
    t.plan(1);
    const C = inject(() => ({ a: 1 }))(observer(createClass({
      render() {
        t.deepEqual(this.props, { a: 1, b: 2 });
        return null;
      }
    })));
    const B = createClass({
      render: () => createElement(C, { a: 2, b: 2 })
    });
    const wrapper = mount(createElement(B));
  });

  test('warning is printed when changing stores', t => {
    let msg;
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

  test('custom storesToProps', t => {
    const C = inject(
      (stores, props, context) => {
        t.deepEqual(context, { mobxStores: { foo: 'bar' }});
        t.deepEqual(stores, { foo: 'bar' });
        t.deepEqual(props, { baz: 42 });
        return {
          zoom: stores.foo,
          baz: props.baz * 2
        }
      }
    )(observer(createClass({
      render: function() {
        return createElement('div', {}, 'context:' + this.props.zoom + this.props.baz);
      }
    })));
    const B = createClass({
      render: () => createElement(C, { baz: 42 })
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    })
    const wrapper = mount(createElement(A));
    t.equal(wrapper.find('div').text(), 'context:bar84');
    t.end();
  });

  test('support static hoisting, wrappedComponent and wrappedInstance', t=> {
    const B = createClass({
      render() {
        this.testField = 1;
        return null;
      },
      propTypes: {
        'x': PropTypes.object
      }
    })
    B.bla = 17;
    B.bla2 = {};
    const C = inject('booh')(B);
    
    t.equal(C.wrappedComponent, B);
    t.equal(B.bla, 17);
    t.equal(C.bla, 17);
    t.ok(C.bla2 === B.bla2);
    t.deepEqual(Object.keys(C.wrappedComponent.propTypes), ['x']);

    const wrapper = mount(createElement(C, { booh: 42 }));
    t.equal(wrapper.root.nodes[0].wrappedInstance.testField, 1);
    t.end();
  });

  test('warning is printed when attaching contextTypes to HOC', t => {
    const msg = [];
    const baseWarn = console.warn;
    console.warn = m => msg.push(m);
    const C = inject(['foo'])(createClass({
      displayName: 'C',
      render: function () {
        return createElement('div', {}, 'context:' + this.props.foo);
      }
    }));
    C.propTypes = {};
    C.defaultProps = {};
    C.contextTypes = {};

    const B = createClass({
      render: () => createElement(C, {})
    });
    const A = createClass({
      render: () => createElement(Provider, { foo: 'bar' }, createElement(B, {}))
    })
    const wrapper = mount(createElement(A));
    t.equal(msg.length, 1);
    t.equal(msg[0], "Mobx Injector: you are trying to attach `contextTypes` on an component decorated with `inject` (or `observer`) HOC. Please specify the contextTypes on the wrapped component instead. It is accessible through the `wrappedComponent`");
    console.warn = baseWarn;
    t.end();
  });

  test('propTypes and defaultProps are forwarded', t => {
    const msg = [];
    const baseError = console.error;
    console.error = m => msg.push(m);

    const C = inject(["foo"])(createClass({
      displayName: 'C',
      render: function() {
        t.equal(this.props.y, 3);
        t.equal(this.props.x, undefined);
        return null;
      }
    }));
    C.propTypes = {
      x: React.PropTypes.func.isRequired,
      z: React.PropTypes.string.isRequired,
    };
    C.wrappedComponent.propTypes = {
      a: React.PropTypes.func.isRequired,
    };
    C.defaultProps = {
      y: 3
    };

    const B = createClass({
      render: () => createElement(C, { z: "test" })
    });
    const A = createClass({
      render: function() {
        return createElement(Provider, { foo: "bar" }, createElement(B, {}))
      }
    });

    const wrapper = mount(createElement(A));
    t.equal(msg.length, 2);
    t.equal(msg[0].split("\n")[0], 'Warning: Failed prop type: Required prop `x` was not specified in `inject-C-with-foo`.');
    t.equal(msg[1].split("\n")[0], 'Warning: Failed prop type: Required prop `a` was not specified in `C`.');
    console.error = baseError;
    t.end();
  });

  test('warning is not printed when attaching propTypes to injected component', t => {
    let msg = [];
    const baseWarn = console.warn;
    console.warn = (m) => msg = m;

    const C = inject(["foo"])(createClass({
      displayName: 'C',
      render: () => createElement("div", {}, "context:" + this.props.foo)
    }));
    C.propTypes = {};

    t.equal(msg.length, 0);
    console.warn = baseWarn;
    t.end();
  })

  test('warning is not printed when attaching propTypes to wrappedComponent', t => {
    let msg = [];
    const baseWarn = console.warn;
    console.warn = m => msg = m;
    const C = inject(["foo"])(createClass({
      displayName: 'C',
      render: () => createElement("div", {}, "context:" + this.props.foo)
    }))
    C.wrappedComponent.propTypes = {};

    t.equal(msg.length, 0);
    console.warn = baseWarn;
    t.end();
  });

  test('using a custom injector is reactive', t => {
    const user = mobx.observable({ name: 'Noa'});
    const mapper = stores => ({ name: stores.user.name });
    const DisplayName = props => createElement('h1', {}, props.name);
    const User = inject(mapper)(DisplayName);
    const App = () => createElement(Provider, { user: user }, createElement(User, {}));
    const wrapper = mount(createElement(App));

    t.equal(wrapper.find('h1').text(), 'Noa');

    user.name = 'Veria';
    t.equal(wrapper.find('h1').text(), 'Veria');
    t.end();
  });

  t.end();
});