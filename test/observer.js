var test = require('tape');
var mobservable = require('mobservable');
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var observer = require('../').observer;
var $ = require('jquery');

var e = React.createElement;

var store = mobservable.observable({
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
var todoList = observer(React.createClass({
    renderings: 0,
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

test('nestedRendering', function(test) {
	React.render(e(app), window.document.body, function() {
    	test.equal(todoListRenderings, 1, "should have rendered list once");
		test.equal($("li").length, 1);
        test.equal($("li").text(), "|a");

        test.equal(todoItemRenderings, 1, "item1 should render once");
        
        test.equal(mobservable.extras.getDNode(store, "todos").observers.length, 1);
        test.equal(mobservable.extras.getDNode(store.todos[0], "title").observers.length, 1);
        
        store.todos[0].title += "a";
        setTimeout(function() {
        
            test.equal(todoListRenderings, 1, "should have rendered list once");
            test.equal(todoItemRenderings, 2, "item1 should have rendered twice");
            test.equal(mobservable.extras.getDNode(store, "todos").observers.length, 1, "observers count shouldn't change");
            test.equal(mobservable.extras.getDNode(store.todos[0], "title").observers.length, 1, "title observers should not have increased");
        
            store.todos.push({
                title: "b",
                completed: true
            });
        
            setTimeout(function() {
                
                
                test.equal($("li").length, 2, "list should two items in in the list");
                test.equal($("li").text(), "|aa|b");
            
                test.equal(todoListRenderings, 2, "should have rendered list twice");
                test.equal(todoItemRenderings, 3, "item2 should have rendered as well");
                test.equal(mobservable.extras.getDNode(store.todos[1], "title").observers.length, 1, "title observers should have increased");
                test.equal(mobservable.extras.getDNode(store.todos[1], "completed").observers.length, 0, "completed observers should not have increased");

                var oldTodo = store.todos.pop();

                setTimeout(function() {
                    test.equal(todoListRenderings, 3, "should have rendered list another time");
                    test.equal(todoItemRenderings, 3, "item1 should not have rerendered");
                    test.equal($("li").length, 1, "list should have only on item in list now");
                
                    test.equal(mobservable.extras.getDNode(oldTodo, "title").observers.length, 0, "title observers should have decreased");
                    test.equal(mobservable.extras.getDNode(oldTodo, "completed").observers.length, 0, "completed observers should not have decreased");
                
                    test.end();
                });
            }, 100);
        }, 100);
	});
});

test('keep views alive', function(test) {
    var yCalcCount = 0;
    var data = mobservable.observable({
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

    React.render(e(component), document.body, function() {
    
        test.equal(yCalcCount, 1);
        test.equal($("div").text(), "hi6");
    
        data.z = "hello";
        // test: rerender should not need a recomputation of data.y because the subscription is kept alive
        
        setTimeout(function() {
            test.equal(yCalcCount, 1);
        
            test.equal($("div").text(), "hello6");
            test.equal(yCalcCount, 1);
        
            test.equal(mobservable.extras.getDNode(data, "y").observers.length, 1);
            
            React.render(e("div"), document.body, function() {
                test.equal(mobservable.extras.getDNode(data, "y").observers.length, 0);
                test.end();
            });
        }, 100);
    });
});