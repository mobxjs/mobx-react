import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Component, PropTypes} from 'react';
import {observer, Provider, propTypes, inject, Observer} from '../../';

@observer
class T1 extends Component<{ pizza: number }, {}> {
	render() {
		return <div>{this.props.pizza}</div>;
	}
}

const T2 = observer(React.createClass({
	getDefaultProps() {
		return { cake: 7 };
	},
	render() {
		return <div><T1 pizza = {this.props.cake} /></div>;
	},
    propTypes: {
        zoem: propTypes.arrayOrObservableArray
    }
}));

const T3 = observer((props: { hamburger: number }) => {
	return <T2 cake={this.props.hamburger} />;
});

const T4 = ({sandwich}: { sandwich: number }) => <div><T3 hamburger={this.props.sandwich} /></div>;

const T5 = observer(() => {
	return <T3 hamburger={17} />;
});

@observer
class T6 extends Component<{}, {}> {

	render() {
		return <span>
			<T3 hamburger={6} />
			{/* doesn't work with tsc 1.7.5: https://github.com/Microsoft/TypeScript/issues/5675 */}
			{/*<T4 sandwich={5} />*/}
			<T5 />
		</span>;
	}
}

const x = React.createElement(T3, { hamburger: 4 });

class T7 extends Component<{ pizza: number }, {}> {
    render() {
        return <div>{this.props.pizza}</div>;
    }
}
React.createElement(observer(T7), { pizza: 4 });


ReactDOM.render(<T5 />, document.body);

/// with stores
@observer(["store1", "store2"])
class T8 extends Component<{ pizza: number }, {}> {
	render() {
		return <div>{this.props.pizza}</div>;
	}
}

const T9 = observer(["stores"], React.createClass({
	getDefaultProps() {
		return { cake: 7 };
	},
	render() {
		return <div><T1 pizza = {this.props.cake} /></div>;
	}
}));

const T10 = observer(["stores"], (props: { hamburger: number }) => {
	return <T2 cake={this.props.hamburger} />;
});

React.createElement(observer(T8), { pizza: 4 });

class ProviderTest extends Component<any, any> {
    render() {
        return <Provider foo={32}>
            <div>hi</div>
        </Provider>;
    }
}

@inject(() => ({ x: 3 }))
class T11 extends Component<{ pizza: number, x?: number }, {}> {
	render() {
		return <div>{this.props.pizza}{this.props.x}</div>;
	}
}

class T15 extends Component<{ pizza: number, x?: number }, {}> {
	render() {
		return <div>{this.props.pizza}{this.props.x}</div>;
	}
}
const T16 = inject(() => ({ x: 3 }))(T15);

class T17 extends React.Component<{}, {}> {
    render() {
        return <div>
            <T11 pizza={3} x={1} />
            <T15 pizza={3} x={1} />
            <T16 pizza={4} x={2} />
            <T11 pizza={3} />
            <T15 pizza={3} />
            <T16 pizza={4} />
        </div>
    }
}


@inject("a", "b")
class T12 extends Component<{ pizza: number }, {}> {
	render() {
		return <div>{this.props.pizza}</div>;
	}
}

@inject("a", "b") @observer
class T13 extends Component<{ pizza: number }, {}> {
	render() {
		return <div>{this.props.pizza}</div>;
	}
}

@inject((allStores) => ({
    store: {},
}))
@observer
class LoginContainer extends Component<any, void> {
    static contextTypes: React.ValidationMap<any> = {
        router: PropTypes.func.isRequired,
    }

    render() {
        return (<div>Hello!</div>)
    }
}

ReactDOM.render(<T10 hamburger={3} />, document.body);

class ObserverTest extends Component<any, any> {
	render() {
		return <Observer>{() => <div>test</div>}</Observer>;
	}
}
