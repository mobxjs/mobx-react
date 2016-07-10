import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Component} from 'react'; 
import {observer, Provider} from '../../';

@observer
class T1 extends Component<{ pizza: number}, {}> {
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
	}
}));

const T3 = observer((props: { hamburger: number }) => {
	return <T2 cake={this.props.hamburger} />;
});

const T4 = ({sandwich}: {sandwich: number}) => <div><T3 hamburger={this.props.sandwich} /></div>;

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

class T7 extends Component<{ pizza: number}, {}> {
    render() {
        return <div>{this.props.pizza}</div>;
    }
}
React.createElement(observer(T7), { pizza: 4 });


ReactDOM.render(<T5 />, document.body);

/// with stores
@observer(["store1", "store2"])
class T8 extends Component<{ pizza: number}, {}> {
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


ReactDOM.render(<T10 hamburger={3} />, document.body);