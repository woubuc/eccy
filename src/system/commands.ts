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

	/**
	 * Remove the entire entity and all its components
	 */
	despawn(): void;
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


export class SystemEntityCommands implements EntityCommands {

	public pending: Command[] = [];

	public constructor(public readonly id: EntityId) {}

	public add(...components: any[]): this {
		this.pending.push(new AddComponentsCommand(this.id, components));
		return this;
	}

	public remove(...components: Class<any>[]): this {
		let componentIds = components.map(c => componentRegistry.lookupId(c));
		this.pending.push(new RemoveComponentsCommand(this.id, componentIds));
		return this;
	}

	public despawn(): void {
		this.pending.push(new DespawnEntityCommand(this.id));
	}
}


interface Command {
	execute(world: World): void;
}

class AddComponentsCommand implements Command {
	public constructor(
		private readonly entity: EntityId,
		private readonly components: any[],
	) {}

	public execute(world: World): void {
		for (let data of this.components) {
			let id = componentRegistry.lookupId(data.constructor);
			world.components.add(this.entity, id, data);
		}
	}
}

class RemoveComponentsCommand implements Command {
	public constructor(
		private readonly entity: EntityId,
		private readonly componentIds: ComponentId[],
	) {}
	public execute(world: World): void {
		for (let id of this.componentIds) {
			world.components.remove(this.entity, id);
		}
	}
}

class DespawnEntityCommand implements Command {
	public constructor(private readonly entity: EntityId) {}

	public execute(world: World): void {
		world.components.removeAll(this.entity);
	}
}
