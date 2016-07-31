!function(root, factory) {
    "object" == typeof exports && "object" == typeof module ? module.exports = factory(require("mobx"), require("react"), require("react-dom")) : "function" == typeof define && define.amd ? define([ "mobx", "react", "react-dom" ], factory) : "object" == typeof exports ? exports.mobxReact = factory(require("mobx"), require("react"), require("react-dom")) : root.mobxReact = factory(root.mobx, root.React, root.ReactDOM);
}(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__) {
    return function(modules) {
        function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) return installedModules[moduleId].exports;
            var module = installedModules[moduleId] = {
                exports: {},
                id: moduleId,
                loaded: !1
            };
            return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
            module.loaded = !0, module.exports;
        }
        var installedModules = {};
        return __webpack_require__.m = modules, __webpack_require__.c = installedModules, 
        __webpack_require__.p = "", __webpack_require__(0);
    }([ function(module, exports, __webpack_require__) {
        "use strict";
        function _interopRequireWildcard(obj) {
            if (obj && obj.__esModule) return obj;
            var newObj = {};
            if (null != obj) for (var key in obj) Object.prototype.hasOwnProperty.call(obj, key) && (newObj[key] = obj[key]);
            return newObj["default"] = obj, newObj;
        }
        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                "default": obj
            };
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.reactiveComponent = exports.propTypes = exports.inject = exports.Provider = exports.trackComponents = exports.componentByNodeRegistery = exports.renderReporter = exports.observer = void 0;
        var _arguments = arguments, _observerHOC = __webpack_require__(1);
        Object.defineProperty(exports, "observer", {
            enumerable: !0,
            get: function() {
                return _observerHOC.observer;
            }
        }), Object.defineProperty(exports, "renderReporter", {
            enumerable: !0,
            get: function() {
                return _observerHOC.renderReporter;
            }
        }), Object.defineProperty(exports, "componentByNodeRegistery", {
            enumerable: !0,
            get: function() {
                return _observerHOC.componentByNodeRegistery;
            }
        }), Object.defineProperty(exports, "trackComponents", {
            enumerable: !0,
            get: function() {
                return _observerHOC.trackComponents;
            }
        });
        var _Provider = __webpack_require__(7);
        Object.defineProperty(exports, "Provider", {
            enumerable: !0,
            get: function() {
                return _interopRequireDefault(_Provider)["default"];
            }
        });
        var _inject = __webpack_require__(6);
        Object.defineProperty(exports, "inject", {
            enumerable: !0,
            get: function() {
                return _interopRequireDefault(_inject)["default"];
            }
        });
        var TARGET_LIB_NAME, _mobx = __webpack_require__(2), _mobx2 = _interopRequireDefault(_mobx), _react = __webpack_require__(3), _react2 = _interopRequireDefault(_react), _propTypes = __webpack_require__(8), propTypes = _interopRequireWildcard(_propTypes);
        if (TARGET_LIB_NAME = "mobx-react", !_mobx2["default"]) throw new Error(TARGET_LIB_NAME + " requires the MobX package");
        if (!_react2["default"]) throw new Error(TARGET_LIB_NAME + " requires React to be available");
        exports.propTypes = propTypes;
        exports.reactiveComponent = function() {
            return console.warn("[mobx-react] `reactiveComponent` has been renamed to `observer` and will be removed in 1.1."), 
            observer.apply(null, _arguments);
        };
    }, function(module, exports, __webpack_require__) {
        "use strict";
        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                "default": obj
            };
        }
        function findDOMNode(component) {
            return _reactDom2["default"] ? _reactDom2["default"].findDOMNode(component) : null;
        }
        function reportRendering(component) {
            var node = findDOMNode(component);
            node && componentByNodeRegistery && componentByNodeRegistery.set(node, component), 
            renderReporter.emit({
                event: "render",
                renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
                totalTime: Date.now() - component.__$mobRenderStart,
                component: component,
                node: node
            });
        }
        function trackComponents() {
            if ("undefined" == typeof WeakMap) throw new Error("[mobx-react] tracking components is not supported in this browser.");
            isDevtoolsEnabled || (isDevtoolsEnabled = !0);
        }
        function patch(target, funcName) {
            var base = target[funcName], mixinFunc = reactiveMixin[funcName];
            base ? target[funcName] = function() {
                base.apply(this, arguments), mixinFunc.apply(this, arguments);
            } : target[funcName] = mixinFunc;
        }
        function observer(arg1, arg2) {
            if ("string" == typeof arg1) throw new Error("Store names should be provided as array");
            if (Array.isArray(arg1)) return arg2 ? _inject2["default"].apply(null, arg1)(observer(arg2)) : function(componentClass) {
                return observer(arg1, componentClass);
            };
            var componentClass = arg1;
            if (!("function" != typeof componentClass || componentClass.prototype && componentClass.prototype.render || componentClass.isReactClass || _react2["default"].Component.isPrototypeOf(componentClass))) return observer(_react2["default"].createClass({
                displayName: componentClass.displayName || componentClass.name,
                propTypes: componentClass.propTypes,
                contextTypes: componentClass.contextTypes,
                getDefaultProps: function() {
                    return componentClass.defaultProps;
                },
                render: function() {
                    return componentClass.call(this, this.props, this.context);
                }
            }));
            if (!componentClass) throw new Error("Please pass a valid component to 'observer'");
            var target = componentClass.prototype || componentClass;
            return [ "componentWillMount", "componentWillUnmount", "componentDidMount", "componentDidUpdate" ].forEach(function(funcName) {
                patch(target, funcName);
            }), target.shouldComponentUpdate || (target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate), 
            componentClass.isMobXReactObserver = !0, componentClass;
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.renderReporter = exports.componentByNodeRegistery = void 0;
        var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
            return typeof obj;
        } : function(obj) {
            return obj && "function" == typeof Symbol && obj.constructor === Symbol ? "symbol" : typeof obj;
        };
        exports.trackComponents = trackComponents, exports.observer = observer;
        var _mobx = __webpack_require__(2), _mobx2 = _interopRequireDefault(_mobx), _react = __webpack_require__(3), _react2 = _interopRequireDefault(_react), _reactDom = __webpack_require__(4), _reactDom2 = _interopRequireDefault(_reactDom), _EventEmitter = __webpack_require__(5), _EventEmitter2 = _interopRequireDefault(_EventEmitter), _inject = __webpack_require__(6), _inject2 = _interopRequireDefault(_inject), isDevtoolsEnabled = !1, componentByNodeRegistery = exports.componentByNodeRegistery = "undefined" != typeof WeakMap ? new WeakMap() : void 0, renderReporter = exports.renderReporter = new _EventEmitter2["default"](), reactiveMixin = {
            componentWillMount: function() {
                var _this = this, initialName = this.displayName || this.name || this.constructor && (this.constructor.displayName || this.constructor.name) || "<component>", rootNodeID = this._reactInternalInstance && this._reactInternalInstance._rootNodeID, baseRender = this.render.bind(this), reaction = null, isRenderingPending = !1, initialRender = function() {
                    return reaction = new _mobx2["default"].Reaction(initialName + "#" + rootNodeID + ".render()", function() {
                        isRenderingPending || (isRenderingPending = !0, "function" == typeof _this.componentWillReact && _this.componentWillReact(), 
                        _this.__$mobxIsUnmounted !== !0 && _react2["default"].Component.prototype.forceUpdate.call(_this));
                    }), reactiveRender.$mobx = reaction, _this.render = reactiveRender, reactiveRender();
                }, reactiveRender = function() {
                    isRenderingPending = !1;
                    var rendering;
                    return reaction.track(function() {
                        isDevtoolsEnabled && (_this.__$mobRenderStart = Date.now()), rendering = _mobx2["default"].extras.allowStateChanges(!1, baseRender), 
                        isDevtoolsEnabled && (_this.__$mobRenderEnd = Date.now());
                    }), rendering;
                };
                this.render = initialRender;
            },
            componentWillUnmount: function() {
                if (this.render.$mobx && this.render.$mobx.dispose(), this.__$mobxIsUnmounted = !0, 
                isDevtoolsEnabled) {
                    var node = findDOMNode(this);
                    node && componentByNodeRegistery && componentByNodeRegistery["delete"](node), renderReporter.emit({
                        event: "destroy",
                        component: this,
                        node: node
                    });
                }
            },
            componentDidMount: function() {
                isDevtoolsEnabled && reportRendering(this);
            },
            componentDidUpdate: function() {
                isDevtoolsEnabled && reportRendering(this);
            },
            shouldComponentUpdate: function(nextProps, nextState) {
                if (this.render.$mobx && this.render.$mobx.isScheduled() === !0) return !1;
                if (this.state !== nextState) return !0;
                var key, keys = Object.keys(this.props);
                if (keys.length !== Object.keys(nextProps).length) return !0;
                for (var i = keys.length - 1; key = keys[i]; i--) {
                    var newValue = nextProps[key];
                    if (newValue !== this.props[key]) return !0;
                    if (newValue && "object" === ("undefined" == typeof newValue ? "undefined" : _typeof(newValue)) && !_mobx2["default"].isObservable(newValue)) return !0;
                }
                return !1;
            }
        };
    }, function(module, exports) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_2__;
    }, function(module, exports) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_3__;
    }, function(module, exports) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_4__;
    }, function(module, exports) {
        "use strict";
        function EventEmitter() {
            this.listeners = [];
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), EventEmitter.prototype.on = function(cb) {
            this.listeners.push(cb);
            var self = this;
            return function() {
                var idx = self.listeners.indexOf(cb);
                idx !== -1 && self.listeners.splice(idx, 1);
            };
        }, EventEmitter.prototype.emit = function(data) {
            this.listeners.forEach(function(fn) {
                fn(data);
            });
        }, exports["default"] = EventEmitter;
    }, function(module, exports, __webpack_require__) {
        "use strict";
        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                "default": obj
            };
        }
        function createStoreInjector(grabStoresFn, component) {
            var Injector = _react2["default"].createClass({
                displayName: "MobXStoreInjector",
                render: function() {
                    var newProps = {};
                    for (var key in this.props) newProps[key] = this.props[key];
                    return newProps = grabStoresFn(this.context.mobxStores || {}, newProps, this.context), 
                    _react2["default"].createElement(component, newProps);
                }
            });
            return Injector.contextTypes = {
                mobxStores: _react.PropTypes.object
            }, Injector.wrappedComponent = component, Injector;
        }
        function grabStoresByName(storeNames) {
            return function(baseStores, nextProps) {
                return storeNames.forEach(function(storeName) {
                    if (!(storeName in nextProps)) {
                        if (!(storeName in baseStores)) throw new Error("MobX observer: Store '" + storeName + "' is not available! Make sure it is provided by some Provider");
                        nextProps[storeName] = baseStores[storeName];
                    }
                }), nextProps;
            };
        }
        function inject() {
            var grabStoresFn;
            if ("function" == typeof arguments[0]) grabStoresFn = arguments[0]; else {
                for (var storesNames = [], i = 0; i < arguments.length; i++) storesNames[i] = arguments[i];
                grabStoresFn = grabStoresByName(storesNames);
            }
            return function(componentClass) {
                return createStoreInjector(grabStoresFn, componentClass);
            };
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports["default"] = inject;
        var _react = __webpack_require__(3), _react2 = _interopRequireDefault(_react);
    }, function(module, exports, __webpack_require__) {
        "use strict";
        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                "default": obj
            };
        }
        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
        }
        function _possibleConstructorReturn(self, call) {
            if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return !call || "object" != typeof call && "function" != typeof call ? self : call;
        }
        function _inherits(subClass, superClass) {
            if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass);
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        });
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, 
                    "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), 
                Constructor;
            };
        }(), _react = __webpack_require__(3), _react2 = _interopRequireDefault(_react), specialReactKeys = {
            children: !0,
            key: !0,
            ref: !0
        }, Provider = function(_Component) {
            function Provider() {
                return _classCallCheck(this, Provider), _possibleConstructorReturn(this, Object.getPrototypeOf(Provider).apply(this, arguments));
            }
            return _inherits(Provider, _Component), _createClass(Provider, [ {
                key: "render",
                value: function() {
                    return _react2["default"].Children.only(this.props.children);
                }
            }, {
                key: "getChildContext",
                value: function() {
                    var stores = {}, baseStores = this.context.mobxStores;
                    if (baseStores) for (var key in baseStores) stores[key] = baseStores[key];
                    for (var _key in this.props) specialReactKeys[_key] || (stores[_key] = this.props[_key]);
                    return {
                        mobxStores: stores
                    };
                }
            }, {
                key: "componentWillReceiveProps",
                value: function(nextProps) {
                    Object.keys(nextProps).length !== Object.keys(this.props).length && console.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children");
                    for (var key in nextProps) specialReactKeys[key] || this.props[key] === nextProps[key] || console.warn("MobX Provider: Provided store '" + key + "' has changed. Please avoid replacing stores as the change might not propagate to all children");
                }
            } ]), Provider;
        }(_react.Component);
        Provider.contextTypes = {
            mobxStores: _react.PropTypes.object
        }, Provider.childContextTypes = {
            mobxStores: _react.PropTypes.object.isRequired
        }, exports["default"] = Provider;
    }, function(module, exports, __webpack_require__) {
        "use strict";
        function createChainableTypeChecker(validate) {
            function checkType(isRequired, props, propName, componentName, location, propFullName) {
                if (componentName = componentName || ANONYMOUS, propFullName = propFullName || propName, 
                null == props[propName]) {
                    if (isRequired) {
                        var actual = null === props[propName] ? "null" : "undefined";
                        return new Error("The " + location + " `" + propFullName + "` is marked as required in `" + componentName + "`, but its value is `" + actual + "`.");
                    }
                    return null;
                }
                return validate(props, propName, componentName, location, propFullName);
            }
            var chainedCheckType = checkType.bind(null, !1);
            return chainedCheckType.isRequired = checkType.bind(null, !0), chainedCheckType;
        }
        function isSymbol(propType, propValue) {
            return "symbol" === propType || ("Symbol" === propValue["@@toStringTag"] || "function" == typeof Symbol && propValue instanceof Symbol);
        }
        function getPropType(propValue) {
            var propType = "undefined" == typeof propValue ? "undefined" : _typeof(propValue);
            return Array.isArray(propValue) ? "array" : propValue instanceof RegExp ? "object" : isSymbol(propType, propValue) ? "symbol" : propType;
        }
        function getPreciseType(propValue) {
            var propType = getPropType(propValue);
            if ("object" === propType) {
                if (propValue instanceof Date) return "date";
                if (propValue instanceof RegExp) return "regexp";
            }
            return propType;
        }
        function createObservableTypeCheckerCreator(allowNativeType, mobxType) {
            return createChainableTypeChecker(function(props, propName, componentName, location, propFullName) {
                if (allowNativeType && getPropType(props[propName]) === mobxType.toLowerCase()) return null;
                var mobxChecker = void 0;
                switch (mobxType) {
                  case "Array":
                    mobxChecker = _mobx.isObservableArray;
                    break;

                  case "Object":
                    mobxChecker = _mobx.isObservableObject;
                    break;

                  case "Map":
                    mobxChecker = _mobx.isObservableMap;
                    break;

                  default:
                    throw new Error("Unexpected mobxType: " + mobxType);
                }
                var propValue = props[propName];
                if (!mobxChecker(propValue)) {
                    var preciseType = getPreciseType(propValue), nativeTypeExpectationMessage = allowNativeType ? " or javascript `" + mobxType.toLowerCase() + "`" : "";
                    return new Error("Invalid prop `" + propFullName + "` of type `" + preciseType + "` supplied to `" + componentName + "`, expected `mobx.Observable" + mobxType + "`" + nativeTypeExpectationMessage + ".");
                }
                return null;
            });
        }
        function createObservableArrayOfTypeChecker(allowNativeType, typeChecker) {
            return createChainableTypeChecker(function(props, propName, componentName, location, propFullName) {
                if ("function" != typeof typeChecker) return new Error("Property `" + propFullName + "` of component `" + componentName + "` has invalid PropType notation.");
                var error = createObservableTypeCheckerCreator(allowNativeType, "Array")(props, propName, componentName);
                if (error instanceof Error) return error;
                for (var propValue = props[propName], i = 0; i < propValue.length; i++) if (error = typeChecker(propValue, i, componentName, location, propFullName + "[" + i + "]"), 
                error instanceof Error) return error;
                return null;
            });
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        }), exports.objectOrObservableObject = exports.arrayOrObservableArrayOf = exports.arrayOrObservableArray = exports.observableObject = exports.observableMap = exports.observableArrayOf = exports.observableArray = void 0;
        var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
            return typeof obj;
        } : function(obj) {
            return obj && "function" == typeof Symbol && obj.constructor === Symbol ? "symbol" : typeof obj;
        }, _mobx = __webpack_require__(2);
        exports.observableArray = createObservableTypeCheckerCreator(!1, "Array"), exports.observableArrayOf = createObservableArrayOfTypeChecker.bind(null, !1), 
        exports.observableMap = createObservableTypeCheckerCreator(!1, "Map"), exports.observableObject = createObservableTypeCheckerCreator(!1, "Object"), 
        exports.arrayOrObservableArray = createObservableTypeCheckerCreator(!0, "Array"), 
        exports.arrayOrObservableArrayOf = createObservableArrayOfTypeChecker.bind(null, !0), 
        exports.objectOrObservableObject = createObservableTypeCheckerCreator(!0, "Object");
    } ]);
});