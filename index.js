(function() {
    function mrFactory(mobx, React, ReactDOM) {
        if (!mobx)
            throw new Error("mobx-react requires the MobX package")
        if (!React)
            throw new Error("mobx-react requires React to be available");

        var isDevtoolsEnabled = false;

        // WeakMap<Node, Object>;
        var componentByNodeRegistery = typeof WeakMap !== "undefined" ? new WeakMap() : undefined;
        var renderReporter = new EventEmitter();
        function findDOMNode(component) {
            if (ReactDOM)
                return ReactDOM.findDOMNode(component);
            return null;
        }

        function reportRendering(component) {
            var node = findDOMNode(component);
            if (node)
                componentByNodeRegistery.set(node, component);

            renderReporter.emit({
                event: 'render',
                renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
                totalTime: Date.now() - component.__$mobRenderStart,
                component: component,
                node: node
            });
        }

        var reactiveMixin = {
            componentWillMount: function() {
                // Generate friendly name for debugging
                var name = [
                    this.displayName || this.name || (this.constructor && (this.constructor.displayName || this.constructor.name)) || "<component>",
                    "#", this._reactInternalInstance && this._reactInternalInstance._rootNodeID,
                    ".render()"
                ].join("");

                var baseRender = this.render.bind(this);
                var self = this;
                var reaction = null;
                var isRenderingPending = false;
                function initialRender() {
                    reaction = new mobx.Reaction(name, function() {
                        if (!isRenderingPending) {
                            isRenderingPending = true;
                            if (typeof self.componentWillReact === "function")
                                self.componentWillReact();
                            React.Component.prototype.forceUpdate.call(self)
                        }
                    });
                    reactiveRender.$mobx = reaction;
                    self.render = reactiveRender;
                    return reactiveRender();
                }

                function reactiveRender() {
                    isRenderingPending = false;
                    var rendering;
                    reaction.track(function() {
                        if (isDevtoolsEnabled)
                            self.__$mobRenderStart = Date.now();
                        rendering = mobx.extras.allowStateChanges(false, baseRender);
                        if (isDevtoolsEnabled)
                            self.__$mobRenderEnd = Date.now();
                    });
                    return rendering;
                }

                this.render = initialRender;
            },

            componentWillUnmount: function() {
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

            componentDidMount: function() {
                if (isDevtoolsEnabled)
                    reportRendering(this);
            },

            componentDidUpdate: function() {
                if (isDevtoolsEnabled)
                    reportRendering(this);
            },

            shouldComponentUpdate: function(nextProps, nextState) {
                // TODO: if context changed, return true.., see #18
                
                // if props or state did change, but a render was scheduled already, no additional render needs to be scheduled
                if (this.render.$mobx && this.render.$mobx.isScheduled() === true)
                    return false;
                
                // update on any state changes (as is the default)
                if (this.state !== nextState)
                    return true;
                // update if props are shallowly not equal, inspired by PureRenderMixin
                var keys = Object.keys(this.props);
                var key;
                if (keys.length !== Object.keys(nextProps).length)
                    return true;
                for(var i = keys.length -1; i >= 0, key = keys[i]; i--) {
                    var newValue = nextProps[key];
                    if (newValue !== this.props[key]) {
                        return true;
                    } else if (newValue && typeof newValue === "object" && !mobx.isObservable(newValue)) {
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
        }

        function patch(target, funcName) {
            var base = target[funcName];
            var mixinFunc = reactiveMixin[funcName];
            if (!base) {
                target[funcName] = mixinFunc;
            } else {
                target[funcName] = function() {
                    base.apply(this, arguments);
                    mixinFunc.apply(this, arguments);
                }
            }
        }

        function observer(componentClass) {
            // If it is function but doesn't seem to be a react class constructor,
            // wrap it to a react class automatically
            if (typeof componentClass === "function" && !componentClass.prototype.render && !componentClass.isReactClass && !React.Component.isPrototypeOf(componentClass)) {
                return observer(React.createClass({
                    displayName:     componentClass.displayName || componentClass.name,
                    propTypes:       componentClass.propTypes,
                    contextTypes:    componentClass.contextTypes,
                    getDefaultProps: function() { return componentClass.defaultProps; },
                    render:          function() { return componentClass.call(this, this.props, this.context); }
                }));
            }

            if (!componentClass)
                throw new Error("Please pass a valid component to 'observer'");
            var target = componentClass.prototype || componentClass;

            [
                "componentWillMount",
                "componentWillUnmount",
                "componentDidMount",
                "componentDidUpdate"
            ].forEach(function(funcName) {
                patch(target, funcName)
            });

            if (!target.shouldComponentUpdate)
                target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
            componentClass.isMobXReactObserver = true;
            return componentClass;
        }

        function trackComponents() {
            if (typeof WeakMap === "undefined")
                throw new Error("[mobx-react] tracking components is not supported in this browser.");
            if (!isDevtoolsEnabled)
                isDevtoolsEnabled = true;
        }

        function EventEmitter() {
            this.listeners = [];
        };
        EventEmitter.prototype.on = function (cb) {
            this.listeners.push(cb);
            var self = this;
            return function() {
                var idx = self.listeners.indexOf(cb);
                if (idx !== -1)
                    self.listeners.splice(idx, 1);
            };
        };
        EventEmitter.prototype.emit = function(data) {
            this.listeners.forEach(function (fn) {
                fn(data);
            });
        };
        
        var undef = {}['undef'];
        function ensureUpdateFromProps(proto, name) {
            var compProto = proto;
            var clazz = proto.constructor;
            if (!compProto._updateFromProps) {
                compProto._updateFromProps = [];
                compProto._componentWillReceiveProps = compProto.componentWillReceiveProps;
                compProto.componentWillReceiveProps = function (nextProps) {
                    var names = compProto._updateFromProps;
                    var idx = names.length;
                    while (idx--) {
                        var name_1 = names[idx];
                        if (nextProps[name_1] !== undef)
                            this[name_1] = nextProps[name_1];
                        else
                            this[name_1] = clazz.defaultProps && clazz.defaultProps[name_1];
                    }
                    if (compProto._componentWillReceiveProps)
                        compProto._componentWillReceiveProps.call(this, arguments[0], arguments[1]);
                };
            }
            compProto._updateFromProps.push(name);
        }

        function makeContextObservable(instance, name, nameInContext, value) {
            var obsCtx = instance._observableContext;
            if (!obsCtx) obsCtx = instance._observableContext = {};
            var obs = obsCtx[nameInContext] = mobx.observable(value);
            var ctxVal = instance.context && instance.context[nameInContext];
            var getObs = ctxVal || obs;
            Object.defineProperty(instance, name, {
                enumerable: true,
                configurable: true,
                get: ctxVal && !ctxVal.get
                    ? function () { return ctxVal; }
                    : function () { return getObs.get(); },
                set: function (value) { return obs.set(value); }
            });
        }

        function context(propType, defaultValue, nameInContext) {
            return function (proto, name) {
                var clazz = proto.constructor;
                if (!clazz.childContextTypes)
                    clazz.childContextTypes = {};
                if (!clazz.contextTypes)
                    clazz.contextTypes = {};
                if (!clazz.propTypes)
                    clazz.propTypes = {};
                nameInContext = nameInContext || name;
                clazz.childContextTypes[nameInContext] = propType;
                clazz.contextTypes[nameInContext] = propType;
                clazz.propTypes[name] = propType;
                if (defaultValue) {
                    if (!clazz.defaultProps)
                        clazz.defaultProps = {};
                    clazz.defaultProps[name] = defaultValue;
                }
                ensureUpdateFromProps(proto, name);
                Object.defineProperty(proto, name, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        var obs = this.context[nameInContext];
                        if (obs)
                            return obs.get ? obs.get() : obs;
                        makeContextObservable(this, name, nameInContext, this.props[name]);
                        return this[name];
                    },
                    set: function (value) {
                        makeContextObservable(this, name, nameInContext, this.props[name] || value);
                    }
                });
                var provider = proto;
                if (provider.getChildContext)
                    return;
                provider.getChildContext = function () {
                    if (!this._observableContext) {
                        for (var key in clazz.childContextTypes)
                            var ign = this[key];
                        if (!this._observableContext)
                            this._observableContext = {};
                    }
                    return this._observableContext;
                };
            };
        }

        function property(propType, defaultValue) {
            return function (proto, name) {
                var clazz = proto.constructor;
                if (!clazz.propTypes)
                    clazz.propTypes = {};
                clazz.propTypes[name] = propType;
                if (defaultValue) {
                    if (!clazz.defaultProps)
                        clazz.defaultProps = {};
                    clazz.defaultProps[name] = defaultValue;
                }
                Object.defineProperty(proto, name, {
                    enumerable: true,
                    configurable: true,
                    get: function () { return this.props[name]; },
                    set: function (value) { throw new Error('\'' + name + '\' is a property and cannot be set'); }
                });
            };
        }

        function state(propType, defaultValue) {
            return function (proto, name) {
                var clazz = proto.constructor;
                if (!clazz.propTypes)
                    clazz.propTypes = {};
                clazz.propTypes[name] = propType;
                if (defaultValue) {
                    if (!clazz.defaultProps)
                        clazz.defaultProps = {};
                    clazz.defaultProps[name] = defaultValue;
                }
                ensureUpdateFromProps(proto, name);
                Object.defineProperty(proto, name, {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        mobx.extendObservable(this, (_a = {}, _a[name] = this.props[name], _a));
                        return this[name];
                        var _a;
                    },
                    set: function (value) {
                        mobx.extendObservable(this, (_a = {}, _a[name] = value, _a));
                        var _a;
                    }
                });
            };
        }

        return ({
            observer: observer,
            reactiveComponent: function() {
                console.warn("[mobx-react] `reactiveComponent` has been renamed to `observer` and will be removed in 1.1.");
                return observer.apply(null, arguments);
            },
            renderReporter: renderReporter,
            componentByNodeRegistery: componentByNodeRegistery,
            trackComponents: trackComponents,
            property: property,
            state: state,
            context: context
        });
    }

    // UMD
    if (typeof exports === 'object') {
        module.exports = mrFactory(require('mobx'), require('react'), require('react-dom'));
    } else if (typeof define === 'function' && define.amd) {
        define('mobx-react', ['mobx', 'react', 'react-dom'], mrFactory);
    } else {
        this.mobxReact = mrFactory(this['mobx'], this['React'], this['ReactDOM']);
    }
})();
