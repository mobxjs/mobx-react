/**
 * Turns a React component or stateless render function into a reactive component.
 */
import React = require('react');

export function observer<P>(clazz: React.StatelessComponent<P>): React.ClassicComponentClass<P>;
export function observer<P>(renderFunction: (props: P) => React.ReactElement<any>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ClassicComponentClass<P>): React.ClassicComponentClass<P>;
export function observer<P>(clazz: React.ComponentClass<P>): React.ComponentClass<P>;
export function observer<TFunction extends React.ComponentClass<any>>(target: TFunction): TFunction; // decorator signature

export function property(propType: React.Validator<any>, defaultValue?: any): void
export function state(propType: React.Validator<any>, defaultValue?: any): void
export function context(propType: React.Validator<any>, defaultValue?: any, nameInContext?: string): void