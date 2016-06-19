var React = require('react');
var enzyme = require('enzyme');
var mount = enzyme.mount;
var mobx = require('mobx');
var observer = require('../').observer;
var Provider = require('../').Provider;
var test = require('tape');
var e = React.createElement;

test('basic context', t => {
    debugger;

    var C = observer(["foo"], React.createClass({
        render: function() {
            return e("div", {}, "context:" + this.stores.foo);
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
