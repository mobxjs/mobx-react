/**
 * Turns a React component or stateless render function into a reactive component.
 */
import React = require('react');

export function observer<P>(clazz: React.StatelessComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(renderFunction: (props: P) => React.ReactElement<any>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ComponentClass<P>): React.ComponentClass<P>;
export function observer<TFunction extends React.ComponentClass<any>>(target: TFunction): TFunction; // decorator signature

// with stores
export function observer<P>(stores: string[], clazz: React.StatelessComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], renderFunction: (props: P) => React.ReactElement<any>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(stores: string[], clazz: React.ComponentClass<P>): React.ComponentClass<P>;
export function observer(stores: string[]): <TFunction extends React.ComponentClass<any>>(target: TFunction) => TFunction; // decorator signature

export class Provider extends React.Component<any, {}> {

}

// renderReporter for tracking renders
export var renderReporter: RenderReporter;

export interface RenderReporter {
  on(eventName: string, handler: (data: any) => void) => void;
  emit(eventName: string, data: any) => void;
}

