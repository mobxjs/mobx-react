import React, { createClass } from 'react'
import ReactDOM from 'react-dom'
import test from 'tape'
import mobx from 'mobx'
import mobxReact from '../'
import {createTestRoot} from "./index"

test('mobx issue 50', t => {
	const testRoot = createTestRoot();
	const foo = {
		a: mobx.observable(true),
		b: mobx.observable(false),
		c: mobx.computed(function() {
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
	mobx.autorun(() => asText = [foo.a.get(), foo.b.get(), foo.c.get()].join(':'));
	const Test = mobxReact.observer(createClass({
		componentWillReact: () => willReactCount++,
		render: () => <div id='x'>{ [foo.a.get(), foo.b.get(), foo.c.get()].join(',') }</div>
	}));
	// In 3 seconds, flip a and b. This will change c.
	setTimeout(flipStuff, 200);

	setTimeout(() => {
		t.equal(asText, 'false:true:true');
		t.equal(document.getElementById('x').innerText, 'false,true,true');
		t.equal(willReactCount, 1);
		testRoot.parentNode.removeChild(testRoot);
		t.end();
	}, 400);

	ReactDOM.render(<Test />, testRoot);
});

test('React.render should respect transaction', t => {
	const testRoot = createTestRoot();
	const a = mobx.observable(2);
	const loaded = mobx.observable(false);
	const valuesSeen = [];

	const Component = mobxReact.observer(() => {
		valuesSeen.push(a.get());
		if (loaded.get())
			return <div>{ a.get() }</div>
		else
			return <div>loading</div>
	});

	ReactDOM.render(<Component />, testRoot);
	mobx.transaction(() => {
		a.set(3);
		a.set(4);
		loaded.set(true);
	});

	setTimeout(() => {
		t.equal(testRoot.textContent.replace(/\s+/g,''), '4');
		t.deepEqual(valuesSeen, [2, 4]);
		testRoot.parentNode.removeChild(testRoot);
		t.end();
	}, 400);
});

test('React.render in transaction should succeed', t => {
	const testRoot = createTestRoot();
	const a = mobx.observable(2);
	const loaded = mobx.observable(false);
	const valuesSeen = [];
	const Component = mobxReact.observer(() => {
		valuesSeen.push(a.get());
		if (loaded.get())
			return <div>{ a.get() }</div>
		else
			return <div>loading</div>
	});

	mobx.transaction(() => {
		a.set(3);
		ReactDOM.render(<Component />, testRoot);
		a.set(4);
		loaded.set(true);
	});

	setTimeout(() => {
		t.equal(testRoot.textContent.replace(/\s+/g,''), '4');
		t.deepEqual(valuesSeen, [3, 4]);
		testRoot.parentNode.removeChild(testRoot);
		t.end();
	}, 400);
});