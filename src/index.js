import {extras, spy} from 'mobx';
import { Component } from 'react';
import {unstable_batchedUpdates as rdBatched} from 'react-dom';
import {unstable_batchedUpdates as rnBatched} from 'react-native';

if (!Component)
  throw new Error('mobx-react requires React to be available');
if (!extras)
  throw new Error('mobx-react requires mobx to be available');

if (typeof rdBatched === "function")
  extras.setReactionScheduler(rdBatched);
else if (typeof rnBatched === "function")
  extras.setReactionScheduler(rnBatched);

export {
    observer,
    Observer,
    renderReporter,
    componentByNodeRegistery,
    trackComponents,
    useStaticRendering
} from "./observer"

export { default as Provider } from "./Provider"
export { default as inject } from "./inject"

import * as propTypes from "./propTypes"
export { propTypes }
export { propTypes as PropTypes }

import { errorsReporter } from "./observer"
export const onError = fn => errorsReporter.on(fn)

export default exports

/* DevTool support */
// MWE: is any tool still using this? Seems it can be killed
import { renderReporter, componentByNodeRegistery, trackComponents } from './observer';
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
  const mobx = { spy, extras };
  const mobxReact = { renderReporter, componentByNodeRegistery, trackComponents };
  __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobxReact(mobxReact, mobx);
}
