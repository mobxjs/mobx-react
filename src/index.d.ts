/**
 * Turns a React component or stateless render function into a reactive component.
 */
import React = require("react");

export function observer<P>(clazz: React.StatelessComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(renderFunction: (props: P) => React.ReactElement<P>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ComponentClass<P>): React.ComponentClass<P>;
export function observer<P, TFunction extends React.ComponentClass<P>>(target: TFunction): TFunction; // decorator signature

// with stores
export function observer<P>(stores: string[], clazz: React.StatelessComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], renderFunction: (props: P) => React.ReactElement<any>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], clazz: React.ComponentClass<P>): React.ComponentClass<P>;
export function observer<P>(stores: string[]): <TFunction extends React.ComponentClass<P>>(target: TFunction) => TFunction; // decorator signature

// inject
export function inject<P>(...stores: string[]): <TFunction extends React.ComponentClass<P>>(target: TFunction) => TFunction; // decorator signature
export function inject<T, P>(storesToProps : (stores: any, nextProps: P, context:any) => T): <TFunction extends React.ComponentClass<T | P>>(target: TFunction) => TFunction; // decorator

export class Provider extends React.Component<any, {}> {

}

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

export const propTypes: {
    observableArray: React.Requireable<any>;
    observableMap: React.Requireable<any>;
    observableObject: React.Requireable<any>;
    arrayOrObservableArray: React.Requireable<any>;
    objectOrObservableObject: React.Requireable<any>;
}
