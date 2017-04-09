import React, { Component } from 'react';
import * as PropTypes from './propTypes';

const specialReactKeys = { children: true, key: true, ref: true };

export default class Provider extends Component {

  static contextTypes = {
    mobxStores: PropTypes.objectOrObservableObject,
  };

  static childContextTypes = {
    mobxStores: PropTypes.objectOrObservableObject.isRequired,
  };

  render() {
    return React.Children.only(this.props.children);
  }

  getChildContext() {
    const stores = {};
    // inherit stores
    const baseStores = this.context.mobxStores;
    if (baseStores) for (let key in baseStores) {
      stores[key] = baseStores[key];
    }
    // add own stores
    for (let key in this.props)
      if (!specialReactKeys[key] && key !== "suppressChangedStoreWarning")
        stores[key] = this.props[key];
    return {
      mobxStores: stores
    };
  }

  componentWillReceiveProps(nextProps) {
    // Maybe this warning is too aggressive?
    if (Object.keys(nextProps).length !== Object.keys(this.props).length)
      console.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children");
    if (!nextProps.suppressChangedStoreWarning)
      for (let key in nextProps)
        if (!specialReactKeys[key] && this.props[key] !== nextProps[key])
          console.warn("MobX Provider: Provided store '" + key + "' has changed. Please avoid replacing stores as the change might not propagate to all children");
  }
}
