import { createClass, PropTypes, createElement } from 'react'
import ReactDOM from 'react-dom'
import test from 'tape'
import mobx from 'mobx'
import { observer, propTypes } from '../'
import $ from 'jquery'


const stateLessComp = function (props) {
  return createElement('div', {}, 'result: ' + props.testProp);
}
stateLessComp.propTypes = {
  testProp: PropTypes.string
}
stateLessComp.defaultProps = {
  testProp: 'default value for prop testProp'
}

test('stateless component with propTypes', t => {
  const statelessCompObserver = observer(stateLessComp);
  t.equal(statelessCompObserver.getDefaultProps().testProp, 'default value for prop testProp', 'default property value should be propagated');
  const originalConsoleError = console.error
  let beenWarned = false
  console.error =  () => beenWarned = true;
  createElement(statelessCompObserver, { testProp: 10 })
  console.error = originalConsoleError;
  t.equal(beenWarned, true, 'an error should be logged with a property type warning')

  ReactDOM.render(
    createElement(statelessCompObserver, { testProp: 'hello world' }),
    document.getElementById('testroot'),
    function () {
      t.equal($('#testroot').text(), 'result: hello world');
      t.end();
    }
    );
});

test('stateless component with context support', t => {
  const stateLessCompWithContext = (props, context) => createElement('div', {}, 'context: ' + context.testContext);
  stateLessCompWithContext.contextTypes = { testContext: PropTypes.string };
  const stateLessCompWithContextObserver = observer(stateLessCompWithContext);
  var ContextProvider =  createClass({
    childContextTypes: stateLessCompWithContext.contextTypes,
    getChildContext: () => ({ testContext: 'hello world' }),
    render: () => createElement(stateLessCompWithContextObserver)
  })
  ReactDOM.render(createElement(ContextProvider), document.getElementById('testroot'), () => {
    t.equal($('#testroot').text(), 'context: hello world');
    t.end();
  });
});

test('component with observable propTypes', t => {
  const component = createClass({
    render: () => null,
    propTypes: {
      a1: propTypes.observableArray,
      a2: propTypes.arrayOrObservableArray
    }
  })
  var originalConsoleError = console.error
  var warnings = [];
  console.error = msg => warnings.push(msg)
  createElement(component, {
    a1: [],
    a2: []
  })
  t.equal(warnings.length, 1)

  createElement(component, {
    a1: mobx.observable([]),
    a2: mobx.observable([])
  })
  t.equal(warnings.length, 1)

  console.error = originalConsoleError;
  t.end();
});
