import { Constructor } from 'type-fest';

export class Registry<TId, TData> {

	private meta = new Map<TId, TData>();
	private classLookup = new Map<Constructor<any>, TId>();

	public constructor(
		private readonly typeName: string,
		private readonly decoratorExample: string,
	) {}

	public register(id: TId, constructor: Constructor<any>, meta: TData) {
		this.meta.set(id, meta);
		this.classLookup.set(constructor, id);
	}

	public lookup(constructor: Constructor<any>): TData {
		let id = this.lookupId(constructor);
		let meta = this.get(id);
		if (meta == undefined) {
			throw new NotRegisteredError(constructor.name, this.typeName, this.decoratorExample);
		}
		return meta;
	}

	public lookupId(constructor: Constructor<any>): TId {
		let id = this.classLookup.get(constructor);
		if (id == undefined) {
			throw new NotRegisteredError(constructor.name, this.typeName, this.decoratorExample);
		}
		return id;
	}

	public get(id: TId): TData | undefined {
		return this.meta.get(id);
	}

}

export class NotRegisteredError extends ReferenceError {
	public constructor(name: string, typeName: string, decoratorExample: string) {
		super(`Cannot find ${ typeName } '${ name }' in registry. Make sure to annotate any ${ typeName } class with the '${ decoratorExample }' decorator`);
	}
}
