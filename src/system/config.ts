import { Class } from 'type-fest';
import { System } from './system.js';

const CONFIG_META_KEY: string = 'eccy:system';

export interface SystemConfig {
	/**
	 * True if this system should only run once, when starting the ECS engine
	 *
	 * Also known as a startup system.
	 */
	runOnce: boolean;

	/**
	 * All systems that must run before the current system in a stage
	 */
	runAfter: Class<System>[];
}

export function system(config: Partial<SystemConfig> = {}) {
	return function systemDecorator(target: Class<System, []>) {
		let data = getSystemConfig(target);
		Object.assign(data, config);

		Reflect.defineMetadata(CONFIG_META_KEY, data, target);
	};
}

export function getSystemConfig(system: Class<System>): SystemConfig {
	return Object.assign({
		runOnce: false,
		runAfter: [],
	}, Reflect.getMetadata(CONFIG_META_KEY, system) ?? {});
}
