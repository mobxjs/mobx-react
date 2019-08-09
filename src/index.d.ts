/**
 * Turns a React component or stateless render function into a reactive component.
 */
import * as React from "react"

export {
    useObserver,
    useAsObservableSource,
    useLocalStore,
    IObserverOptions,
    Observer
} from "mobx-react-lite"

export type IReactComponent<P = any> =
    | React.StatelessComponent<P>
    | React.ComponentClass<P>
    | React.ClassicComponentClass<P>

/**
 * Observer
 */

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
}

// Ideally we would want to return React.ComponentClass<Partial<P>>,
// but TS doesn't allow such things in decorators, like we do in the non-decorator version
// See also #256
export function inject(
    ...stores: string[]
): <T extends IReactComponent<any>>(
    target: T
) => T & (T extends IReactComponent<infer P> ? IWrappedComponent<P> : never)
export function inject<S, P, I, C>(
    fn: IStoresToProps<S, P, I, C>
): <T extends IReactComponent>(target: T) => T & IWrappedComponent<P>

// Ideal implementation:
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
 * disposeOnUnmount
 */
type Disposer = () => void
export function disposeOnUnmount(target: React.Component<any, any>, propertyKey: string): void
export function disposeOnUnmount<TF extends Disposer | Disposer[]>(
    target: React.Component<any, any>,
    fn: TF
): TF

/**
 * Utilities
 */
export class Provider extends React.Component<any, {}> {}

export const MobXProviderContext: React.Context<any>

export function useStaticRendering(value: boolean): void
export function isUsingStaticRendering(): boolean

export const PropTypes: {
    observableArray: React.Requireable<any>
    observableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    observableMap: React.Requireable<any>
    observableObject: React.Requireable<any>
    arrayOrObservableArray: React.Requireable<any>
    arrayOrObservableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    objectOrObservableObject: React.Requireable<any>
}
