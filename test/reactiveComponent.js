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
var observer = require('mobservable-react').observer;

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
    return e("li", {}, props.todo.title);
});

var todoListRenderings = 0;
var todoList = observer(React.createClass({
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
    test.equal(listResult.props.children.length, 2, "list should have two children");
    test.equal(listResult.props.children[0].props.children, "1", "should have correct title");
    test.equal(listResult.props.children[1].length, 1, "list should on item in the list");
    
    var item1$ = shallow(todoItem, listResult.props.children[1][0].props);
    item1$.getRenderOutput();
    test.equal(todoItemRenderings, 1, "item1 should render once");
    test.equal(mobservable.extras.getDNode(store, "todos").observers.length, 1, "observer count on store is not increased");
    test.equal(mobservable.extras.getDNode(store.todos[0], "title").observers.length, 1, "title observers should have increased");

    store.todos[0].title += "a";
    test.equal(todoListRenderings, 1, "should have rendered list once");
    test.equal(todoItemRenderings, 2, "item1 should have rendered twice");
    test.equal(mobservable.extras.getDNode(store, "todos").observers.length, 1, "observers count shouldn't change");
    test.equal(mobservable.extras.getDNode(store.todos[0], "title").observers.length, 1, "title observers should not have increased");
    
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
    test.equal(mobservable.extras.getDNode(store.todos[1], "title").observers.length, 1, "title observers should have increased");
    test.equal(mobservable.extras.getDNode(store.todos[1], "completed").observers.length, 0, "completed observers should not have increased");
    
    var oldTodo = store.todos.pop();
    listResult = list$.getRenderOutput();
    test.equal(todoListRenderings, 3, "should have rendered list another time");
    test.equal(todoItemRenderings, 3, "item1 should not have rerendered"); 
    test.equal(listResult.props.children[1].length, 1, "list should have only on item in list now");
    
    item2$.unmount(); // that's what react does normally for us..
    test.equal(mobservable.extras.getDNode(oldTodo, "title").observers.length, 0, "title observers should have decreased");
    test.equal(mobservable.extras.getDNode(oldTodo, "completed").observers.length, 0, "completed observers should not have decreased");
    
    test.done();
}

exports.testIsComponentReactive = function(test) {
    var component = observer({ render: function() {}});
    test.equal(component.isMobservableReactObserver, true);
    test.equal(mobservable.isObservable(component), false); // dependencies not known yet
    test.equal(mobservable.isObservable(component.render), false); // dependencies not known yet
    
    component.componentWillMount();
    component.render();
    test.equal(mobservable.isObservable(component.render), true); // dependencies not known yet
    test.equal(mobservable.isObservable(component), false);

    mobservable.extendReactive(component, {});
    test.equal(mobservable.isObservable(component), true);

    test.done();
}

exports.testGetDNode = function(test) {
    var getD = mobservable.extras.getDNode;

    var c = observer({ render: function() {}});
    c.componentWillMount();
    c.render();
    test.ok(getD(c.render));

    test.done();
}

exports.testKeepViewsAlive = function(test) {
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
    
    var c$ = shallow(component, { });

    var cResult = c$.getRenderOutput();
    test.equal(yCalcCount, 1);
    test.equal(cResult.props.children, "hi6");
    
    data.z = "hello";
    // test: rerender should not need a recomputation of data.y because the subscription is kept alive
    
    test.equal(yCalcCount, 1);

    cResult = c$.getRenderOutput();
    test.equal(cResult.props.children, "hello6");
    test.equal(yCalcCount, 1);
    
    test.equal(mobservable.extras.getDNode(data, "y").observers.length, 1);
    c$.unmount();
    test.equal(mobservable.extras.getDNode(data, "y").observers.length, 0);

    test.done();
}