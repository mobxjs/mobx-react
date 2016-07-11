(function() {
    function mrFactory(mobx, React, ReactDOM) {
        if (!mobx)
            throw new Error("mobx-react requires the MobX package")
        if (!React)
            throw new Error("mobx-react requires React to be available");

        /**
         * dev tool support
         */
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
            if (node && componentByNodeRegistery)
                componentByNodeRegistery.set(node, component);

            renderReporter.emit({
                event: 'render',
                renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
                totalTime: Date.now() - component.__$mobRenderStart,
                component: component,
                node: node
            });
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

        /**
         * Utilities
         */
        var specialReactKeys = { children: true, key: true, ref: true };

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

        /**
         * ReactiveMixin
         */
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
                    if (node && componentByNodeRegistery) {
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

        /**
         * Observer function / decorator
         */
        function observer(arg1, arg2) {
            if (typeof arg1 === "string")
                throw new Error("Store names should be provided as array");
            if (Array.isArray(arg1)) {
                // component needs stores
                if (!arg2) {
                    // invoked as decorator
                    return function(componentClass) {
                        return observer(arg1, componentClass);
                    }
                } else {
                    return createStoreInjector(arg1, observer(arg2));
                }   
            }
            var componentClass = arg1;

            // Stateless function component:
            // If it is function but doesn't seem to be a react class constructor,
            // wrap it to a react class automatically
            if (
                typeof componentClass === "function" &&
                (!componentClass.prototype || !componentClass.prototype.render) &&
                !componentClass.isReactClass && 
                !React.Component.isPrototypeOf(componentClass)
            ) {
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

        /**
         * Store provider
         */
        var Provider = React.createClass({
            displayName: "Provider",

            render: function() {
                return React.Children.only(this.props.children);
            },

            getChildContext: function () {
                var stores = {};
                // inherit stores
                var baseStores = this.context.mobxStores;
                if (baseStores) for (var key in baseStores) {
                    stores[key] = baseStores[key];
                }
                // add own stores
                for (var key in this.props)
                    if (!specialReactKeys[key])
                        stores[key] = this.props[key];
                return {
                    mobxStores: stores
                };
            },

            componentWillReceiveProps: function(nextProps) {
                // Maybe this warning is to aggressive?
                if (Object.keys(nextProps).length !== Object.keys(this.props).length)
                    console.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children");
                for (var key in nextProps)
                    if (!specialReactKeys[key] && this.props[key] !== nextProps[key])
                        console.warn("MobX Provider: Provided store '" + key + "' has changed. Please avoid replacing stores as the change might not propagate to all children");
            }
        });

        var PropTypes = React.PropTypes;
        Provider.contextTypes = { mobxStores: PropTypes.object };
        Provider.childContextTypes = { mobxStores: PropTypes.object.isRequired };

        /**
         * Store Injection
         */
        function createStoreInjector(stores, component) {
            
            var statics = Object.getOwnPropertyNames(component).filter(function (propName) {
				return typeof component[propName] === 'function';
			}).reduce(function (staticMethods, staticName) {
				staticMethods[staticName] = component[staticName];
				return staticMethods;
			}, {});
			
            var Injector = React.createClass({
                displayName: "MobXStoreInjector",
                statics: statics,
                render: function() {
                    var newProps = {};
                    for (var key in this.props)
                        newProps[key] = this.props[key];
                    var baseStores = this.context.mobxStores || {};
                    stores.forEach(function(storeName) {
                        if (storeName in newProps) // prefer props over stores
                            return;
                        if (!(storeName in baseStores))
                            throw new Error("MobX observer: Store '" + storeName + "' is not available! Make sure it is provided by some Provider");
                        newProps[storeName] = baseStores[storeName];
                    }, this);
                    return React.createElement(component, newProps);
                }
            });
            Injector.contextTypes = { mobxStores: PropTypes.object };
            return Injector;
        }

        /**
         * PropTypes
         */

        
        function observableTypeChecker (type) {
            return function(props, propName, componentName) {
                if (!mobx['isObservable' + type](props[propName])) {
                    return new Error(
                        'Invalid prop `' + propName + '` supplied to' +
                        ' `' + componentName + '`. Expected a mobx observable ' + type + '. Validation failed.'
                    );
                }
            };
        }
        // oneOfType is used for simple isRequired chaining
        var propTypes = {
            observableArray: React.PropTypes.oneOfType([observableTypeChecker('Array')]),
            observableMap: React.PropTypes.oneOfType([observableTypeChecker('Map')]),
            observableObject: React.PropTypes.oneOfType([observableTypeChecker('Object')]),
            arrayOrObservableArray: React.PropTypes.oneOfType([
                React.PropTypes.array,
                observableTypeChecker('Array')
            ]),
            objectOrObservableObject: React.PropTypes.oneOfType([
                React.PropTypes.object,
                observableTypeChecker('Object')
            ])
        };

        /**
         * Export
         */
        return ({
            observer: observer,
            Provider: Provider,
            propTypes: propTypes,
            reactiveComponent: function() {
                console.warn("[mobx-react] `reactiveComponent` has been renamed to `observer` and will be removed in 1.1.");
                return observer.apply(null, arguments);
            },
            renderReporter: renderReporter,
            componentByNodeRegistery: componentByNodeRegistery,
            trackComponents: trackComponents
        });
    }

    /**
     * UMD
     */
    if (typeof exports === 'object') {
        module.exports = mrFactory(require('mobx'), require('react'), require('react-dom'));
    } else if (typeof define === 'function' && define.amd) {
        define('mobx-react', ['mobx', 'react', 'react-dom'], mrFactory);
    } else {
        this.mobxReact = mrFactory(this['mobx'], this['React'], this['ReactDOM']);
    }
})();
