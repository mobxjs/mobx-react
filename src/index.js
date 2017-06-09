import * as mobx from 'mobx';
import React from 'react';
import {unstable_batchedUpdates as rdBatched} from 'react-dom';
import {unstable_batchedUpdates as rnBatched} from 'react-native';

let TARGET_LIB_NAME;
if (__TARGET__ === 'browser') TARGET_LIB_NAME = 'mobx-react';
if (__TARGET__ === 'native') TARGET_LIB_NAME = 'mobx-react/native';
if (__TARGET__ === 'custom') TARGET_LIB_NAME = 'mobx-react/custom';

if (!mobx)
  throw new Error(TARGET_LIB_NAME + ' requires the MobX package');
if (!React)
  throw new Error(TARGET_LIB_NAME + ' requires React to be available');

if (__TARGET__ === 'browser' && typeof rdBatched === "function")
  mobx.extras.setReactionScheduler(rdBatched);
if (__TARGET__ === 'native' && typeof rnBatched === "function")
  mobx.extras.setReactionScheduler(rnBatched);

export {
  observer,
  Observer,
  renderReporter,
  componentByNodeRegistery,
  trackComponents,
  useStaticRendering
} from './observer';

export { default as Provider } from './Provider';
export { default as inject } from './inject';

import * as propTypes from './propTypes';
export { propTypes };
export { propTypes as PropTypes };

import { errorsReporter } from './observer';
export const onError = fn => errorsReporter.on(fn);

export default exports;

/* DevTool support */
import { renderReporter, componentByNodeRegistery, trackComponents } from './observer';
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
  const mobxReact = { renderReporter, componentByNodeRegistery, trackComponents };
  __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobxReact(mobxReact, mobx)
}
