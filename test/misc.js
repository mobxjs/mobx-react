var React = require('react');
var enzyme = require('enzyme');
var mount = enzyme.mount;
var mobx = require('mobx');
var observer = require('../').observer;
var Provider = require('../').Provider;
var test = require('tape');
var e = React.createElement;

test('custom shouldComponentUpdate is not respected for observable changes (#50)', t => {
    var called = 0;
    var x = mobx.observable(3)
    var C = observer(React.createClass({
        render: function() {
            return e("div", {}, "value:" + x.get());
        },
        shouldComponentUpdate() {
            called++;
        }
    }));

    const wrapper = mount(e(C));
    t.equal(wrapper.find("div").text(), "value:3");
    t.equal(called, 0)
    x.set(42);
    t.equal(wrapper.find("div").text(), "value:42");
    t.equal(called, 0)

    t.end();
})

test('custom shouldComponentUpdate is not respected for observable changes (#50)', t => {
    var called = 0;
    var y = mobx.observable(5)
    
    var C = observer(React.createClass({
        render: function() {
            return e("div", {}, "value:" + this.props.y);
        },
        shouldComponentUpdate(nextProps) {
            called++;
            return nextProps.y !== 42;
        }
    }));

    var B = observer(React.createClass({
        render: function() {
            return e("span", {}, e(C, {y: y.get()}));
        },
        shouldComponentUpdate() {
            called++;
        }
    }));


    const wrapper = mount(e(B));
    t.equal(wrapper.find("div").text(), "value:5");
    t.equal(called, 0)

    y.set(6);
    t.equal(wrapper.find("div").text(), "value:6");
    t.equal(called, 1)

    y.set(42)
    t.equal(wrapper.find("div").text(), "value:6"); // not updated!
    t.equal(called, 2)

    y.set(7)
    t.equal(wrapper.find("div").text(), "value:7");
    t.equal(called, 3)

    t.end();
})
