import { Class, ReadonlyDeep } from 'type-fest';
import { Resource } from '../resource/resource.js';
import { EntityQueryBuilder, EntityQueryBuilderImpl } from './entity.js';
import { ResourceQueryBuilder, ResourceQueryBuilderImpl } from './resource.js';

/**
 * Start point for all system queries
 */
export class Query {
	/**
	 * Starts an entity query builder
	 */
	public static entities(): EntityQueryBuilder<[]> {
		return new EntityQueryBuilderImpl() as any; // TODO tighten up types
	}

	/**
	 * Starts a resource query builder
	 *
	 * @param resource - The resource to query
	 */
	public static resource<T extends Resource>(resource: Class<T>): ResourceQueryBuilder<T, ReadonlyDeep<T>> {
		return new ResourceQueryBuilderImpl(resource);
	}

	// We mark the constructor private cause the end user should not be
	// creating any instances of this class.
	//
	// noinspection JSUnusedLocalSymbols
	private constructor() {}
}

/**
 * Internal query API
 *
 * @internal
 */
export interface InternalQuery {
	/**
	 * Called immediately before the system is executed
	 */
	beforeSystem(): void;

	/**
	 * Called immediately after the system is executed
	 */
	afterSystem(): void;
}
