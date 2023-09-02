import test from 'ava';
import { ComponentId } from '../engine/id.js';
import { ComponentMask } from './component-mask.js';

const a = 1 as ComponentId;
const b = 2 as ComponentId;
const c = 3 as ComponentId;
const d = 4 as ComponentId;

test('set', t => {
	let mask = new ComponentMask();
	t.false(mask.includes(a));

	mask.set(a, true);
	t.true(mask.includes(a));
});

test('with', t => {
	let mask = new ComponentMask();
	t.false(mask.includes(a));

	mask = mask.with(a);
	t.true(mask.includes(a));
});

test('includes', t => {
	let mask = new ComponentMask().with(a, b);
	t.true(mask.includes(a));
	t.true(mask.includes(b));
	t.false(mask.includes(c));
});

test('includesAll', t => {
	let mask = new ComponentMask().with(a, b);
	t.true(mask.includesAll(new ComponentMask().with(a, b)));
	t.false(mask.includesAll(new ComponentMask().with(a, c)));
});

test('includesSome', t => {
	let mask = new ComponentMask().with(a, b);
	t.true(mask.includesSome(new ComponentMask().with(a, b)));
	t.true(mask.includesSome(new ComponentMask().with(a, c)));
	t.false(mask.includesSome(new ComponentMask().with(c, d)));
});

test('excludesAll', t => {
	let mask = new ComponentMask().with(a, b);
	t.true(mask.excludesAll(new ComponentMask().with(c, d)));
	t.false(mask.excludesAll(new ComponentMask().with(b, c)));
	t.false(mask.excludesAll(new ComponentMask().with(a, b)));
});
