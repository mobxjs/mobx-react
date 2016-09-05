import mobx from 'mobx';
import React from 'react';

let TARGET_LIB_NAME;
if (__TARGET__ === 'browser') TARGET_LIB_NAME = 'mobx-react';
if (__TARGET__ === 'native') TARGET_LIB_NAME = 'mobx-react/native';
if (__TARGET__ === 'custom') TARGET_LIB_NAME = 'mobx-react/custom';

if (!mobx)
  throw new Error(TARGET_LIB_NAME + ' requires the MobX package');
if (!React)
  throw new Error(TARGET_LIB_NAME + ' requires React to be available');

export {
  observer,
  renderReporter,
  componentByNodeRegistery,
  trackComponents
} from './observer';

export { default as Provider } from './Provider';
export { default as inject } from './inject';

import * as propTypes from './propTypes';
export { propTypes };
export { propTypes as PropTypes };

export default module.exports;

/* Deprecated */

export const reactiveComponent = () => {
  console.warn(
    '[mobx-react] `reactiveComponent` has been renamed to `observer` ' +
    'and will be removed in 1.1.'
  );
  return observer.apply(null, arguments);
};


/* DevTool support */
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
  __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobxReact(module.exports, mobx)
}
