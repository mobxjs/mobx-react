export type IReactComponent<P = any> =
    | React.ClassicComponentClass<P>
    | React.ComponentClass<P>
    | React.StatelessComponent<P>
