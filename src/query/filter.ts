import { Class, Constructor } from 'type-fest';
import { componentRegistry } from '../decorators/component.js';
import { EntityData } from '../engine/entity.js';
import { ComponentId, EntityId } from '../engine/id.js';
import { ComponentMask } from '../helpers/component-mask.js';
import { QuerySelector } from './selector.js';


/**
 * A query filter runs on the entities for a query and determines which
 * entities should be included in the query.
 */
export abstract class QueryFilter {
	protected readonly componentId: ComponentId;

	public constructor(component: Class<any>) {
		this.componentId = componentRegistry.lookupId(component);
	}

	/**
	 * Filters the entity
	 *
	 * @param entity - The entity data
	 * @param id - The unique entity ID
	 *
	 * @returns true if the entity satisfies the filter, false if it should be excluded from the query.
	 */
	public abstract filter(entity: EntityData, id: EntityId): boolean;
}

/**
 * Basic component filter
 */
export class BasicFilter extends QueryFilter {
	public filter(entity: EntityData): boolean {
		return entity.componentMask.includes(this.componentId);
	}
}

/**
 * Returns entities that do not have a given component
 */
export class WithoutFilter extends QueryFilter {
	public filter(entity: EntityData): boolean {
		return !entity.componentMask.includes(this.componentId);
	}

}
