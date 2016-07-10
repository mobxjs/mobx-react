var test = require('tape');
var mobx = require('mobx');
var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-addons-test-utils');
var observer = require('../').observer;
var propTypes = require('../').propTypes;

var $ = require('jquery');

var e = React.createElement;


var stateLessComp = function (props) {
	return e("div", {}, "result: " + props.testProp);
}
stateLessComp.propTypes = {
	testProp: React.PropTypes.string
}
stateLessComp.defaultProps = {
	testProp: 'default value for prop testProp'
}

test('stateless component with propTypes', function (test) {
	var statelessCompObserver = observer(stateLessComp);
	test.equal(statelessCompObserver.getDefaultProps().testProp, 'default value for prop testProp', "default property value should be propagated");
	var originalConsoleError = console.error
	var beenWarned = false
	console.error = function () {
		beenWarned = true;
	}
	React.createElement(statelessCompObserver, { testProp: 10 })
	console.error = originalConsoleError;
	test.equal(beenWarned, true, "an error should be logged with a property type warning")

	ReactDOM.render(e(statelessCompObserver, { testProp: "hello world" }), document.getElementById('testroot'), function () {
		test.equal($("#testroot").text(), "result: hello world");
		test.end();
	});
});

test('stateless component with context support', function (test) {
	var stateLessCompWithContext = function (props, context) { return e("div", {}, "context: " + context.testContext); }
	stateLessCompWithContext.contextTypes = { testContext: React.PropTypes.string }
	var stateLessCompWithContextObserver = observer(stateLessCompWithContext);

	var ContextProvider =  React.createClass({
		childContextTypes: stateLessCompWithContext.contextTypes,
		getChildContext:   function() { return { testContext: 'hello world' }; },
		render:            function() { return e(stateLessCompWithContextObserver); }
	});

	ReactDOM.render(e(ContextProvider), document.getElementById('testroot'), function () {
		test.equal($("#testroot").text(), "context: hello world");
		test.end();
	});
});

test('component with observable propTypes', function (t) {
    var component = React.createClass({
        render: function() {
            return null;
        },
        propTypes: {
            a1: propTypes.observableArray,
            a2: propTypes.arrayOrObservableArray
        }
    })
	var originalConsoleError = console.error
	var warnings = [];
	console.error = function (msg) {
		warnings.push(msg);
	};
	React.createElement(component, {
        a1: [],
        a2: []
    })
	t.equal(warnings.length, 1)
    t.equal(/Failed propType: Invalid prop `a1`/.test(warnings[0]), true)

	React.createElement(component, {
        a1: mobx.observable([]),
        a2: mobx.observable([])
    })
	t.equal(warnings.length, 1)

	console.error = originalConsoleError;

    t.end();
});