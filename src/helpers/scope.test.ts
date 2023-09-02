import test from 'ava';
import { OutOfScopeError, Scope } from './scope.js';

test('run', t => {
	let scope = new Scope<string>('scope');

	function run() {
		return scope.get();
	}

	t.assert(scope.runWith('test', run), 'test');
	t.assert(scope.runWith('test2', run), 'test2');
});


test('out of scope error', t => {
	let scope = new Scope('%foo%');

	let err = t.throws(() => scope.get(), { instanceOf: OutOfScopeError });
	t.assert(err?.message.includes('%foo%'));
});
