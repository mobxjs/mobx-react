import React, { PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import {observer} from './observer';

const injectorContextTypes = {
  mobxStores: PropTypes.object
};
Object.seal(injectorContextTypes);

const proxiedInjectorProps = {
  contextTypes: {
    get: function () {
      return injectorContextTypes;
    },
    set: function (_) {
      console.warn("Mobx Injector: you are trying to attach `contextTypes` on an component decorated with `inject` (or `observer`) HOC. Please specify the contextTypes on the wrapped component instead. It is accessible through the `wrappedComponent`");
    },
    configurable: true,
    enumerable: false
  },
  isMobxInjector: {
    value: true,
    writable: true,
    configurable: true,
    enumerable: true
  }
};

/**
 * Store Injection
 */
function createStoreInjector(grabStoresFn, component, injectNames) {
  let displayName = "inject-" + (component.displayName || component.name || (component.constructor && component.constructor.name) || "Unknown");
  if (injectNames)
    displayName += "-with-" + injectNames;

  const Injector = React.createClass({
    displayName: displayName,
    render: function () {
      let newProps = {};
      for (let key in this.props) if (this.props.hasOwnProperty(key)) {
        newProps[key] = this.props[key];
      }
      var additionalProps = grabStoresFn(this.context.mobxStores || {}, newProps, this.context) || {};
      for (let key in additionalProps) {
        newProps[key] = additionalProps[key];
      }
      newProps.ref = instance => {
        this.wrappedInstance = instance;
      }

      return React.createElement(component, newProps);
    }
  });

  // Static fields from component should be visible on the generated Injector
  hoistStatics(Injector, component);

  Injector.wrappedComponent = component;
  Object.defineProperties(Injector, proxiedInjectorProps);

  return Injector;
}


function grabStoresByName(storeNames) {
  return function (baseStores, nextProps) {
    storeNames.forEach(function (storeName) {
      if (storeName in nextProps) // prefer props over stores
        return;
      if (!(storeName in baseStores))
        throw new Error("MobX observer: Store '" + storeName + "' is not available! Make sure it is provided by some Provider");
      nextProps[storeName] = baseStores[storeName];
    });
    return nextProps;
  }
}

/**
 * higher order component that injects stores to a child.
 * takes either a varargs list of strings, which are stores read from the context,
 * or a function that manually maps the available stores from the context to props:
 * storesToProps(mobxStores, props, context) => newProps
 */
export default function inject(/* fn(stores, nextProps) or ...storeNames */) {
  let grabStoresFn;
  if (typeof arguments[0] === "function") {
    grabStoresFn = arguments[0];
    return function (componentClass) {
      let injected = createStoreInjector(grabStoresFn, componentClass);
      injected.isMobxInjector = false; // supress warning
      // mark the Injector as observer, to make it react to expressions in `grabStoresFn`,
      // see #111
      injected = observer(injected);
      injected.isMobxInjector = true; // restore warning
      return injected;
    };
  } else {
    const storeNames = [];
    for (let i = 0; i < arguments.length; i++)
      storeNames[i] = arguments[i];
    grabStoresFn = grabStoresByName(storeNames);
    return function (componentClass) {
      return createStoreInjector(grabStoresFn, componentClass, storeNames.join("-"));
    };
  }
}
