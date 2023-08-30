import { componentRegistry } from '../decorators/component.js';
import { ComponentMask } from '../helpers/component-mask.js';
import { SystemCommands } from '../system/commands.js';
import { EntityData } from './entity.js';
import { EntityId, IdProvider } from './id.js';

/**
 * The world holds the state of the ECS runtime, and includes utilities to
 * create, serialise, and deserialise entities.
 */
export class World {
	private entities: Map<EntityId, EntityData> = new Map();
	private entityIds = new IdProvider<EntityId>();

	/**
	 * Iterate over all entities in the world
	 */
	public iterateEntities(): IterableIterator<[EntityId, EntityData]> {
		return this.entities.entries();
	}

	/**
	 * Adds an empty entity to the world
	 */
	public addEntity(): EntityId {
		let id = this.entityIds.next();

		this.entities.set(id, {
			componentMask: new ComponentMask(),
			componentData: new Map(),
		});

		return id;
	}

	/**
	 * Apply pending changes to the world
	 */
	public applyPending(cmd: SystemCommands) {
		for (let e of cmd.entities) {
			let entity = this.entities.get(e.id);
			if (entity == undefined) {
				throw new ReferenceError('missing entity: ' + e.id);
			}

			for (let change of e.pending) {
				if ('add' in change) {
					let id = componentRegistry.lookupId(change.add.constructor);
					entity.componentData.set(id, change.add);
					entity.componentMask.set(id, true);
					continue;
				}

				if ('remove' in change) {
					entity.componentData.delete(change.remove);
					entity.componentMask.set(change.remove, false);
					continue;
				}
			}
		}

		cmd.entities = [];
	}
}
