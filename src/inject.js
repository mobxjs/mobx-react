import React, { PropTypes } from 'react';

/**
 * Store Injection
 */
function createStoreInjector(grabStoresFn, component) {
  var Injector = React.createClass({
    displayName: "MobXStoreInjector",
    render: function() {
      var newProps = {};
      for (var key in this.props)
        newProps[key] = this.props[key];
      newProps = grabStoresFn(this.context.mobxStores || {}, newProps, this.context);
      return React.createElement(component, newProps);
    }
    // TODO: should have shouldComponentUpdate?
  });
  Injector.contextTypes = { mobxStores: PropTypes.object };
  Injector.wrappedComponent = component;
  return Injector;
}

function grabStoresByName(storeNames) {
  return function(baseStores, nextProps) {
    storeNames.forEach(function(storeName) {
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
  var grabStoresFn;
  if (typeof arguments[0] === "function") {
    grabStoresFn = arguments[0];
  } else {
    var storesNames = [];
    for (var i = 0; i < arguments.length; i++)
      storesNames[i] = arguments[i];
    grabStoresFn = grabStoresByName(storesNames);
  }
  return function(componentClass) {
    return createStoreInjector(grabStoresFn, componentClass);
  };
}

