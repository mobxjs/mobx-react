var test = require('tape');
var mobx = require('mobx');
var React = require('react/addons');
var ReactDOM = require('react-dom');
var TestUtils = React.addons.TestUtils;
var observer = require('../').observer;
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
			debugger;
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
				t.equal(topRenderCount, 3);
				t.end();
			}, 100);
		}, 100);		
	});
});