/*
Unlike promised, even with shallow rendering we need the dom sometime in React 0.13...
*/
var jsdom = require("jsdom");

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;
global.navigator = window.navigator;

var mobservable = require('mobservable');
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var reactiveComponent = require('mobservable-react').reactiveComponent;

var e = React.createElement;

var store = mobservable.makeReactive({
    todos: [{
        title: "a",
        completed: false
    }]
});

var todoItemRenderings = 0;
var todoItem = reactiveComponent(React.createClass({
    render: function() {
        todoItemRenderings++;
        return e("li", {}, this.props.todo.title);
    }
}));

var todoListRenderings = 0;
var todoList = reactiveComponent(React.createClass({
    renderings: 0,
    render: function() {
        todoListRenderings++;
        var todos = this.props.store;
        return e("div", {},
            e("h1", null, todos.todos.length),
            todos.todos.map(function(todo, idx) {
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

function shallow(component, props) {
    var renderer = TestUtils.createRenderer();
    renderer.render(e(component, props));
    return renderer;
}

exports.testNestedRendering = function(test) {
    var list$ = shallow(todoList, { store: store });
    var listResult = list$.getRenderOutput();
    
    test.equal(todoListRenderings, 1, "should have rendered list once");
    console.log(JSON.stringify(listResult, null, 2));
    test.equal(listResult.props.children.length, 2, "list should have two children");
    test.equal(listResult.props.children[0].props.children, "1", "should have correct title");
    test.equal(listResult.props.children[1].length, 1, "list should on item in the list");
    
    var item1$ = shallow(todoItem, listResult.props.children[1][0].props);
    item1$.getRenderOutput();
    test.equal(todoItemRenderings, 1, "item1 should render once");
    test.equal(mobservable._.getDNode(store, "todos").observers.length, 1, "observer count on store is not increased");
    test.equal(mobservable._.getDNode(store.todos[0], "title").observers.length, 1, "title observers should have increased");

    store.todos[0].title += "a";
    test.equal(todoListRenderings, 1, "should have rendered list once");
    test.equal(todoItemRenderings, 2, "item1 should have rendered twice");
    test.equal(mobservable._.getDNode(store, "todos").observers.length, 1, "observers count shouldn't change");
    test.equal(mobservable._.getDNode(store.todos[0], "title").observers.length, 1, "title observers should not have increased");
    
    store.todos.push({
        title: "b",
        completed: true
    });

    listResult = list$.getRenderOutput();
    test.equal(listResult.props.children[1].length, 2, "list should two items in in the list");
    
    var item2$ = shallow(todoItem, listResult.props.children[1][1].props);
    item2$.getRenderOutput();
    
    test.equal(todoListRenderings, 2, "should have rendered list twice");
    test.equal(todoItemRenderings, 3, "item2 should have rendered as well"); 
    test.equal(mobservable._.getDNode(store.todos[1], "title").observers.length, 1, "title observers should have increased");
    test.equal(mobservable._.getDNode(store.todos[1], "completed").observers.length, 0, "completed observers should not have increased");
    
    var oldTodo = store.todos.pop();
    listResult = list$.getRenderOutput();
    test.equal(todoListRenderings, 3, "should have rendered list another time");
    test.equal(todoItemRenderings, 3, "item1 should not have rerendered"); 
    test.equal(listResult.props.children[1].length, 1, "list should have only on item in list now");
    
    item2$.unmount(); // that's what react does normally for us..
    test.equal(mobservable._.getDNode(oldTodo, "title").observers.length, 0, "title observers should have decreased");
    test.equal(mobservable._.getDNode(oldTodo, "completed").observers.length, 0, "completed observers should not have decreased");
    
    test.done();
}
