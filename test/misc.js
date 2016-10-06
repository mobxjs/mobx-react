"use strict"

var React = require('react');
var ReactDOM = require('react-dom')
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

test('custom shouldComponentUpdate is not respected for observable changes (#50) - 2', t => {
    var called = 0;
    var y = mobx.observable(5)

    var C = observer(React.createClass({
        render: function() {
            return e("div", {}, "value:" + this.props.y);
        },
        shouldComponentUpdate(nextProps) {
            called++;
            return false;
            // return nextProps.y !== 42;
        }
    }));

    var B = observer(React.createClass({
        render: function() {
            return e("span", {}, e(C, {y: y.get()}));
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

test("issue mobx 405", t => {
    function ExampleState() {
        mobx.extendObservable(this, {
            name: "test",
            greetings: function() {
                return 'Hello my name is ' + this.name;
            }
        })
    }

    const ExampleView = observer(React.createClass({
        render: function() {
            return e("div", {},
                e("input", {
                    type: "text",
                    value: this.props.exampleState.name,
                    onChange: e => this.props.exampleState.name = e.target.value
                }),
                e("span", {}, this.props.exampleState.greetings)
            );
        }
    }))

    let exampleState = new ExampleState();
    const wrapper = enzyme.shallow(e(ExampleView, { exampleState: exampleState}));
    t.equal(wrapper.find('span').text(), "Hello my name is test")

    t.end()
})

test("#85 Should handle state changing in constructors", function(t) {
	var a = mobx.observable(2);

	var child = observer(React.createClass({
		displayName: "Child",
		getInitialState: function() {
			a.set(3); // one shouldn't do this!
			return {};
		},
		render: function() {
			return React.createElement("div", {}, "child:", a.get(), " - ");
		}
	}));

	var parent = observer(function Parent() {
		return React.createElement("span", {},
			React.createElement(child, {}),
            "parent:",
			a.get()
		);
	});

	ReactDOM.render(React.createElement(parent, {}), document.getElementById('testroot'), function() {
		t.equal(document.getElementsByTagName("span")[0].textContent, "child:3 - parent:3")
        a.set(5)
		t.equal(document.getElementsByTagName("span")[0].textContent, "child:5 - parent:5")
        a.set(7)
		t.equal(document.getElementsByTagName("span")[0].textContent, "child:7 - parent:7")

		t.end();
	});
  });
