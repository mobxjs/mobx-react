import React from "react"
import * as ReactPropTypes from "prop-types"
import { PropTypes } from "../"
import test from "tape"
import { observable, asMap } from "mobx"

// Cause `checkPropTypes` caches errors and doesn't print them twice....
// https://github.com/facebook/prop-types/issues/91
let testComponentId = 0

function typeCheckFail(test, declaration, value, message) {
    const baseError = console.error
    let error = ""
    console.error = msg => {
        error = msg
    }

    const props = { testProp: value }
    const propTypes = { testProp: declaration }

    const compId = "testComponent" + ++testComponentId
    ReactPropTypes.checkPropTypes(propTypes, props, "prop", compId, null)

    error = error.replace(compId, "testComponent")
    test.equal(error, "Warning: Failed prop type: " + message)
    console.error = baseError
}

function typeCheckFailRequiredValues(test, declaration) {
    const baseError = console.error
    let error = ""
    console.error = msg => {
        error = msg
    }

    const propTypes = { testProp: declaration }
    const specifiedButIsNullMsg = /but its value is `null`\./
    const unspecifiedMsg = /but its value is `undefined`\./

    const props1 = { testProp: null }
    ReactPropTypes.checkPropTypes(
        propTypes,
        props1,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    test.ok(specifiedButIsNullMsg.test(error))

    error = ""
    const props2 = { testProp: undefined }
    ReactPropTypes.checkPropTypes(
        propTypes,
        props2,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    test.ok(unspecifiedMsg.test(error))

    error = ""
    const props3 = {}
    ReactPropTypes.checkPropTypes(
        propTypes,
        props3,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    test.ok(unspecifiedMsg.test(error))

    console.error = baseError
}

function typeCheckPass(test, declaration, value) {
    const props = { testProp: value }
    const error = ReactPropTypes.checkPropTypes(
        { testProp: declaration },
        props,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    test.equal(error, undefined)
}

test("Valid values", t => {
    typeCheckPass(t, PropTypes.observableArray, observable([]))
    typeCheckPass(t, PropTypes.observableArrayOf(ReactPropTypes.string), observable([""]))
    typeCheckPass(t, PropTypes.arrayOrObservableArray, observable([]))
    typeCheckPass(t, PropTypes.arrayOrObservableArray, [])
    typeCheckPass(t, PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), observable([""]))
    typeCheckPass(t, PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), [""])
    typeCheckPass(t, PropTypes.observableObject, observable({}))
    typeCheckPass(t, PropTypes.objectOrObservableObject, {})
    typeCheckPass(t, PropTypes.objectOrObservableObject, observable({}))
    typeCheckPass(t, PropTypes.observableMap, observable(asMap({})))
    t.end()
})

test("should be implicitly optional and not warn", t => {
    typeCheckPass(t, PropTypes.observableArray, undefined)
    typeCheckPass(t, PropTypes.observableArrayOf(ReactPropTypes.string), undefined)
    typeCheckPass(t, PropTypes.arrayOrObservableArray, undefined)
    typeCheckPass(t, PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), undefined)
    typeCheckPass(t, PropTypes.observableObject, undefined)
    typeCheckPass(t, PropTypes.objectOrObservableObject, undefined)
    typeCheckPass(t, PropTypes.observableMap, undefined)
    t.end()
})

test("should warn for missing required values, function (test)", t => {
    typeCheckFailRequiredValues(t, PropTypes.observableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        t,
        PropTypes.observableArrayOf(ReactPropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(t, PropTypes.arrayOrObservableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        t,
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(t, PropTypes.observableObject.isRequired, undefined)
    typeCheckFailRequiredValues(t, PropTypes.objectOrObservableObject.isRequired, undefined)
    typeCheckFailRequiredValues(t, PropTypes.observableMap.isRequired, undefined)
    t.end()
})

test("should fail date and regexp correctly", t => {
    typeCheckFail(
        t,
        PropTypes.observableObject,
        new Date(),
        "Invalid prop `testProp` of type `date` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        t,
        PropTypes.observableArray,
        /please/,
        "Invalid prop `testProp` of type `regexp` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    t.end()
})

test("observableArray", t => {
    typeCheckFail(
        t,
        PropTypes.observableArray,
        [],
        "Invalid prop `testProp` of type `array` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        t,
        PropTypes.observableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    t.end()
})

test("arrayOrObservableArray", t => {
    typeCheckFail(
        t,
        PropTypes.arrayOrObservableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
    t.end()
})

test("observableObject", t => {
    typeCheckFail(
        t,
        PropTypes.observableObject,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        t,
        PropTypes.observableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    t.end()
})

test("objectOrObservableObject", t => {
    typeCheckFail(
        t,
        PropTypes.objectOrObservableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject` or javascript `object`."
    )
    t.end()
})

test("observableMap", t => {
    typeCheckFail(
        t,
        PropTypes.observableMap,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableMap`."
    )
    t.end()
})

test("observableArrayOf", t => {
    typeCheckFail(
        t,
        PropTypes.observableArrayOf(ReactPropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        t,
        PropTypes.observableArrayOf(ReactPropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        t,
        PropTypes.observableArrayOf({ foo: PropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
    t.end()
})

test("arrayOrObservableArrayOf", t => {
    typeCheckFail(
        t,
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
    typeCheckFail(
        t,
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        t,
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        [2],
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        t,
        PropTypes.arrayOrObservableArrayOf({ foo: PropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
    t.end()
})
