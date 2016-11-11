import { createClass, createElement } from 'react'
import ReactDOM from 'react-dom'
import test from 'tape'
import mobx from 'mobx'
import mobxReact from '../'

test('mobx issue 50', t => {
	const foo = {
		a: mobx.observable(true),
		b: mobx.observable(false),
		c: mobx.observable(function() {
			console.log('evaluate c');
			return foo.b.get();
		})
	};
	function flipStuff() {
		mobx.transaction(() => {
			foo.a.set(!foo.a.get());
			foo.b.set(!foo.b.get());
		})
	}
	let asText = '';
	let willReactCount = 0;
	mobx.autorun(function() {
		asText = [foo.a.get(), foo.b.get(), foo.c.get()].join(':');
	});
	const Test = mobxReact.observer(createClass({
		componentWillReact: () => willReactCount++,
		render: () => createElement('div', { id: 'x' }, [foo.a.get(), foo.b.get(), foo.c.get()].join(','))
	}));
	// In 3 seconds, flip a and b. This will change c.
	setTimeout(flipStuff, 200);

	setTimeout(() => {
		t.equal(asText, 'false:true:true');
		t.equal(document.getElementById('x').innerHTML, 'false,true,true');
		t.equal(willReactCount, 1);
		t.end();
	}, 400);

	ReactDOM.render(createElement(Test), document.getElementById('testroot'));
});

test('React.render should respect transaction', t => {
	const a = mobx.observable(2);
	const loaded = mobx.observable(false);
	const valuesSeen = [];

	const component = mobxReact.observer(() => {
		valuesSeen.push(a.get());
		if (loaded.get())
			return createElement('div', {}, a.get());
		else
			return createElement('div', {}, 'loading');
	});

	ReactDOM.render(createElement(component, {}), document.getElementById('testroot'));
	mobx.transaction(() => {
		a.set(3);
		a.set(4);
		loaded.set(true);
	});

	setTimeout(() => {
		t.equal(document.body.textContent.replace(/\s+/g,''), '4');
		t.deepEqual(valuesSeen, [2, 4]);
		t.end();
	}, 400);
});

test('React.render in transaction should succeed', t => {
	const a = mobx.observable(2);
	const loaded = mobx.observable(false);
	const valuesSeen = [];
	const component = mobxReact.observer(() => {
		valuesSeen.push(a.get());
		if (loaded.get())
			return createElement('div', {}, a.get());
		else
			return createElement('div', {}, 'loading');
	});

	mobx.transaction(() => {
		a.set(3);
		ReactDOM.render(createElement(component, {}), document.getElementById('testroot'));
		a.set(4);
		loaded.set(true);
	});

	setTimeout(() => {
		t.equal(document.body.textContent.replace(/\s+/g,''), '4');
		t.deepEqual(valuesSeen, [3, 4]);
		t.end();
	}, 400);
});