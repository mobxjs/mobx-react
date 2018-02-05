/**
 * Turns a React component or stateless render function into a reactive component.
 */
import React = require("react")

export type IReactComponent<P = any> =
    | React.StatelessComponent<P>
    | React.ComponentClass<P>
    | React.ClassicComponentClass<P>

/**
 * Observer
 */

// Deprecated: observer with with stores (as decorator)
export function observer(stores: string[]): <T extends IReactComponent>(clazz: T) => void
// Deprecated: observer with with stores
export function observer<T extends IReactComponent>(stores: string[], clazz: T): T
export function observer<T extends IReactComponent>(target: T): T

/**
 * Inject
 */
export type IValueMap = { [key: string]: any }
export type IStoresToProps<
    S extends IValueMap = {},
    P extends IValueMap = {},
    I extends IValueMap = {},
    C extends IValueMap = {}
> = (stores: S, nextProps: P, context: C) => I

export type IWrappedComponent<P> = {
    wrappedComponent: IReactComponent<P>
    wrappedInstance: React.ReactInstance | undefined
}

// Ideally we would want to return React.ComponentClass<Partial<P>>,
// but TS doesn't allow such things in decorators, like we do in the non-decorator version
// See also #256
export function inject(
    ...stores: string[]
): <T extends IReactComponent>(target: T) => T & IWrappedComponent<T>
export function inject<S, P, I, C>(
    fn: IStoresToProps<S, P, I, C>
): <T extends IReactComponent>(target: T) => T & IWrappedComponent<T>

// Ideal implemetnation:
// export function inject
// (
// fn: IStoresToProps
// ):
// <P>(target: IReactComponent<P>) => IReactComponent<Partial<P>> & IWrappedComponent<IReactComponent<Partial<P>>>
//
// Or even better: (but that would require type inference to work other way around)
// export function inject<P, I>
// (
// fn: IStoresToProps<any, P, I>
// ):
// <T extends IReactComponent<P & S>(target: T) => IReactComponent<P> & IWrappedComponent<T>

/**
 * Utilities
 */
export function onError(cb: (error: Error) => void): () => void

export class Provider extends React.Component<any, {}> {}

export class Observer extends React.Component<
    {
        children?: () => React.ReactNode
        render?: () => React.ReactNode
        inject?: IStoresToProps | string[]
    },
    {}
> {}

export function useStaticRendering(value: boolean): void

/**
 * Enable dev tool support, makes sure that renderReport emits events.
 */
export function trackComponents(): void

export const renderReporter: RenderReporter

export interface RenderReporter {
    on(handler: (data: IRenderEvent) => void): void
}

export interface IRenderEvent {
    event: "render" | "destroy"
    renderTime?: number
    totalTime?: number
    component: React.ReactElement<any> // Component instance
    node: any // DOMNode
}

/**
 * WeakMap DOMNode -> Component instance
 */
export const componentByNodeRegistery: any

/**
 * @deprecated, use PropTypes instead
 */
export const propTypes: {
    observableArray: React.Requireable<any>
    observableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    observableMap: React.Requireable<any>
    observableObject: React.Requireable<any>
    arrayOrObservableArray: React.Requireable<any>
    arrayOrObservableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    objectOrObservableObject: React.Requireable<any>
}

export const PropTypes: {
    observableArray: React.Requireable<any>
    observableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    observableMap: React.Requireable<any>
    observableObject: React.Requireable<any>
    arrayOrObservableArray: React.Requireable<any>
    arrayOrObservableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    objectOrObservableObject: React.Requireable<any>
}
