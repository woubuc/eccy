import { Class } from 'type-fest';
import { EccyLogger } from '../logger.js';
import { SystemCommands } from '../system/commands.js';
import { SystemsManager } from '../system/manager.js';
import { SystemQueries } from '../system/queries.js';
import { System } from '../system/system.js';
import { Scheduler } from './scheduler.js';
import { World } from './world.js';

export interface Executor {
	/**
	 * Runs the scheduler infinitely
	 */
	start(fps: number): Promise<void>;


	/**
	 * Runs the scheduled ECS systems once and then stops
	 */
	update(): void;
}

/**
 * Runs the ECS systems and manages the internal state
 */
export class ExecutorImpl implements Executor {

	private logger: EccyLogger;

	public constructor(
		rootLogger: EccyLogger,
		private readonly world: World,
		private readonly systems: SystemsManager,
	) {
		this.logger = rootLogger.child('executor');
		this.logger.debug('Initialising executor');
	}

	public async start(fps: number): Promise<void> {
		this.logger.info('Starting scheduler');
		let scheduler = new Scheduler(fps);

		while (true) {
			this.update();
			await scheduler.waitForNextTick();
		}
	}

	public update(): void {
		let cmd = new SystemCommands(this.world);

		for (let sys of this.systems) {
			let queries = SystemQueries.of(sys.constructor as Class<System>);

			for (let query of queries) {
				query.beforeSystem();
			}

			sys.run(cmd);

			for (let query of queries) {
				query.afterSystem();
			}

			this.world.applyPending(cmd);
		}

		this.systems.clearRunOnceSystems();
	}
}
