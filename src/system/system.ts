import { Simplify } from 'type-fest';
import { World } from '../engine/world.js';
import { Query, QueryBuilder } from '../query/query.js';
import { Commands } from './commands.js';

/**
 * Base class for systems
 */
export abstract class System {

	private world?: World;

	protected query<T extends any[]>(build: (query: QueryBuilder) => QueryBuilder<T>): () => Generator<Simplify<T>> {
		let query = new Query();
		build(query);
		return () => {
			if (this.world == undefined) {
				throw new ReferenceError('world is undefined');
			}

			return query.execute(this.world) as any;
		};
	}

	public abstract run(cmd: Commands): void;

}
