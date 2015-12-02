var mobservable = require("mobservable");
var tape = require("tape");
var mobservableReact = require("../");
var ReactDOM = require("react-dom");
var React = require("react");

tape.test("issue 50", function(test) {
	
	var foo = {
		a: mobservable.observable(true),
		b: mobservable.observable(false),
		c: mobservable.observable(function() { 
			console.log("evaluate c");
			return foo.b(); 
		})
	};
	
	function flipStuff() {
		console.log("flipping");
		mobservable.extras.trackTransitions(true, function(line) {
			//lines.forEach(function(line) {
				console.log(line.state, line.name);
			//});
		});

		mobservable.transaction(function() {
			foo.a(!foo.a());
			foo.b(!foo.b());
			console.log("transaction pre-end");
		});
		console.log("transaction post-end");
	}
	
	var asText = "";
	mobservable.autorun(function() {
		asText = [foo.a(), foo.b(), foo.c()].join(":");
	});
		
	var Test = mobservableReact.observer(React.createClass({
		render: function() {
			console.log("rendering");
			return (React.createElement("div", { id: 'x' }, [foo.a(), foo.b(), foo.c()].join(",")));
		}
	}));
	
	// In 3 seconds, flip a and b. This will change c.
	setTimeout(flipStuff, 200);

	setTimeout(function() {
		test.equal(asText, "false:true:true");
		test.equal(document.getElementById('x').innerHTML, "false,true,true");
		test.end();
	}, 400);
	
	ReactDOM.render(React.createElement(Test), document.body);
});