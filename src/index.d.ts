/**
 * Turns a React component or stateless render function into a reactive component.
 */
import React = require("react");

export type IStoresToProps<T, P> = (stores: any, nextProps: P, context:any) => T;
export type IReactComponent<P> = React.StatelessComponent<P> | React.ComponentClass<P>;
export type IWrappedComponent<P> = {
    wrappedComponent: IReactComponent<P>;
    wrappedInstance: React.ReactElement<P>;
}

export function observer<P>(clazz: IReactComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P, TFunction extends React.ComponentClass<P | void>>(target: TFunction): TFunction; // decorator signature

export function inject<P>(...stores: string[]): (<TFunction extends IReactComponent<P>>(target: TFunction) => (TFunction & IWrappedComponent<P>)); // decorator signature
export function inject<T, P>(storesToProps : IStoresToProps<T, P>): (<TFunction extends IReactComponent<T | P>>(target: TFunction) => (TFunction & IWrappedComponent<T>)); // decorator

// Deprecated: observer with with stores
export function observer<P>(stores: string[], clazz: IReactComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[]): <TFunction extends IReactComponent<P>>(target: TFunction) => TFunction; // decorator signature

export class Provider extends React.Component<any, {}> {

}

export class Observer extends React.Component<{ children?: () => React.ReactElement<any> }, {}> {

}

export function useStaticRendering(value: boolean): void;

/**
 * Enable dev tool support, makes sure that renderReport emits events.
 */
export function trackComponents():void;

export const renderReporter: RenderReporter;

export interface RenderReporter {
  on(handler: (data: IRenderEvent) => void): void;
}

export interface IRenderEvent {
    event: "render" | "destroy";
    renderTime?: number;
    totalTime?: number;
    component: React.ReactElement<any>; // Component instance
    node: any; // DOMNode
}

/**
 * WeakMap DOMNode -> Component instance
 */
export const componentByNodeRegistery: any;

/**
 * @deprecated, use PropTypes instead
 */
export const propTypes: {
    observableArray: React.Requireable<any>;
    observableMap: React.Requireable<any>;
    observableObject: React.Requireable<any>;
    arrayOrObservableArray: React.Requireable<any>;
    objectOrObservableObject: React.Requireable<any>;
}

export const PropTypes: {
    observableArray: React.Requireable<any>;
    observableMap: React.Requireable<any>;
    observableObject: React.Requireable<any>;
    arrayOrObservableArray: React.Requireable<any>;
    objectOrObservableObject: React.Requireable<any>;
}
