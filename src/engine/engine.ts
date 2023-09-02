import { Class } from 'type-fest';
import { EccyLogger, LogLevel } from '../logger.js';
import { Resource } from '../resource/resource.js';
import { worldInstance } from '../scoped.js';
import { SystemsManager } from '../system/manager.js';
import { System } from '../system/system.js';
import { Executor, ExecutorImpl } from './executor.js';
import { World } from './world.js';

/**
 * The ECS engine builder
 *
 * @example
 * ```
 * let engine = new Engine()
 *   .resource(MyResource)
 *   .system(MySystem, MyOtherSystem)
 *   .finalise();
 *
 * await engine.run(60);
 * ```
 */
export class Engine {
	private systems = new Set<Class<System>>();
	private resources = new Set<Class<Resource>>();

	private minLogLevel: LogLevel = LogLevel.Warning;

	/**
	 * Adds one or more systems to the engine
	 *
	 * The order systems are defined here does not guarantee any particular
	 * execution order. Use `runAfter` on your systems to define the ordering
	 * you need.
	 *
	 * @param systems - The systems to add
	 */
	public system(...systems: Class<System, []>[]): this {
		for (let system of systems) {
			if (this.systems.has(system)) {
				throw new DuplicateSystemError(system);
			}

			this.systems.add(system);
		}

		return this;
	}

	/**
	 * Adds a resource to the engine
	 *
	 * A resource is like a static singleton component. It isn't linked to an
	 * entity and only one copy can ever exist. You can use them to store
	 * global state that doesn't need to be manipulated/updated often but
	 * does need to be available across multiple systems.
	 *
	 * Resources are identified by their type. This means they must follow two
	 * basic rules:
	 * 1. A resource must be a class. Javascript does not provide a way to
	 *    distinguish between primitive types or between plain objects.
	 * 2. Each resource must be unique. The same class cannot be used twice.
	 *    However, child classes are considered unique types.
	 *
	 *  Resources are constructed and managed by the engine.
	 *
	 * @param resource - The resource class to add
	 *
	 * @example
	 * ```
	 * class MyResource extends Resource {}
	 *
	 * new Engine()
	 *   .resource(MyResource)
	 * ```
	 */
	public resource<T extends Resource>(resource: Class<T, []>): this {
		if (this.resources.has(resource)) {
			throw new DuplicateResourceError(resource);
		}

		this.resources.add(resource);
		return this;
	}

	/**
	 * Sets the minimum log level for ECS log output
	 *
	 * Eccy has a basic built-in logger, used to help narrow down bugs in the
	 * internals. For regular use, you should probably keep this set to the
	 * default (WARN).
	 *
	 * @param level - The minimum log level. All logging output below this
	 *                level will be skipped.
	 */
	public logLevel(level: LogLevel): this {
		this.minLogLevel = level;
		return this;
	}

	/**
	 * Finalises the engine and initialises the executor, which is responsible
	 * for scheduling and executing the systems.
	 */
	public finalise(): Executor {
		let logger = new EccyLogger('eccy', this.minLogLevel);
		logger.info('Starting up');

		// The world holds all state and is needed by all systems, queries, etc.
		// So we create the world first and then provide it in a scope for
		// everything else.
		let world = new World(logger, this.resources);

		return worldInstance.runWith(world, () => {
			let systems = new SystemsManager(logger, this.systems);

			return new ExecutorImpl(logger, world, systems);
		});
	}
}


/**
 * User tried adding a system that was already added
 */
export class DuplicateSystemError extends Error {
	public constructor(system: Class<System>) {
		super(`Cannot add system ${ system.name }: already added`);
	}
}

/**
 * User tried adding a resource that was already added
 */
export class DuplicateResourceError extends Error {
	public constructor(resource: Class<Resource, any>) {
		super(`Cannot add resource ${ resource.name }: already added`);
	}
}
