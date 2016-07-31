import React, { Component, PropTypes } from 'react';

const specialReactKeys = { children: true, key: true, ref: true };

export default class Provider extends Component {

  static contextTypes = {
    mobxStores: PropTypes.object,
  };

  static childContextTypes = {
    mobxStores: PropTypes.object.isRequired,
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
      if (!specialReactKeys[key])
        stores[key] = this.props[key];
    return {
      mobxStores: stores
    };
  }

  componentWillReceiveProps(nextProps) {
    // Maybe this warning is to aggressive?
    if (Object.keys(nextProps).length !== Object.keys(this.props).length)
      console.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children");
    for (let key in nextProps)
      if (!specialReactKeys[key] && this.props[key] !== nextProps[key])
        console.warn("MobX Provider: Provided store '" + key + "' has changed. Please avoid replacing stores as the change might not propagate to all children");
  }
}
