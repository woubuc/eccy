import { Class } from 'type-fest';
import { InternalQuery } from '../query/query.js';
import { System } from './system.js';

/**
 * Metadata key for the `SystemQueries` instance on a `System` class object
 */
const SYSTEM_QUERIES_KEY: string = 'eccy:system_queries';

/**
 * Holds the queries related to a system
 */
export class SystemQueries implements Iterable<InternalQuery> {

	/**
	 * Gets the system queries for the given class
	 *
	 * @param system - The system class
	 */
	public static of(system: Class<System>): SystemQueries {
		let queries = Reflect.getMetadata(SYSTEM_QUERIES_KEY, system);
		if (queries == undefined) {
			queries = new SystemQueries();
			Reflect.defineMetadata(SYSTEM_QUERIES_KEY, queries, system);
		}
		return queries;
	}

	private queries = new Set<InternalQuery>();

	private constructor() {}

	public [Symbol.iterator](): IterableIterator<InternalQuery> {
		return this.queries.values();
	}

	/**
	 * Attaches a query to this system
	 *
	 * @param query - The query to attach
	 */
	public attach(query: InternalQuery) {
		this.queries.add(query);
	}
}
