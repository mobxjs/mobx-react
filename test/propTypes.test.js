import React from "react"
import * as ReactPropTypes from "prop-types"
import { PropTypes } from "../src"
import { observable } from "mobx"

// Cause `checkPropTypes` caches errors and doesn't print them twice....
// https://github.com/facebook/prop-types/issues/91
let testComponentId = 0

function typeCheckFail(declaration, value, message) {
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
    expect(error).toBe("Warning: Failed prop type: " + message)
    console.error = baseError
}

function typeCheckFailRequiredValues(declaration) {
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
    expect(specifiedButIsNullMsg.test(error)).toBeTruthy()

    error = ""
    const props2 = { testProp: undefined }
    ReactPropTypes.checkPropTypes(
        propTypes,
        props2,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(unspecifiedMsg.test(error)).toBeTruthy()

    error = ""
    const props3 = {}
    ReactPropTypes.checkPropTypes(
        propTypes,
        props3,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(unspecifiedMsg.test(error)).toBeTruthy()

    console.error = baseError
}

function typeCheckPass(declaration, value) {
    const props = { testProp: value }
    const error = ReactPropTypes.checkPropTypes(
        { testProp: declaration },
        props,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(error).toBeUndefined()
}

test("Valid values", () => {
    typeCheckPass(PropTypes.observableArray, observable([]))
    typeCheckPass(PropTypes.observableArrayOf(ReactPropTypes.string), observable([""]))
    typeCheckPass(PropTypes.arrayOrObservableArray, observable([]))
    typeCheckPass(PropTypes.arrayOrObservableArray, [])
    typeCheckPass(PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), observable([""]))
    typeCheckPass(PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), [""])
    typeCheckPass(PropTypes.observableObject, observable({}))
    typeCheckPass(PropTypes.objectOrObservableObject, {})
    typeCheckPass(PropTypes.objectOrObservableObject, observable({}))
    typeCheckPass(PropTypes.observableMap, observable(observable.map({}, { deep: false })))
})

test("should be implicitly optional and not warn", () => {
    typeCheckPass(PropTypes.observableArray, undefined)
    typeCheckPass(PropTypes.observableArrayOf(ReactPropTypes.string), undefined)
    typeCheckPass(PropTypes.arrayOrObservableArray, undefined)
    typeCheckPass(PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string), undefined)
    typeCheckPass(PropTypes.observableObject, undefined)
    typeCheckPass(PropTypes.objectOrObservableObject, undefined)
    typeCheckPass(PropTypes.observableMap, undefined)
})

test("should warn for missing required values, function (test)", () => {
    typeCheckFailRequiredValues(PropTypes.observableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        PropTypes.observableArrayOf(ReactPropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(PropTypes.arrayOrObservableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(PropTypes.observableObject.isRequired, undefined)
    typeCheckFailRequiredValues(PropTypes.objectOrObservableObject.isRequired, undefined)
    typeCheckFailRequiredValues(PropTypes.observableMap.isRequired, undefined)
})

test("should fail date and regexp correctly", () => {
    typeCheckFail(
        PropTypes.observableObject,
        new Date(),
        "Invalid prop `testProp` of type `date` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        PropTypes.observableArray,
        /please/,
        "Invalid prop `testProp` of type `regexp` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
})

test("observableArray", () => {
    typeCheckFail(
        PropTypes.observableArray,
        [],
        "Invalid prop `testProp` of type `array` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        PropTypes.observableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
})

test("arrayOrObservableArray", () => {
    typeCheckFail(
        PropTypes.arrayOrObservableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
})

test("observableObject", () => {
    typeCheckFail(
        PropTypes.observableObject,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        PropTypes.observableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
})

test("objectOrObservableObject", () => {
    typeCheckFail(
        PropTypes.objectOrObservableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject` or javascript `object`."
    )
})

test("observableMap", () => {
    typeCheckFail(
        PropTypes.observableMap,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableMap`."
    )
})

test("observableArrayOf", () => {
    typeCheckFail(
        PropTypes.observableArrayOf(ReactPropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        PropTypes.observableArrayOf(ReactPropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        PropTypes.observableArrayOf({ foo: PropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
})

test("arrayOrObservableArrayOf", () => {
    typeCheckFail(
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
    typeCheckFail(
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        PropTypes.arrayOrObservableArrayOf(ReactPropTypes.string),
        [2],
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        PropTypes.arrayOrObservableArrayOf({ foo: PropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
})
