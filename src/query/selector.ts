import { Class } from 'type-fest';
import { componentRegistry } from '../decorators/component.js';
import { EntityData } from '../engine/entity.js';
import { ComponentId, EntityId } from '../engine/id.js';

export const SELECT_IGNORE = Symbol('skip entity (does not have required component for query)');

/**
 * A query selector runs on the entities for a query and extracts exactly
 * one component for the query results.
 */
export abstract class QuerySelector<T> {
	protected readonly componentId: ComponentId;

	public constructor(component: Class<T>) {
		this.componentId = componentRegistry.lookupId(component);
	}

	/**
	 * Gets the required component from the entity
	 *
	 * @param entity - The entity data
	 *
	 * @returns the component data, or `SELECT_IGNORE` if the entity does not
	 * satisfy the requirements for this selector and should be ignored.
	 */
	public abstract select(entity: EntityData, id: EntityId): T | typeof SELECT_IGNORE;
}

/**
 * Basic component selector
 */
export class BasicSelector<T> extends QuerySelector<T> {
	public select(entity: EntityData): typeof SELECT_IGNORE | T {
		return entity.componentData.get(this.componentId) ?? SELECT_IGNORE;
	}
}

/**
 * Optional component selector
 */
export class OptionalSelector<T> extends QuerySelector<T | undefined> {
	public select(entity: EntityData): T | undefined {
		return entity.componentData.get(this.componentId);
	}
}
