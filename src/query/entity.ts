/**
 * @file The specialised interfaces & types related to entity query builders
 * and entity queries.
 */

import { SetMap } from '@woubuc/multimap';
import { Class, ReadonlyDeep, Simplify } from 'type-fest';
import { Concat } from 'typescript-tuple';
import { componentRegistry } from '../decorators/component.js';
import { ComponentId, EntityId } from '../engine/id.js';
import { World } from '../engine/world.js';
import { ComponentMask } from '../helpers/component-mask.js';
import { initialisingSystem, worldInstance } from '../scoped.js';
import { SystemQueries } from '../system/queries.js';
import { InternalQuery } from './query.js';

/**
 * An entity query builder
 */
export interface EntityQueryBuilder<T extends any[]> {
	/**
	 * Include the entity ID in the query results
	 */
	selectId(): EntityQueryBuilder<Concat<T, [EntityId]>>;

	/**
	 * Select a component to be returned from the query
	 *
	 * An entity that doesn't have this component will be excluded from the
	 * query results.
	 *
	 * @param selector - Component class to match
	 */
	select<TAdd extends any>(selector: Class<TAdd>): EntitySelectQueryBuilder<T, TAdd, ReadonlyDeep<TAdd>>;

	/**
	 * Require that the entity has all these components
	 *
	 * @param components - One or more component classes
	 */
	hasAll(...components: Class<any>[]): EntityQueryBuilder<T>;

	/**
	 * Require that the entity has at least one of these components
	 *
	 * @param components - One or more component classes
	 */
	hasSome(...components: Class<any>[]): EntityQueryBuilder<T>;

	/**
	 * Require that the entity has none of these components
	 *
	 * @param components - One or more components classes
	 */
	hasNone(...components: Class<any>[]): EntityQueryBuilder<T>;

	/**
	 * Finalises the query
	 */
	query(): EntityQuery<Simplify<T>>;
}

/**
 * Entity query builder extensions for adding modifiers to selected components
 */
export interface EntitySelectQueryBuilder<T extends any[], TField, TOut> extends EntityQueryBuilder<Concat<T, [TOut]>> {
	/**
	 * Mark the selected component as optional
	 *
	 * If an entity that further matches all other filters does not have this component, it will be included in the query results with `undefined` in place of this field
	 */
	optional(): EntitySelectQueryBuilder<T, TField | undefined, TField | undefined>;

	/**
	 * Make the selected component writable by the system
	 */
	writable(): EntitySelectQueryBuilder<T, TField, TField>;

	/**
	 * Instead of returning all entities with the selected component, only
	 * return entities where the component has changed since the last time
	 * the system was executed.
	 */
	changed(): EntitySelectQueryBuilder<T, TField, TOut>;

	/**
	 * Instead of returning all entities with the selected component, only
	 * return entities that had this component added since the last time
	 * the system was executed.
	 */
	added(): EntitySelectQueryBuilder<T, TField, TOut>;

	/**
	 * Instead of returning all entities with the selected component, only
	 * return entities that had this component removed since the last time
	 * the system was executed.
	 */
	removed(): EntitySelectQueryBuilder<T, TField, TOut>;
}


/**
 * Extracts a component from an entity
 *
 * @returns the component value or `SELECT_IGNORE` if the entity does not meet the requirements
 */
type Extractor = (id: EntityId, world: World) => any;

/**
 * Constructs an extractor for a single component in a query
 */
class QueryComponent {
	/** True if the component is optional */
	public optional: boolean = false;

	/** True if the entity should only be included if the component was changed */
	public changed: boolean = false;

	/** True if the entity should only be included if the component was just added */
	public added: boolean = false;

	/** True if the entity should only be included if the component was just removed */
	public removed: boolean = false;

	public get isReactive(): boolean {
		return this.changed || this.added || this.removed;
	}

	public constructor(public readonly component: ComponentId) {}

	/**
	 * Constructs a configured extractor
	 */
	public getExtractor(): Extractor {
		return this.extractor.bind(null, this.component, this.optional);
	}

	private extractor(
		componentId: ComponentId,
		isOptional: boolean,
		entityId: EntityId,
		world: World,
	): any {
		if (isOptional) {
			return world.components.tryGet(entityId, componentId);
		} else {
			return world.components.get(entityId, componentId);
		}
	}
}

interface ComponentWatchStatus {
	changed: boolean;
	added: boolean;
	removed: boolean;
}

export class EntityQueryBuilderImpl<T extends any[] = [], TField = void, TOut = void> implements EntitySelectQueryBuilder<T, TField, TOut> {
	private includesMask = new ComponentMask();
	private excludesMask = new ComponentMask();
	private includesSomeMasks: ComponentMask[] = [];

	private watchers = new Map<ComponentId, ComponentWatchStatus>();

	private queriedComponents = new Set<ComponentId>();
	private extractors: Extractor[] = [];

	private current: QueryComponent | null = null;

	private finaliseCurrent() {
		if (this.current != null) {
			if (!this.current.optional && !this.current.isReactive) {
				this.includesMask.set(this.current.component, true);
			}

			this.queriedComponents.add(this.current.component);
			this.extractors.push(this.current.getExtractor());

			if (this.current.isReactive) {
				this.watchers.set(this.current.component, {
					added: this.current.added,
					removed: this.current.removed,
					changed: this.current.changed,
				});
			}
		}

		this.current = null;
	}


	public selectId(): EntityQueryBuilder<Concat<Concat<T, [TOut]>, [EntityId]>> {
		this.extractors.push((id) => id);
		return this as any;
	}

	public select<TAdd extends any>(selector: Class<TAdd>): EntitySelectQueryBuilder<Concat<T, [TOut]>, TAdd, ReadonlyDeep<TAdd>> {
		this.finaliseCurrent();
		this.current = new QueryComponent(componentRegistry.lookupId(selector));
		return this as any;
	}

	public hasAll(...components: Class<any>[]): EntityQueryBuilder<Concat<T, [TOut]>> {
		for (let c of components) {
			let id = componentRegistry.lookupId(c);
			this.includesMask.set(id, true);
		}
		return this as any;
	}

	public hasSome(...components: Class<any>[]): EntityQueryBuilder<Concat<T, [TOut]>> {
		let mask = new ComponentMask();
		for (let c of components) {
			let id = componentRegistry.lookupId(c);
			mask.set(id, true);
		}
		this.includesSomeMasks.push(mask);
		return this as any;
	}

	public hasNone(...components: Class<any>[]): EntityQueryBuilder<Concat<T, [TOut]>> {
		for (let c of components) {
			let id = componentRegistry.lookupId(c);
			this.excludesMask.set(id, true);
		}
		return this as any;
	}


	public optional(): EntitySelectQueryBuilder<T, TField | undefined, TField | undefined> {
		if (this.current == null) {
			throw new NoCurrentComponentError();
		}

		this.current.optional = true;
		return this as any;
	}

	public writable(): EntitySelectQueryBuilder<T, TField, TField> {
		if (this.current == null) {
			throw new NoCurrentComponentError();
		}

		// Writable is currently only used for the return types of the public
		// query API; Every component is considered writable by the engine.
		// Later on we might use this information for things like more
		// efficient scheduling, parallelisation/multithreading, and other
		// optimisations.

		return this as any;
	}


	public changed(): EntitySelectQueryBuilder<T, TField, TOut> {
		if (this.current == null) {
			throw new NoCurrentComponentError();
		}

		this.current.changed = true;
		return this as any;
	}

	public added(): EntitySelectQueryBuilder<T, TField, TOut> {
		if (this.current == null) {
			throw new NoCurrentComponentError();
		}

		this.current.added = true;
		return this as any;
	}

	public removed(): EntitySelectQueryBuilder<T, TField, TOut> {
		if (this.current == null) {
			throw new NoCurrentComponentError();
		}

		this.current.removed = true;
		return this as any;
	}


	public query(): EntityQuery<Simplify<Concat<T, [TOut]>>> {
		this.finaliseCurrent();

		let hasWatchers = this.watchers.size > 0;

		if (hasWatchers) {
			return new ReactiveEntityQuery(
				this.includesMask,
				this.excludesMask,
				this.includesSomeMasks,
				this.extractors,
				this.watchers,
			);
		} else {
			return new StaticEntityQuery(
				this.includesMask,
				this.excludesMask,
				this.includesSomeMasks,
				this.extractors,
				this.queriedComponents,
			);
		}
	}
}


export interface EntityQuery<T extends any[]> {
	/**
	 * The number of entities in the query
	 */
	get count(): number;

	/**
	 * Iterates over all entities in the query result
	 *
	 * The order of entities in a query result is not guaranteed.
	 */
	[Symbol.iterator](): Iterator<T>;

	/**
	 * Gets a single entity from the query result
	 *
	 * @param id - Entity ID
	 *
	 * @returns the query results for the given entity, or `undefined` if the
	 *          entity is not in the query results.
	 */
	get(id: EntityId): T | undefined;
}

export abstract class EntityQueryImpl<T extends any[]> implements EntityQuery<T>, InternalQuery {

	protected entities = new Map<EntityId, T>();

	protected readonly world = worldInstance.get();

	public get count(): number {
		return this.entities.size;
	}

	public [Symbol.iterator](): Iterator<T> {
		return this.entities.values();
	}

	protected constructor(
		protected readonly includesMask: ComponentMask,
		protected readonly excludesMask: ComponentMask,
		protected readonly includesSomeMasks: ComponentMask[],
		protected readonly extractors: Extractor[],
	) {
		let system = initialisingSystem.get();
		SystemQueries.of(system).attach(this);
	}

	public beforeSystem(): void {}

	public afterSystem(): void {}

	public get(entity: EntityId): T | undefined {
		return this.entities.get(entity);
	}

	protected addEntity(entity: EntityId) {
		let components = [];
		for (let extract of this.extractors) {
			let component = extract(entity, this.world);
			components.push(component);
		}

		this.entities.set(entity, components as T);
	}

	protected removeEntity(entity: EntityId) {
		this.entities.delete(entity);
	}

	/**
	 * Tests the given entity against the filter masks of this query
	 *
	 * @param entity - Entity to test
	 *
	 * @returns true if the entity matches the query filters
	 */
	protected testMasks(entity: EntityId): boolean {
		let mask = this.world.components.getMask(entity);

		return mask.includesAll(this.includesMask)
			&& mask.excludesAll(this.excludesMask)
			&& this.includesSomeMasks.every(m => mask.includesSome(m));
	}
}

/**
 * Basic query type
 *
 * A static query filters entities by their components and updates its results
 * only when components are added or removed from relevant entities.
 */
export class StaticEntityQuery<T extends any[]> extends EntityQueryImpl<T> {

	public constructor(
		includesMask: ComponentMask,
		excludesMask: ComponentMask,
		includesSomeMasks: ComponentMask[],
		extractors: Extractor[],
		components: Set<ComponentId>,
	) {
		super(includesMask, excludesMask, includesSomeMasks, extractors);

		let handler = this.onComponentAddedOrRemoved.bind(this);
		for (let id of components) {
			this.world.components.registerAddHandler(id, handler);
			this.world.components.registerRemoveHandler(id, handler);
		}
	}

	private onComponentAddedOrRemoved(entity: EntityId) {
		if (this.testMasks(entity)) {
			this.addEntity(entity);
		} else {
			this.removeEntity(entity);
		}
	}
}

/**
 * A change detection query
 *
 * Reactive queries rebuild their results every tick as they watch for not just
 * added/removed components but also changes in existing components.
 */
export class ReactiveEntityQuery<T extends any[]> extends EntityQueryImpl<T> {

	private pendingEntities = new SetMap<EntityId, ComponentId>();

	public constructor(
		includesMask: ComponentMask,
		excludesMask: ComponentMask,
		includesSomeMasks: ComponentMask[],
		extractors: Extractor[],
		private readonly watchers: Map<ComponentId, ComponentWatchStatus>,
	) {
		super(includesMask, excludesMask, includesSomeMasks, extractors);

		for (let [id, { added, removed, changed }] of watchers) {
			if (added) {
				this.world.components.registerAddHandler(id, this.onComponentAdded.bind(this));
			}
			if (removed) {
				this.world.components.registerRemoveHandler(id, this.onComponentRemoved.bind(this));
			}
			if (changed) {
				this.world.components.registerChangeHandler(id, this.onComponentChanged.bind(this));
			}
		}
	}

	private onComponentChanged(entity: EntityId, component: ComponentId) {
		this.updatePendingAndTryAdd(entity, component);
	}

	private onComponentAdded(entity: EntityId, component: ComponentId) {
		this.updatePendingAndTryAdd(entity, component);
	}

	private onComponentRemoved(entity: EntityId, component: ComponentId) {
		this.updatePendingAndTryAdd(entity, component);
	}

	private updatePendingAndTryAdd(entity: EntityId, component: ComponentId): void {
		if (!this.testMasks(entity)) {
			return;
		}

		this.pendingEntities.add(entity, component);

		let all = this.pendingEntities.get(entity);
		for (let id of this.watchers.keys()) {
			if (!all.has(id)) {
				return;
			}
		}

		this.pendingEntities.delete(entity);
		this.addEntity(entity);
	}

	public override afterSystem() {
		this.entities.clear();
	}
}


export class NoCurrentComponentError extends Error {
	public constructor() {
		super('Invalid state: no selected component');
	}
}
