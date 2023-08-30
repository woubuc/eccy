import type { Constructor } from 'type-fest';
import { ComponentId, IdProvider } from '../engine/id.js';
import { Registry } from './registry.js';

// ID provider for the component types
const ids = new IdProvider<ComponentId>();

export const componentRegistry = new Registry<ComponentId, ComponentMeta<any>>('component', '@component()');

/**
 * Component configuration
 */
export interface ComponentConfig {
	// Options will go here
}

/**
 * Metadata attached to components
 */
export interface ComponentMeta<T> {
	id: ComponentId;
	constructor: Constructor<T>;
	config: ComponentConfig;
}

/**
 * Decorates an ECS component
 *
 * @param config - the component configuration
 */
export function component(config: ComponentConfig = {}) {
	return function componentDecorator<T>(constructor: Constructor<T>) {
		let id = ids.next();
		let meta: ComponentMeta<T> = { id, config, constructor };

		componentRegistry.register(id, constructor, meta);
		console.log('Registered component %s', constructor.name);
	};
}
