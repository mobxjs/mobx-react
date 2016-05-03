(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "mobx", "react", "react-dom"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("mobx"), require("react"), require("react-dom"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.mobx, global.react, global.reactDom);
        global.index = mod.exports;
    }
})(this, function (exports, _mobx, _react, _reactDom) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.renderReporter = exports.componentByNodeRegistery = undefined;
    exports.observer = observer;
    exports.trackComponents = trackComponents;
    exports.reactiveComponent = reactiveComponent;

    var _mobx2 = _interopRequireDefault(_mobx);

    var _react2 = _interopRequireDefault(_react);

    var _reactDom2 = _interopRequireDefault(_reactDom);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
    };

    var isDevtoolsEnabled = false;

    // WeakMap<Node, Object>;
    var componentByNodeRegistery = exports.componentByNodeRegistery = typeof WeakMap !== "undefined" ? new WeakMap() : undefined;
    var renderReporter = exports.renderReporter = new _mobx2.default.SimpleEventEmitter();

    function findDOMNode(component) {
        if (_reactDom2.default) return _reactDom2.default.findDOMNode(component);
        return null;
    }

    function reportRendering(component) {
        var node = findDOMNode(component);
        if (node) componentByNodeRegistery.set(node, component);

        renderReporter.emit({
            event: 'render',
            renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
            totalTime: Date.now() - component.__$mobRenderStart,
            component: component,
            node: node
        });
    }

    var reactiveMixin = {
        componentWillMount: function componentWillMount() {
            // Generate friendly name for debugging
            var name = [this.displayName || this.name || this.constructor && (this.constructor.displayName || this.constructor.name) || "<component>", "#", this._reactInternalInstance && this._reactInternalInstance._rootNodeID, ".render()"].join("");

            var baseRender = this.render.bind(this);
            var self = this;
            var reaction = null;
            var isRenderingPending = false;
            function initialRender() {
                reaction = new _mobx2.default.Reaction(name, function () {
                    if (!isRenderingPending) {
                        isRenderingPending = true;
                        if (typeof self.componentWillReact === "function") self.componentWillReact();
                        _react2.default.Component.prototype.forceUpdate.call(self);
                    }
                });
                reactiveRender.$mobx = reaction;
                self.render = reactiveRender;
                return reactiveRender();
            }

            function reactiveRender() {
                isRenderingPending = false;
                var rendering;
                reaction.track(function () {
                    if (isDevtoolsEnabled) self.__$mobRenderStart = Date.now();
                    rendering = _mobx2.default.extras.allowStateChanges(false, baseRender);
                    if (isDevtoolsEnabled) self.__$mobRenderEnd = Date.now();
                });
                return rendering;
            }

            this.render = initialRender;
        },

        componentWillUnmount: function componentWillUnmount() {
            this.render.$mobx && this.render.$mobx.dispose();
            if (isDevtoolsEnabled) {
                var node = findDOMNode(this);
                if (node) {
                    componentByNodeRegistery.delete(node);
                }
                renderReporter.emit({
                    event: 'destroy',
                    component: this,
                    node: node
                });
            }
        },

        componentDidMount: function componentDidMount() {
            if (isDevtoolsEnabled) reportRendering(this);
        },

        componentDidUpdate: function componentDidUpdate() {
            if (isDevtoolsEnabled) reportRendering(this);
        },

        shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
            // TODO: if context changed, return true.., see #18

            // if props or state did change, but a render was scheduled already, no additional render needs to be scheduled
            if (this.render.$mobx && this.render.$mobx.isScheduled() === true) return false;

            // update on any state changes (as is the default)
            if (this.state !== nextState) return true;
            // update if props are shallowly not equal, inspired by PureRenderMixin
            var keys = Object.keys(this.props);
            var key;
            if (keys.length !== Object.keys(nextProps).length) return true;
            for (var i = keys.length - 1; i >= 0, key = keys[i]; i--) {
                var newValue = nextProps[key];
                if (newValue !== this.props[key]) {
                    return true;
                } else if (newValue && (typeof newValue === "undefined" ? "undefined" : _typeof(newValue)) === "object" && !_mobx2.default.isObservable(newValue)) {
                    /**
                     * If the newValue is still the same object, but that object is not observable,
                     * fallback to the default React behavior: update, because the object *might* have changed.
                     * If you need the non default behavior, just use the React pure render mixin, as that one
                     * will work fine with mobx as well, instead of the default implementation of
                     * observer.
                     */
                    return true;
                }
            }
            return false;
        }
    };

    function patch(target, funcName) {
        var base = target[funcName];
        var mixinFunc = reactiveMixin[funcName];
        if (!base) {
            target[funcName] = mixinFunc;
        } else {
            target[funcName] = function () {
                base.apply(this, arguments);
                mixinFunc.apply(this, arguments);
            };
        }
    }

    function observer(componentClass) {
        // If it is function but doesn't seem to be a react class constructor,
        // wrap it to a react class automatically
        if (typeof componentClass === "function" && !componentClass.prototype.render && !componentClass.isReactClass && !_react2.default.Component.isPrototypeOf(componentClass)) {
            return observer(_react2.default.createClass({
                displayName: componentClass.displayName || componentClass.name,
                propTypes: componentClass.propTypes,
                contextTypes: componentClass.contextTypes,
                getDefaultProps: function getDefaultProps() {
                    return componentClass.defaultProps;
                },
                render: function render() {
                    return componentClass.call(this, this.props, this.context);
                }
            }));
        }

        if (!componentClass) throw new Error("Please pass a valid component to 'observer'");
        var target = componentClass.prototype || componentClass;

        ["componentWillMount", "componentWillUnmount", "componentDidMount", "componentDidUpdate"].forEach(function (funcName) {
            patch(target, funcName);
        });

        if (!target.shouldComponentUpdate) target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
        componentClass.isMobXReactObserver = true;
        return componentClass;
    }

    function trackComponents() {
        if (typeof WeakMap === "undefined") throw new Error("[mobx-react] tracking components is not supported in this browser.");
        if (!isDevtoolsEnabled) isDevtoolsEnabled = true;
    }

    function reactiveComponent() {
        console.warn("[mobx-react] `reactiveComponent` has been renamed to `observer` and will be removed in 1.1.");
        return observer.apply(null, arguments);
    }
});
