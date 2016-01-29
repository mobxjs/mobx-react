var test = require('tape');
var mobservable = require('mobservable');
var React = require('react/addons');
var ReactDOM = require('react-dom');
var TestUtils = React.addons.TestUtils;
var observer = require('../').observer;
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
