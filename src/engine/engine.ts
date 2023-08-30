import { System } from '../system/system.js';
import { Runtime } from './runtime.js';
import { Scheduler } from './scheduler.js';

/**
 * The primary entrypoint for the ECS engine
 */
export class Engine {
	private runtime: Runtime = new Runtime();

	/**
	 * Add one or more systems to the engine
	 *
	 * Currently, all systems are executed in the order they are added.
	 *
	 * @param systems - The systems to add
	 */
	public with(...systems: System[]): this {
		this.runtime.systems.push(...systems);
		return this;
	}

	/**
	 * Add one or more startup systems
	 *
	 * Startup systems run exactly once, before any other systems run.
	 *
	 * @param systems - The startup systems
	 */
	public startup(...systems: System[]): this {
		this.runtime.startupSystems.push(...systems);
		return this;
	}

	/**
	 * Starts a timed loop and runs the ECS systems
	 *
	 * @param fps - Desired frames per second
	 */
	public async run(fps: number): Promise<void> {
		let scheduler = new Scheduler(fps);

		while (true) {
			this.tick();
			await scheduler.waitForNextTick();
		}
	}

	/**
	 * Runs the ECS systems for a single tick
	 */
	public tick(): void {
		this.runtime.tick();
	}
}
