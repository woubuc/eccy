import test from 'ava';
import { Resource } from '../resource/resource.js';
import { EntityQueryBuilderImpl } from './entity.js';
import { Query } from './query.js';
import { ResourceQueryBuilderImpl } from './resource.js';

test('entities', t => {
	t.assert(Query.entities() instanceof EntityQueryBuilderImpl);
});

test('resource', t => {
	class Test extends Resource {}

	t.assert(Query.resource(Test) instanceof ResourceQueryBuilderImpl);
});
