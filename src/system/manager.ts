import { Class } from 'type-fest';
import { EccyLogger } from '../logger.js';
import { initialisingSystem, systemLogger } from '../scoped.js';
import { getSystemConfig } from './config.js';
import { System } from './system.js';

/**
 * Manages the loaded ECS systems
 */
export class SystemsManager implements Iterable<System> {

	private logger: EccyLogger;
	private ordered: System[] = [];

	private areRunOnceSystemsCleared: boolean = false;

	public constructor(rootLogger: EccyLogger, systems: Set<Class<System>>) {
		this.logger = rootLogger.child('systems');
		this.logger.info(`Loading ${ systems.size } systems`);

		let added = new Set<Class<System>>();
		let ordered: Class<System>[] = [];

		this.logger.trace('Creating ordered system graph');
		for (let system of systems) {
			let config = getSystemConfig(system);
			for (let dependency of config.runAfter) {
				if (added.has(dependency)) {
					continue;
				}

				if (!systems.has(dependency)) {
					throw new MissingSystemDependency(system, dependency);
				}

				systems.delete(dependency);
				ordered.push(dependency);
			}

			ordered.push(system);
		}

		for (let S of ordered) {
			let sys = this.initialiseSystem(S);
			this.ordered.push(sys);
		}
	}

	public [Symbol.iterator](): Iterator<System> {
		return this.ordered[Symbol.iterator]();
	}

	private initialiseSystem<T extends System>(S: Class<T>): T {
		this.logger.trace('Initialising system', { system: S.name });

		// We initialise an entirely new logger for systems instead of
		// descending from the root logger, because the system logger will be
		// used by end-users in their systems. We want their output to be
		// visible regardless of the configured log level for internals.
		let logger = new EccyLogger(`system:${ S.name }`);
		return systemLogger.runWith(logger, () => {
			return initialisingSystem.runWith(S, () => new S());
		});
	}

	// TODO figure out a better way to handle run-once/startup systems
	public clearRunOnceSystems(): void {
		if (this.areRunOnceSystemsCleared) {
			return;
		}

		this.ordered = this.ordered.filter(s => {
			let conf = getSystemConfig(s.constructor as Class<System>);
			return !conf.runOnce;
		});

		this.areRunOnceSystemsCleared = true;
	}
}


export class MissingSystemDependency extends Error {
	public constructor(system: Class<System>, missing: Class<System>) {
		super(`Missing system ${ missing.name } (required by ${ system.name }). Did you forget to add it to the engine?`);
	}
}
