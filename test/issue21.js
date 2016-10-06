var React = require('react');
var ReactDOM = require('react-dom');
var observer = require('../').observer;
var test = require('tape');
var mobx = require('mobx');
// var TestUtils = require('react-addons-test-utils');
var $ = require('jquery');
var _ = require('lodash');

$("<div></div>").attr("id","testroot").appendTo($(window.document.body));
var testRoot = document.getElementById("testroot");

var e = React.createElement;

var wizardModel = mobx.observable({
	steps: [
		{
			title: 'Size',
			active: true
		},
		{
			title: 'Fabric',
			active: false
		},
		{
			title: 'Finish',
			active: false
		}
	],
	activeStep: function () {
		return _.find(this.steps, 'active');
	},
	activateNextStep: mobx.asReference(function () {
		var nextStep = this.steps[_.findIndex(this.steps, 'active') + 1];
		if(!nextStep) {
			return false;
		}
		this.setActiveStep(nextStep);
	}),
	setActiveStep: function (modeToActivate) {
		var self = this;
		mobx.transaction(function () {
			_.find(self.steps, 'active').active = false;
			modeToActivate.active = true;
		});
	}
});

/** RENDERS **/
var Wizard = observer(React.createClass({
	displayName: 'Wizard',
	render: function () {
		return React.DOM.div(null,
			React.createElement('div', null,
				React.createElement('h1', null, 'Active Step: '),
				React.createElement(WizardStep, {step: this.props.model.activeStep, key: 'activeMode', tester: true})
			),
			React.createElement('div', null,
				React.createElement('h1', null, 'All Step: '),
                React.createElement('p',null,'Clicking on these steps will render the active step just once.  This is what I expected.'),
			    React.createElement(WizardSteps, {steps: this.props.model.steps, key: 'modeList'})
			)
		);
	}
}));

var WizardSteps = observer(React.createClass({
	displayName: 'WizardSteps',
	componentWillMount: function () {
		this.renderCount = 0;
	},
	render: function () {
		var steps = _.map(this.props.steps, function (step) {
			return React.DOM.div({key: step.title},
				React.createElement(WizardStep, {step: step, key: step.title})
			);
		});
		return React.DOM.div(null, steps);
	}
}));

var WizardStep = observer(React.createClass({
	displayName: 'WizardStep',
	componentWillMount: function () {
		this.renderCount = 0;
	},
	componentWillUnmount: function () {
		console.log('Unmounting!');
	},
	render: function () {
		// weird test hack:
		if (this.props.tester === true) {
			topRenderCount++;
		}
		return React.DOM.div({onClick: this.modeClickHandler},
			'RenderCount: ' + (this.renderCount++) + ' ' + this.props.step.title + ': isActive:' + this.props.step.active);
	},
	modeClickHandler: function () {
		var step = this.props.step;
		wizardModel.setActiveStep(step);
	}
}));
/** END RENDERERS **/

var topRenderCount = 0;

var changeStep = function (stepNumber) {
	wizardModel.setActiveStep(wizardModel.steps[stepNumber]);

};

test('verify issue 21', function(t) {
	ReactDOM.render(React.createElement(Wizard, {model: wizardModel}),testRoot, function() {
		t.equal(topRenderCount, 1);
		changeStep(0);

		setTimeout(function() {
			t.equal(topRenderCount, 2);
			changeStep(2);
			setTimeout(function() {
				t.ok(topRenderCount, 3)
				t.end();
			}, 100);
		}, 100);
	});
});

test('verify prop changes are picked up', function(t) {
    function createItem(subid, label) {
        const res = mobx.observable({
            id: 1,
            label: label,
            get text() {
                events.push(["compute", this.subid])
                return this.id + "." + this.subid + "." + this.label + "." + data.items.indexOf(this)
            }
        })
        res.subid = subid // non reactive
        return res
    }

    var data = mobx.observable({
        items: [createItem(1, "hi")]
    })
    var events = []

    var Child = observer(React.createClass({
        componentWillReceiveProps: function (nextProps) {
            events.push(["receive", this.props.item.subid, nextProps.item.subid])
        },

        componentWillUpdate: function (nextProps) {
            events.push(["update", this.props.item.subid, nextProps.item.subid])
        },

        componentWillReact: function() {
            events.push(["react", this.props.item.subid])
        },

        render: function() {
            events.push(["render", this.props.item.subid, this.props.item.text])
            return React.createElement("span", {}, this.props.item.text)
        }
    }))

    var Parent = observer(React.createClass({
        render: function() {
            return React.createElement("div", {
                onClick: changeStuff.bind(this), // event is needed to get batching!
                id: "testDiv"
            }, data.items.map(function(item) {
                return React.createElement(Child, {
                    key: "fixed",
                    item: item
                })
            }))
        }
    }))

    var Wrapper = React.createClass({ render: function() {
        return React.createElement(Parent, {})
    }})

    function changeStuff() {
        mobx.transaction(function() {
            data.items[0].label = "hello" // schedules state change for Child
            data.items[0] = createItem(2, "test") // Child should still receive new prop!
        })
        this.setState({}) // trigger update
    }

    ReactDOM.render(React.createElement(Wrapper, {}), testRoot, function() {
        t.deepEqual(events, [
            ["compute", 1],
            ["render", 1, "1.1.hi.0"],
        ])
        events.splice(0)
        $("#testDiv").click()

        setTimeout(function() {
            t.deepEqual(events, [
                [ 'compute', 1 ],
                [ 'react', 1 ],
                [ 'receive', 1, 2 ],
                [ 'update', 1, 2 ],
                [ 'compute', 2 ],
                [ 'render', 2, '1.2.test.0' ]
            ])
            t.end()
        }, 100)
    })
})


test('verify props is reactive', function(t) {
    function createItem(subid, label) {
        const res = mobx.observable({
            id: 1,
            label: label,
            get text() {
                events.push(["compute", this.subid])
                return this.id + "." + this.subid + "." + this.label + "." + data.items.indexOf(this)
            }
        })
        res.subid = subid // non reactive
        return res
    }

    var data = mobx.observable({
        items: [createItem(1, "hi")]
    })
    var events = []

    var Child = observer(React.createClass({
        componentWillMount() {
            events.push(["mount"])
            mobx.extendObservable(this, {
                computedLabel: function() {
                    events.push(["computed label", this.props.item.subid])
                    return this.props.item.label
                }
            })
        },

        componentWillReceiveProps: function (nextProps) {
            events.push(["receive", this.props.item.subid, nextProps.item.subid])
        },

        componentWillUpdate: function (nextProps) {
            events.push(["update", this.props.item.subid, nextProps.item.subid])
        },

        componentWillReact: function() {
            events.push(["react", this.props.item.subid])
        },

        render: function() {
            events.push(["render", this.props.item.subid, this.props.item.text, this.computedLabel])
            return React.createElement("span", {}, this.props.item.text + this.computedLabel)
        }
    }))

    var Parent = observer(React.createClass({
        render: function() {
            return React.createElement("div", {
                onClick: changeStuff.bind(this), // event is needed to get batching!
                id: "testDiv"
            }, data.items.map(function(item) {
                return React.createElement(Child, {
                    key: "fixed",
                    item: item
                })
            }))
        }
    }))

    var Wrapper = React.createClass({ render: function() {
        return React.createElement(Parent, {})
    }})

    function changeStuff() {
        mobx.transaction(function() {
            // components start rendeirng a new item, but computed is still based on old value
            data.items = [createItem(2, "test")]
        })
    }

    ReactDOM.render(React.createElement(Wrapper, {}), testRoot, function() {
        t.deepEqual(events, [
            ["mount"],
            ["compute", 1],
            ["computed label", 1],
            ["render", 1, "1.1.hi.0", "hi"],
        ])
        events.splice(0)
        $("#testDiv").click()

        setTimeout(function() {
            t.deepEqual(events, [
                [ 'compute', 1 ],
                [ 'react', 1 ],
                [ 'receive', 1, 2 ],
                [ 'update', 1, 2 ],
                [ 'compute', 2 ],
                [ "computed label", 2],
                [ 'render', 2, '1.2.test.0', "test" ]
            ])
            t.end()
        }, 100)
    })
})


test('no re-render for shallow equal props', function(t) {
    function createItem(subid, label) {
        const res = mobx.observable({
            id: 1,
            label: label,
        })
        res.subid = subid // non reactive
        return res
    }

    var data = mobx.observable({
        items: [createItem(1, "hi")],
        parentValue: 0
    })
    var events = []

    var Child = observer(React.createClass({
        componentWillMount() {
            events.push(["mount"])
        },

        componentWillReceiveProps: function (nextProps) {
            events.push(["receive", this.props.item.subid, nextProps.item.subid])
        },

        componentWillUpdate: function (nextProps) {
            events.push(["update", this.props.item.subid, nextProps.item.subid])
        },

        componentWillReact: function() {
            events.push(["react", this.props.item.subid])
        },

        render: function() {
            events.push(["render", this.props.item.subid, this.props.item.label])
            return React.createElement("span", {}, this.props.item.label)
        }
    }))

    var Parent = observer(React.createClass({
        render: function() {
            t.equal(mobx.isObservable(this.props.nonObservable), false, "object has become observable!")
            events.push(["parent render", data.parentValue])
            return React.createElement("div", {
                onClick: changeStuff.bind(this), // event is needed to get batching!
                id: "testDiv"
            }, data.items.map(function(item) {
                return React.createElement(Child, {
                    key: "fixed",
                    item: item,
                    value: 5
                })
            }))
        }
    }))

    var Wrapper = React.createClass({ render: function() {
        return React.createElement(Parent, { nonObservable: {} })
    }})

    function changeStuff() {
        data.items[0].label = "hi" // no change
        data.parentValue = 1 // rerender parent
    }

    ReactDOM.render(React.createElement(Wrapper, {}), testRoot, function() {
        t.deepEqual(events, [
            ["parent render", 0],
            ["mount"],
            ["render", 1, "hi"],
        ])
        events.splice(0)
        $("#testDiv").click()

        setTimeout(function() {
            t.deepEqual(events, [
                ["parent render", 1],
                [ 'receive', 1, 1 ],
            ])
            t.end()
        }, 100)
    })
})