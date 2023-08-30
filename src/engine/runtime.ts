import { componentRegistry } from '../decorators/component.js';
import { ComponentMask } from '../helpers/component-mask.js';
import { SystemCommands } from '../system/commands.js';
import { System } from '../system/system.js';
import { EntityId } from './id.js';
import { World } from './world.js';

/**
 * The internal ECS runtime
 *
 * Houses all logic that shouldn't be exposed to end-users through the primary Engine API.
 */
export class Runtime {
	public world = new World();
	public systems: System[] = [];
	public startupSystems: System[] = [];

	private isStarted: boolean = false;

	public initialise() {
		let commands = new SystemCommands(this.world);
		for (let system of this.startupSystems) {
			Reflect.set(system, 'world', this.world);
			system.run(commands);

			this.world.applyPending(commands);
		}
		// We can get rid of the startup systems now
		this.startupSystems = [];

		for (let system of this.systems) {
			Reflect.set(system, 'world', this.world);
		}

		this.isStarted = true;
	}

	public tick() {
		if (!this.isStarted) {
			this.initialise();
		}

		let commands = new SystemCommands(this.world);

		for (let system of this.systems) {
			system.run(commands);

			this.world.applyPending(commands);
		}
	}
}
