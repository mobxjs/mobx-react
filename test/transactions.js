var mobx = require("mobx");
var tape = require("tape");
var mobxReact = require("../");
var ReactDOM = require("react-dom");
var React = require("react");

tape.test("mobx issue 50", function(test) {
	
	var foo = {
		a: mobx.observable(true),
		b: mobx.observable(false),
		c: mobx.observable(function() { 
			console.log("evaluate c");
			return foo.b.get(); 
		})
	};
	
	function flipStuff() {
		mobx.transaction(function() {
			foo.a.set(!foo.a.get());
			foo.b.set(!foo.b.get());
		});
	}
	
	var asText = "";
	mobx.autorun(function() {
		asText = [foo.a.get(), foo.b.get(), foo.c.get()].join(":");
	});
		
	var Test = mobxReact.observer(React.createClass({
		render: function() {
			return (React.createElement("div", { id: 'x' }, [foo.a.get(), foo.b.get(), foo.c.get()].join(",")));
		}
	}));
	
	// In 3 seconds, flip a and b. This will change c.
	setTimeout(flipStuff, 200);

	setTimeout(function() {
		test.equal(asText, "false:true:true");
		test.equal(document.getElementById('x').innerHTML, "false,true,true");
		test.end();
	}, 400);
	
	ReactDOM.render(React.createElement(Test), document.getElementById('testroot'));
});

tape.test("React.render should respect transaction", function(t) {
	var a = mobx.observable(2);
	var loaded = mobx.observable(false);
	var valuesSeen = [];

	var component = mobxReact.observer(function() {
		valuesSeen.push(a.get());
		if (loaded.get())
			return React.createElement("div", {}, a.get());
		else
			return React.createElement("div", {}, "loading");
	});
	
	React.render(React.createElement(component, {}), document.getElementById('testroot'));
	mobx.transaction(function() {
		a.set(3);
		a.set(4);
		loaded.set(true);
	});

	setTimeout(function() {
		t.equal(document.body.textContent.replace(/\s+/g,""), "4");
		t.deepEqual(valuesSeen, [2, 4]);
		t.end();
	}, 400);	
});

tape.test("React.render in transaction should succeed", function(t) {
	var a = mobx.observable(2);
	var loaded = mobx.observable(false);
	var valuesSeen = [];
	var component = mobxReact.observer(function() {
		valuesSeen.push(a.get());
		if (loaded.get())
			return React.createElement("div", {}, a.get());
		else
			return React.createElement("div", {}, "loading");
	});
	
	mobx.transaction(function() {
		a.set(3);
		React.render(React.createElement(component, {}), document.getElementById('testroot'));
		a.set(4);
		loaded.set(true);
	});

	setTimeout(function() {
		t.equal(document.body.textContent.replace(/\s+/g,""), "4");
		t.deepEqual(valuesSeen, [3, 4]);
		t.end();
	}, 400);	
});

tape.test("Should warn about changing state in getInitialState", function(t) {
	var a = mobx.observable(2);
	
	var child = mobxReact.observer(React.createClass({
		displayName: "Child",
		getInitialState: function() {
			a.set(3); // one shouldn't do this!
			return {};
		},
		render: function() {
			return React.createElement("div", {}, a.get());
		}
	}));
	
	var parent = mobxReact.observer(function Parent() {
		return React.createElement("div", {}, 
			React.createElement(child, {}),
			a.get()
		);
	});
	
	var baseError = console.error;
	var msg = [];
	console.error = function(x) {
		msg.push(x);
		baseError.apply(console, arguments);
	};
	
	React.render(React.createElement(parent, {}), document.getElementById('testroot'), function() {
		console.error = baseError;
		t.deepEqual(msg, [
			"[mobx-react] Warning: A re-render was triggered before the component '<component>#.b.render()', was mounted. Is (another) component trying to modify state in it's constructor / getInitialState? Use componentWillMount instead.",
			"Warning: forceUpdate(...): Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."			
		]);
		t.end();
	});
});