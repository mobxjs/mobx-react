var test = require('tape');
var mobx = require('mobx');
var observer = require('../').observer;

// TODO:
test.skip('testIsComponentReactive', function(test) {
    var component = observer({ render: function() {}});
    test.equal(component.isMobXReactObserver, true);
    test.equal(mobx.isObservable(component), false); // dependencies not known yet
    test.equal(mobx.isObservable(component.render), false); // dependencies not known yet

    component.componentWillMount();
    component.render();
    test.equal(mobx.isObservable(component.render), true); // dependencies not known yet
    test.equal(mobx.isObservable(component), false);

    mobx.extendObservable(component, {});
    test.equal(mobx.isObservable(component), true);

    test.end();
});

// TODO:
test.skip('testGetDNode', function(test) {
    var getD = mobx.extras.getDNode;

    var c = observer({ render: function() {}});
    c.componentWillMount();
    c.render();
    test.ok(c.$mobx);

    test.end();
});
