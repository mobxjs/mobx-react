import PropTypes from "prop-types"
import { PropTypes as MRPropTypes } from "../src"
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
    PropTypes.checkPropTypes(propTypes, props, "prop", compId, null)

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
    PropTypes.checkPropTypes(
        propTypes,
        props1,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(specifiedButIsNullMsg.test(error)).toBeTruthy()

    error = ""
    const props2 = { testProp: undefined }
    PropTypes.checkPropTypes(
        propTypes,
        props2,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(unspecifiedMsg.test(error)).toBeTruthy()

    error = ""
    const props3 = {}
    PropTypes.checkPropTypes(
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
    const error = PropTypes.checkPropTypes(
        { testProp: declaration },
        props,
        "testProp",
        "testComponent" + ++testComponentId,
        null
    )
    expect(error).toBeUndefined()
}

test("Valid values", () => {
    typeCheckPass(MRPropTypes.observableArray, observable([]))
    typeCheckPass(MRPropTypes.observableArrayOf(PropTypes.string), observable([""]))
    typeCheckPass(MRPropTypes.arrayOrObservableArray, observable([]))
    typeCheckPass(MRPropTypes.arrayOrObservableArray, [])
    typeCheckPass(MRPropTypes.arrayOrObservableArrayOf(PropTypes.string), observable([""]))
    typeCheckPass(MRPropTypes.arrayOrObservableArrayOf(PropTypes.string), [""])
    typeCheckPass(MRPropTypes.observableObject, observable({}))
    typeCheckPass(MRPropTypes.objectOrObservableObject, {})
    typeCheckPass(MRPropTypes.objectOrObservableObject, observable({}))
    typeCheckPass(MRPropTypes.observableMap, observable(observable.map({}, { deep: false })))
})

test("should be implicitly optional and not warn", () => {
    typeCheckPass(MRPropTypes.observableArray, undefined)
    typeCheckPass(MRPropTypes.observableArrayOf(PropTypes.string), undefined)
    typeCheckPass(MRPropTypes.arrayOrObservableArray, undefined)
    typeCheckPass(MRPropTypes.arrayOrObservableArrayOf(PropTypes.string), undefined)
    typeCheckPass(MRPropTypes.observableObject, undefined)
    typeCheckPass(MRPropTypes.objectOrObservableObject, undefined)
    typeCheckPass(MRPropTypes.observableMap, undefined)
})

test("should warn for missing required values, function (test)", () => {
    typeCheckFailRequiredValues(MRPropTypes.observableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        MRPropTypes.observableArrayOf(PropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(MRPropTypes.arrayOrObservableArray.isRequired, undefined)
    typeCheckFailRequiredValues(
        MRPropTypes.arrayOrObservableArrayOf(PropTypes.string).isRequired,
        undefined
    )
    typeCheckFailRequiredValues(MRPropTypes.observableObject.isRequired, undefined)
    typeCheckFailRequiredValues(MRPropTypes.objectOrObservableObject.isRequired, undefined)
    typeCheckFailRequiredValues(MRPropTypes.observableMap.isRequired, undefined)
})

test("should fail date and regexp correctly", () => {
    typeCheckFail(
        MRPropTypes.observableObject,
        new Date(),
        "Invalid prop `testProp` of type `date` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        MRPropTypes.observableArray,
        /please/,
        "Invalid prop `testProp` of type `regexp` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
})

test("observableArray", () => {
    typeCheckFail(
        MRPropTypes.observableArray,
        [],
        "Invalid prop `testProp` of type `array` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        MRPropTypes.observableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
})

test("arrayOrObservableArray", () => {
    typeCheckFail(
        MRPropTypes.arrayOrObservableArray,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
})

test("observableObject", () => {
    typeCheckFail(
        MRPropTypes.observableObject,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
    typeCheckFail(
        MRPropTypes.observableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject`."
    )
})

test("objectOrObservableObject", () => {
    typeCheckFail(
        MRPropTypes.objectOrObservableObject,
        "",
        "Invalid prop `testProp` of type `string` supplied to " +
            "`testComponent`, expected `mobx.ObservableObject` or javascript `object`."
    )
})

test("observableMap", () => {
    typeCheckFail(
        MRPropTypes.observableMap,
        {},
        "Invalid prop `testProp` of type `object` supplied to " +
            "`testComponent`, expected `mobx.ObservableMap`."
    )
})

test("observableArrayOf", () => {
    typeCheckFail(
        MRPropTypes.observableArrayOf(PropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray`."
    )
    typeCheckFail(
        MRPropTypes.observableArrayOf(PropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        MRPropTypes.observableArrayOf({ foo: MRPropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
})

test("arrayOrObservableArrayOf", () => {
    typeCheckFail(
        MRPropTypes.arrayOrObservableArrayOf(PropTypes.string),
        2,
        "Invalid prop `testProp` of type `number` supplied to " +
            "`testComponent`, expected `mobx.ObservableArray` or javascript `array`."
    )
    typeCheckFail(
        MRPropTypes.arrayOrObservableArrayOf(PropTypes.string),
        observable([2]),
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        MRPropTypes.arrayOrObservableArrayOf(PropTypes.string),
        [2],
        "Invalid prop `testProp[0]` of type `number` supplied to " +
            "`testComponent`, expected `string`."
    )
    typeCheckFail(
        MRPropTypes.arrayOrObservableArrayOf({ foo: MRPropTypes.string }),
        { foo: "bar" },
        "Property `testProp` of component `testComponent` has invalid PropType notation."
    )
})
