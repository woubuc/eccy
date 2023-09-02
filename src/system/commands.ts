import { Class } from 'type-fest';
import { componentRegistry } from '../decorators/component.js';
import { ComponentId, EntityId } from '../engine/id.js';
import { World } from '../engine/world.js';

/**
 * Game commands in a system
 *
 * Systems shouldn't manipulate the ECS world state directly. Instead, they
 * should use the Commands API to issue commands that get resolved after
 * system execution. This lets the ECS engine prepare queries and schedule
 * systems in a more optimised way.
 */
export interface Commands {
	/**
	 * Spawn a new entity
	 *
	 * @param components - The component bundle to spawn this entity with
	 */
	spawn(...components: any[]): EntityId;

	/**
	 * Access the entity commands for the given entity
	 *
	 * @param id - Entity ID
	 */
	entity(id: EntityId): EntityCommands;
}

/**
 * Entity commands in a system
 */
export interface EntityCommands {
	/**
	 * Add one or more components to an entity
	 */
	add(...components: any): this;

	/**
	 * Remove one or more components from an entity
	 */
	remove(...components: Class<any>[]): this;
}

export class SystemCommands implements Commands {
	public entities: SystemEntityCommands[] = [];

	public constructor(private readonly world: World) {}

	public spawn(...components: any[]): EntityId {
		let id = this.world.createEmptyEntity();
		this.entity(id).add(...components);
		return id;
	}

	public entity(id: EntityId): EntityCommands {
		let cmd = new SystemEntityCommands(id);
		this.entities.push(cmd);
		return cmd;
	}
}


type EntityChanges = { add: any } | { remove: ComponentId };

export class SystemEntityCommands implements EntityCommands {

	public pending: EntityChanges[] = [];

	public constructor(public readonly id: EntityId) {}

	public add(...components: any[]): this {
		for (let component of components) {
			this.pending.push({ add: component });
		}
		return this;
	}

	public remove(...components: Class<any>[]): this {
		for (let component of components) {
			let id = componentRegistry.lookupId(component);
			this.pending.push({ remove: id });
		}
		return this;
	}
}


