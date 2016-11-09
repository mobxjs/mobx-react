var React = require('react');
var enzyme = require('enzyme');
var mount = enzyme.mount;
var mobx = require('mobx');
var observer = require('../').observer;
var inject = require('../').inject;
var Provider = require('../').Provider;
var test = require('tape');
var e = React.createElement;

test('observer based context', t => {
    test('basic context', t => {
        var C = observer(["foo"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo);
            }
        }));

        var B = React.createClass({
            render: function() {
                return e(C, {});
            }
        });

        var A = React.createClass({
            render: function() {
                return e(Provider, { foo: "bar" }, e(B, {}))
            }
        })

        const wrapper = mount(e(A));
        t.equal(wrapper.find("div").text(), "context:bar");
        t.end();
    })

    test('props override context', t => {
        var C = observer(["foo"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo);
            }
        }));

        var B = React.createClass({
            render: function() {
                return e(C, { foo: 42 });
            }
        });

        var A = React.createClass({
            render: function() {
                return e(Provider, { foo: "bar" }, e(B, {}))
            }
        })

        const wrapper = mount(e(A));
        t.equal(wrapper.find("div").text(), "context:42");
        t.end();
    })


    test('overriding stores is supported', t => {
        var C = observer(["foo", "bar"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo + this.props.bar);
            }
        }));

        var B = React.createClass({
            render: function() {
                return e(C, {});
            }
        });

        var A = React.createClass({
            render: function() {
                return e(Provider, { foo: "bar", bar: 1337 },
                    e("div", {},
                        e("span", {},
                            e(B, {})
                        ),
                        e("section", {},
                            e(Provider, { foo: 42}, e(B, {}))
                        )
                    )
                );
            }
        })

        const wrapper = mount(e(A));
        t.equal(wrapper.find("span").text(), "context:bar1337");
        t.equal(wrapper.find("section").text(), "context:421337");
        t.end();
    })

    test('store should be available', t => {
        var C = observer(["foo"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo);
            }
        }));

        var B = React.createClass({
            render: function() {
                return e(C, {});
            }
        });

        var A = React.createClass({
            render: function() {
                return e(Provider, { baz: 42 }, e(B, {}));
            }
        })

        t.throws(() => mount(e(A)), /Store 'foo' is not available! Make sure it is provided by some Provider/);
        t.end();
    })

    test('store is not required if prop is available', t => {
        var C = observer(["foo"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo);
            }
        }));

        var B = React.createClass({
            render: function() {
                return e(C, { foo: "bar" });
            }
        });

        const wrapper = mount(e(B));
        t.equal(wrapper.find("div").text(), "context:bar");
        t.end();
    })

    test('warning is printed when changing stores', t => {
        var msg;
        var baseWarn = console.warn;
        console.warn = (m) => msg = m;

        var a = mobx.observable(3);

        var C = observer(["foo"], React.createClass({
            render: function() {
                return e("div", {}, "context:" + this.props.foo);
            }
        }));

        var B = observer(React.createClass({
            render: function() {
                return e(C, {});
            }
        }));

        var A = observer(React.createClass({
            render: function() {
                return e("section", {},
                    e("span", {}, a.get()),
                    e(Provider, { foo: a.get() }, e(B, {}))
                );
            }
        }))

        const wrapper = mount(e(A));
        t.equal(wrapper.find("span").text(), "3");
        t.equal(wrapper.find("div").text(), "context:3");

        a.set(42);

        t.equal(wrapper.find("span").text(), "42");
        t.equal(wrapper.find("div").text(), "context:3");

        t.equal(msg, "MobX Provider: Provided store \'foo\' has changed. Please avoid replacing stores as the change might not propagate to all children");

        console.warn = baseWarn;
        t.end();
    })



    t.end()
})