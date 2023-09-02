import { SetMap } from '@woubuc/multimap';
import onChange from 'on-change';
import { componentRegistry } from '../decorators/component.js';
import { ComponentId, EntityId } from '../engine/id.js';
import { ComponentMask } from '../helpers/component-mask.js';
import { EccyLogger } from '../logger.js';

export type ChangeHandler = (entity: EntityId, component: ComponentId) => void;

export class ComponentManager {

	private readonly logger: EccyLogger;

	private components: any[][] = [];
	private masks: ComponentMask[] = [];

	private changeHandlers = new SetMap<ComponentId, ChangeHandler>();
	private addHandlers = new SetMap<ComponentId, ChangeHandler>();
	private removeHandlers = new SetMap<ComponentId, ChangeHandler>();

	public constructor(rootLogger: EccyLogger) {
		this.logger = rootLogger.child('components');
	}

	public tryGet<T extends object>(entity: EntityId, component: ComponentId): T {
		return this.components[component]?.[entity];
	}

	public get<T extends object>(entity: EntityId, component: ComponentId): T {
		let data = this.components[component]?.[entity];

		if (data === undefined) {
			throw new MissingComponentError(entity, component);
		}

		return data;
	}

	public getMask(entity: EntityId): ComponentMask {
		let mask = this.masks[entity];

		if (mask === undefined) {
			throw new MissingEntityError(entity);
		}

		return mask;
	}

	private ensureArrays(entity: EntityId, component: ComponentId) {
		if (this.components[component] === undefined) {
			this.components[component] = [];
		}

		if (this.masks[entity] === undefined) {
			this.masks[entity] = new ComponentMask();
		}
	}

	public add(entity: EntityId, component: ComponentId, data: any) {
		this.ensureArrays(entity, component);

		this.components[component]![entity] = onChange(data, () => {
			this.onChange(entity, component);
		});
		this.masks[entity]!.set(component, true);

		this.onAdd(entity, component);
	}

	public remove(entity: EntityId, component: ComponentId) {
		this.ensureArrays(entity, component);

		delete this.components[component]![entity];
		this.masks[entity]!.set(component, false);

		this.onRemove(entity, component);
	}

	public registerChangeHandler(component: ComponentId, handler: ChangeHandler) {
		this.changeHandlers.add(component, handler);
	}

	private onChange(entity: EntityId, component: ComponentId) {
		for (let handler of this.changeHandlers.get(component)) {
			handler(entity, component);
		}
	}

	public registerAddHandler(component: ComponentId, handler: ChangeHandler) {
		this.addHandlers.add(component, handler);
	}

	private onAdd(entity: EntityId, component: ComponentId) {
		for (let handler of this.addHandlers.get(component)) {
			handler(entity, component);
		}
	}

	public registerRemoveHandler(component: ComponentId, handler: ChangeHandler) {
		this.removeHandlers.add(component, handler);
	}

	private onRemove(entity: EntityId, component: ComponentId) {
		for (let handler of this.removeHandlers.get(component)) {
			handler(entity, component);
		}
	}
}


export class MissingComponentError extends ReferenceError {
	public constructor(entity: EntityId, id: ComponentId) {
		let name = componentRegistry.get(id)?.constructor.name;
		super(`Entity #${ entity } does not have component ${ name }`);
	}
}


export class MissingEntityError extends ReferenceError {
	public constructor(entity: EntityId) {
		super(`Cannot get mask; entity #${ entity } does not exist`);
	}
}
