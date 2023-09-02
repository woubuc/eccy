import { Class } from 'type-fest';
import { ComponentManager } from '../component/manager.js';
import { componentRegistry } from '../decorators/component.js';
import { EccyLogger } from '../logger.js';
import { ResourceManager } from '../resource/manager.js';
import { Resource } from '../resource/resource.js';
import { SystemCommands } from '../system/commands.js';
import { EntityId, IdProvider } from './id.js';

/**
 * The world holds the state of the ECS runtime, and includes utilities to
 * create, serialise, and deserialise entities.
 */
export class World {

	private readonly logger: EccyLogger;

	private entityIds = new IdProvider<EntityId>();

	public readonly resources: ResourceManager;
	public readonly components: ComponentManager;

	public constructor(rootLogger: EccyLogger, resources: Set<Class<Resource>>) {
		this.logger = rootLogger.child('world');

		this.resources = new ResourceManager(rootLogger, resources);
		this.components = new ComponentManager(rootLogger);
	}

	/**
	 * Adds an empty entity to the world
	 */
	public createEmptyEntity(): EntityId {
		return this.entityIds.next();
	}

	/**
	 * Apply pending changes to the world
	 */
	public applyPending(cmd: SystemCommands) {
		for (let e of cmd.entities) {
			let entity = e.id;

			for (let change of e.pending) {
				if ('add' in change) {
					let id = componentRegistry.lookupId(change.add.constructor);
					this.components.add(entity, id, change.add);
					continue;
				}

				if ('remove' in change) {
					this.components.remove(entity, change.remove);
					continue;
				}
			}
		}

		cmd.entities = [];
	}
}

