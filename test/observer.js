var test = require('tape');
var mobx = require('mobx');
var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMServer = require('react-dom/server')
var TestUtils = require('react-addons-test-utils');
var mobxReact = require('../');
var observer = mobxReact.observer;
var inject = mobxReact.inject;
var $ = require('jquery');

$("<div></div>").attr("id","testroot").appendTo($(window.document.body));
var testRoot = document.getElementById("testroot");

var e = React.createElement;

var store = mobx.observable({
    todos: [{
        title: "a",
        completed: false
    }]
});

var todoItemRenderings = 0;
var todoItem = observer(function TodoItem(props) {
    todoItemRenderings++;
    return e("li", {}, "|" + props.todo.title);
});

var todoListRenderings = 0;
var todoListWillReactCount = 0;
var todoList = observer(React.createClass({
    renderings: 0,
    componentWillReact : function() {
        todoListWillReactCount++;
    },
    render: function() {
        todoListRenderings++;
        var todos = store.todos;
        return e("div", {},
            e("h1", null, todos.length),
            todos.map(function(todo, idx) {
                return e(todoItem, {
                    key: idx,
                    todo: todo
                });
            })
        );
    }
}));

var app = React.createClass({
    render: function() {
        return e(todoList);
    }
});

function getDNode(obj, prop) {
    return obj.$mobx.values[prop];
}

test('nestedRendering', function(test) {
	ReactDOM.render(e(app), testRoot, function() {
    	test.equal(todoListRenderings, 1, "should have rendered list once");
        test.equal(todoListWillReactCount, 0, "should not have reacted yet")
		test.equal($("li").length, 1);
        test.equal($("li").text(), "|a");

        test.equal(todoItemRenderings, 1, "item1 should render once");

        test.equal(getDNode(store, "todos").observers.length, 1);
        test.equal(getDNode(store.todos[0], "title").observers.length, 1);

        store.todos[0].title += "a";
        setTimeout(function() {

            test.equal(todoListRenderings, 1, "should have rendered list once");
            test.equal(todoListWillReactCount, 0, "should not have reacted")
            test.equal(todoItemRenderings, 2, "item1 should have rendered twice");
            test.equal(getDNode(store, "todos").observers.length, 1, "observers count shouldn't change");
            test.equal(getDNode(store.todos[0], "title").observers.length, 1, "title observers should not have increased");

            store.todos.push({
                title: "b",
                completed: true
            });

            setTimeout(function() {


                test.equal($("li").length, 2, "list should two items in in the list");
                test.equal($("li").text(), "|aa|b");

                test.equal(todoListRenderings, 2, "should have rendered list twice");
                test.equal(todoListWillReactCount, 1, "should have reacted")
                test.equal(todoItemRenderings, 3, "item2 should have rendered as well");
                test.equal(getDNode(store.todos[1], "title").observers.length, 1, "title observers should have increased");
                test.equal(getDNode(store.todos[1], "completed").observers.length, 0, "completed observers should not have increased");

                var oldTodo = store.todos.pop();

                setTimeout(function() {
                    test.equal(todoListRenderings, 3, "should have rendered list another time");
                    test.equal(todoListWillReactCount, 2, "should have reacted")

                    test.equal(todoItemRenderings, 3, "item1 should not have rerendered");
                    test.equal($("li").length, 1, "list should have only on item in list now");

                    test.equal(getDNode(oldTodo, "title").observers.length, 0, "title observers should have decreased");
                    test.equal(getDNode(oldTodo, "completed").observers.length, 0, "completed observers should not have decreased");

                    test.end();
                });
            }, 100);
        }, 100);
	});
});

test('keep views alive', function(test) {
    var yCalcCount = 0;
    var data = mobx.observable({
        x: 3,
        y: function() {
            yCalcCount++;
            return this.x * 2;
        },
        z: "hi"
    });

    var component = observer(function testComponent() {
        return React.createElement("div", {}, data.z + data.y);
    });

    ReactDOM.render(e(component), testRoot, function() {

        test.equal(yCalcCount, 1);
        test.equal($(testRoot).text(), "hi6");

        data.z = "hello";
        // test: rerender should not need a recomputation of data.y because the subscription is kept alive

        setTimeout(function() {
            test.equal(yCalcCount, 1);

            test.equal($(testRoot).text(), "hello6");
            test.equal(yCalcCount, 1);

            test.equal(getDNode(data, "y").observers.length, 1);

            ReactDOM.render(e("div"), testRoot, function() {
                test.equal(getDNode(data, "y").observers.length, 0);
                test.end();
            });
        }, 100);
    });
});


test('does not views alive when using static rendering', function(test) {
    mobxReact.useStaticRendering(true);

    var renderCount = 0;
    var data = mobx.observable({
        z: "hi"
    });

    var component = observer(function testComponent() {
        renderCount++;
        return React.createElement("div", {}, data.z);
    });

    ReactDOM.render(e(component), testRoot, function() {

        test.equal(renderCount, 1);
        test.equal($(testRoot).text(), "hi");

        data.z = "hello";
        // no re-rendering on static rendering

        setTimeout(function() {
            test.equal(renderCount, 1);

            test.equal($(testRoot).text(), "hi");
            test.equal(renderCount, 1);

            test.equal(getDNode(data, "z").observers.length, 0);

            mobxReact.useStaticRendering(false);
            test.end();
        }, 100);
    });
});

test('does not views alive when using static + string rendering', function(test) {
    mobxReact.useStaticRendering(true);

    var renderCount = 0;
    var data = mobx.observable({
        z: "hi"
    });

    var component = observer(function testComponent() {
        renderCount++;
        return React.createElement("div", {}, data.z);
    });

    const output = ReactDOMServer.renderToStaticMarkup(e(component))

    data.z = "hello";

    setTimeout(function() {
        test.equal(output, "<div>hi</div>")
        test.equal(renderCount, 1);

        test.equal(getDNode(data, "z").observers.length, 0);

        mobxReact.useStaticRendering(false);
        test.end();
    }, 100);
});


// From typescript compiler:
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

test('issue 12', function(t) {
    var data = mobx.observable({
        selected: "coffee",
        items: [{
            name: "coffee"
        }, {
            name: "tea"
        }]
    });

    /** Row Class */
    var _super = React.Component;
    var Row  = function() {
        _super.apply(this, arguments);
    }
    __extends(Row, _super);
    Row.prototype.render = function() {
        return e("div", {}, this.props.item.name + (data.selected === this.props.item.name ? "!" : ""));
    };

    /** table stateles component */
    var table = observer(function table() {
        return e("div", {}, data.items.map(function(item) {
            return e(Row, { key: item.name, item: item})
        }));
    })

    ReactDOM.render(e(table), testRoot, function() {
        t.equal($(testRoot).text(), "coffee!tea");

        mobx.transaction(function() {
            data.items[1].name = "boe";
            data.items.splice(0, 2, { name : "soup" });
            data.selected = "tea";
        });

        setTimeout(function() {
            t.equal($(testRoot).text(), "soup");
            t.end();
        }, 50);
    });
});

test("changing state in render should fail", function(t) {
    var data = mobx.observable(2);
    var comp = observer(function() {
        data(3);
        return e("div", {}, data());
    });


    t.throws(function() {
        ReactDOM.render(e(comp), testRoot);
    }, "It is not allowed to change the state during a view");

    mobx._.resetGlobalState();
    t.end();
});

test("component should not be inject", function(t) {
    var msg = [];
    var baseWarn = console.warn;
    console.warn = function(m) { msg.push(m); }

    observer(inject("foo")(React.createClass({
        render: function() {
            return e("div", {}, "context:" + this.props.foo);
        }
    })));

    t.equal(msg.length, 1);
    console.warn = baseWarn;
    t.end();
});

test("124 - react to changes in this.props via computed", function(t) {
    var c = observer(React.createClass({
        componentWillMount: function() {
            mobx.extendObservable(this, {
                get computedProp() {
                    return this.props.x
                }
            })
        },
        render: function() {
            return e("span", {}, "x:" + this.computedProp)
        }
    }))

    var parent = React.createClass({
        getInitialState() {
            return { v: 1 }
        },
        render: function() {
            return e(
                "div",
                { onClick: function() {
                    this.setState({ v: 2 })
                }.bind(this)},
                e(c, { x: this.state.v })
            )
        }
    })

    ReactDOM.render(e(parent), testRoot, function() {
        t.equal($("span").text(), "x:1")
        $("div").click()
        setTimeout(function() {
            t.equal($("span").text(), "x:2")
            t.end()
        }, 100)
    })
})

