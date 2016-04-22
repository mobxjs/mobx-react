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
    var willReactCount = 0;
	mobx.autorun(function() {
		asText = [foo.a.get(), foo.b.get(), foo.c.get()].join(":");
	});
		
	var Test = mobxReact.observer(React.createClass({
        componentWillReact: function() {
            willReactCount++;
        },
		render: function() {
			return (React.createElement("div", { id: 'x' }, [foo.a.get(), foo.b.get(), foo.c.get()].join(",")));
		}
	}));
	
	// In 3 seconds, flip a and b. This will change c.
	setTimeout(flipStuff, 200);

	setTimeout(function() {
		test.equal(asText, "false:true:true");
		test.equal(document.getElementById('x').innerHTML, "false,true,true");
        test.equal(willReactCount, 1);
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
	
	ReactDOM.render(React.createElement(component, {}), document.getElementById('testroot'));
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
		ReactDOM.render(React.createElement(component, {}), document.getElementById('testroot'));
		a.set(4);
		loaded.set(true);
	});

	setTimeout(function() {
		t.equal(document.body.textContent.replace(/\s+/g,""), "4");
		t.deepEqual(valuesSeen, [3, 4]);
		t.end();
	}, 400);	
});
