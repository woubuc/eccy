import { Class, WritableDeep } from 'type-fest';
import { Resource } from '../resource/resource.js';
import { worldInstance } from '../scoped.js';
import { InternalQuery } from './query.js';

/**
 * Query builder for a world resource
 */
export interface ResourceQueryBuilder<T extends Resource, TOut extends Resource> {
	/**
	 * Make the resource writable by this system
	 */
	writable(): ResourceQueryBuilder<T, WritableDeep<T>>;

	/**
	 * Finalise the query
	 */
	query(): ResourceQuery<TOut>;
}

export class ResourceQueryBuilderImpl<T extends Resource, TOut extends Resource> implements ResourceQueryBuilder<T, TOut> {
	private isWritable: boolean = false;

	public constructor(private readonly resource: Class<Resource>) {}

	public writable(): ResourceQueryBuilder<T, WritableDeep<T>> {
		this.isWritable = true;
		return this as any;
	}

	public query(): ResourceQuery<TOut> {
		return new ResourceQueryImpl(this.resource, this.isWritable) as any;
	}
}


/**
 * A queried world resource
 */
export interface ResourceQuery<T extends Resource> {
	/**
	 * @returns true if the resource has been modified since the last time this system
	 * was executed
	 */
	get isModified(): boolean;

	/**
	 * @returns the resource
	 */
	get(): T;
}

export class ResourceQueryImpl<T extends Resource> implements ResourceQuery<T>, InternalQuery {

	/**
	 * Whether the resource was modified since last execution
	 */
	public isModified: boolean = false;

	/**
	 * Whether the resource was accessed during the current execution
	 */
	private wasAccessed: boolean = false;

	private readonly resourceData: T;

	private world = worldInstance.get();

	public constructor(
		private readonly resourceClass: Class<T>,
		public readonly isWritable: boolean,
	) {
		this.resourceData = this.world.resources.addQuery(this, resourceClass);
	}

	public get(): T {
		this.wasAccessed = true;
		return this.resourceData;
	}

	public beforeSystem(): void {
		this.wasAccessed = false;
	}

	public afterSystem(): void {
		if (this.wasAccessed && this.isWritable) {
			this.world.resources.markModified(this.resourceClass);
		}

		this.isModified = false;
	}

	public markModified() {
		this.isModified = true;
	}
}
