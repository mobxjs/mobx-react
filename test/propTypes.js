var test = require('tape');
var React = require('react');
var PropTypes = require('../').propTypes;
var mobx = require('mobx');
var observable = mobx.observable;
var asMap = mobx.asMap;

function typeCheckFail(test, declaration, value, message) {
  var props = {testProp: value};
  var error = declaration(
    props,
    'testProp',
    'testComponent',
    'prop',
    null
  );
  test.equal(error instanceof Error, true);
  test.equal(error.message, message);
}

function typeCheckFailRequiredValues(test, declaration) {
  var specifiedButIsNullMsg = 'The prop `testProp` is marked as required in ' +
    '`testComponent`, but its value is `null`.';
  var unspecifiedMsg = 'The prop `testProp` is marked as required in ' +
    '`testComponent`, but its value is \`undefined\`.';
  var props1 = {testProp: null};
  var error1 = declaration(
    props1,
    'testProp',
    'testComponent',
    'prop',
    null
  );
  test.equal(error1 instanceof Error, true);
  test.equal(error1.message, specifiedButIsNullMsg);
  var props2 = {testProp: undefined};
  var error2 = declaration(
    props2,
    'testProp',
    'testComponent',
    'prop',
    null
  );
  test.equal(error2 instanceof Error, true);
  test.equal(error2.message, unspecifiedMsg);
  var props3 = {};
  var error3 = declaration(
    props3,
    'testProp',
    'testComponent',
    'prop',
    null
  );
  test.equal(error3 instanceof Error, true);
  test.equal(error3.message, unspecifiedMsg);
}

function typeCheckPass(test, declaration, value) {
  var props = {testProp: value};
  var error = declaration(
    props,
    'testProp',
    'testComponent',
    'prop',
    null
  );
  test.equal(error, null);
}


test('Valid values', function (test) {
  typeCheckPass(test, PropTypes.observableArray, observable([]));
  typeCheckPass(test, PropTypes.observableArrayOf(React.PropTypes.string), observable([""]));
  typeCheckPass(test, PropTypes.arrayOrObservableArray, observable([]));
  typeCheckPass(test, PropTypes.arrayOrObservableArray, []);
  typeCheckPass(test, PropTypes.arrayOrObservableArrayOf(React.PropTypes.string), observable([""]));
  typeCheckPass(test, PropTypes.arrayOrObservableArrayOf(React.PropTypes.string), [""]);
  typeCheckPass(test, PropTypes.observableObject, observable({}));
  typeCheckPass(test, PropTypes.objectOrObservableObject, {});
  typeCheckPass(test, PropTypes.objectOrObservableObject, observable({}));
  typeCheckPass(test, PropTypes.observableMap, observable(asMap({})));
  test.end();
});

test('should be implicitly optional and not warn', function (test) {
  typeCheckPass(test, PropTypes.observableArray, undefined);
  typeCheckPass(test, PropTypes.observableArrayOf(React.PropTypes.string), undefined);
  typeCheckPass(test, PropTypes.arrayOrObservableArray, undefined);
  typeCheckPass(test, PropTypes.arrayOrObservableArrayOf(React.PropTypes.string), undefined);
  typeCheckPass(test, PropTypes.observableObject, undefined);
  typeCheckPass(test, PropTypes.objectOrObservableObject, undefined);
  typeCheckPass(test, PropTypes.observableMap, undefined);
  test.end()
});

test('should warn for missing required values, function (test)', function(test) {
  typeCheckFailRequiredValues(test, PropTypes.observableArray.isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.observableArrayOf(React.PropTypes.string).isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.arrayOrObservableArray.isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.arrayOrObservableArrayOf(React.PropTypes.string).isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.observableObject.isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.objectOrObservableObject.isRequired, undefined);
  typeCheckFailRequiredValues(test, PropTypes.observableMap.isRequired, undefined);
  test.end()
});

test('should fail date and regexp correctly', function (test) {
  typeCheckFail(
    test,
    PropTypes.observableObject,
    new Date(),
    'Invalid prop `testProp` of type `date` supplied to ' +
    '`testComponent`, expected `mobx.ObservableObject`.'
  );
  typeCheckFail(
    test,
    PropTypes.observableArray,
    /please/,
    'Invalid prop `testProp` of type `regexp` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray`.'
  );
  test.end()
});

test('observableArray', function (test) {
  typeCheckFail(
    test,
    PropTypes.observableArray,
    [],
    'Invalid prop `testProp` of type `array` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray`.'
  );
  typeCheckFail(
    test,
    PropTypes.observableArray,
    "",
    'Invalid prop `testProp` of type `string` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray`.'
  );
  test.end();
});

test('arrayOrObservableArray', function (test) {
  typeCheckFail(
    test,
    PropTypes.arrayOrObservableArray,
    "",
    'Invalid prop `testProp` of type `string` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray` or javascript `array`.'
  );
  test.end();
});

test('observableObject', function (test) {
  typeCheckFail(
    test,
    PropTypes.observableObject,
    {},
    'Invalid prop `testProp` of type `object` supplied to ' +
    '`testComponent`, expected `mobx.ObservableObject`.'
  );
  typeCheckFail(
    test,
    PropTypes.observableObject,
    '',
    'Invalid prop `testProp` of type `string` supplied to ' +
    '`testComponent`, expected `mobx.ObservableObject`.'
  );
  test.end();
});

test('objectOrObservableObject', function (test) {
  typeCheckFail(
    test,
    PropTypes.objectOrObservableObject,
    "",
    'Invalid prop `testProp` of type `string` supplied to ' +
    '`testComponent`, expected `mobx.ObservableObject` or javascript `object`.'
  );
  test.end();
});

test('observableMap', function (test) {
  typeCheckFail(
    test,
    PropTypes.observableMap,
    {},
    'Invalid prop `testProp` of type `object` supplied to ' +
    '`testComponent`, expected `mobx.ObservableMap`.'
  );
  test.end();
});

test('observableArrayOf', function (test) {
  typeCheckFail(
    test,
    PropTypes.observableArrayOf(React.PropTypes.string),
    2,
    'Invalid prop `testProp` of type `number` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray`.'
  );
  typeCheckFail(
    test,
    PropTypes.observableArrayOf(React.PropTypes.string),
    observable([2]),
    'Invalid prop `testProp[0]` of type `number` supplied to ' +
    '`testComponent`, expected `string`.'
  );
  typeCheckFail(
    test,
    PropTypes.observableArrayOf({ foo: PropTypes.string }),
    { foo: 'bar' },
    'Property `testProp` of component `testComponent` has invalid PropType notation.'
  );
  test.end();
});

test('arrayOrObservableArrayOf', function (test) {
  typeCheckFail(
    test,
    PropTypes.arrayOrObservableArrayOf(React.PropTypes.string),
    2,
    'Invalid prop `testProp` of type `number` supplied to ' +
    '`testComponent`, expected `mobx.ObservableArray` or javascript `array`.'
  );
  typeCheckFail(
    test,
    PropTypes.arrayOrObservableArrayOf(React.PropTypes.string),
    observable([2]),
    'Invalid prop `testProp[0]` of type `number` supplied to ' +
    '`testComponent`, expected `string`.'
  );
  typeCheckFail(
    test,
    PropTypes.arrayOrObservableArrayOf(React.PropTypes.string),
    [2],
    'Invalid prop `testProp[0]` of type `number` supplied to ' +
    '`testComponent`, expected `string`.'
  );
  typeCheckFail(
    test,
    PropTypes.arrayOrObservableArrayOf({ foo: PropTypes.string }),
    { foo: 'bar' },
    'Property `testProp` of component `testComponent` has invalid PropType notation.'
  );
  test.end();
});
