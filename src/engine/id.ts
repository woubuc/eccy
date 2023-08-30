import { Opaque } from 'type-fest';

export type EntityId = Opaque<number, 'EntityId'>;

export type ComponentId = Opaque<number, 'ComponentId'>;

export class IdProvider<T extends number> {
	private counter: number = -1;

	public next(): T {
		let id = ++this.counter;
		return id as T;
	}
}
