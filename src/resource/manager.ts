import { SetMap } from '@woubuc/multimap';
import { Class } from 'type-fest';
import { EccyLogger } from '../logger.js';
import { ResourceQueryImpl } from '../query/resource.js';
import { Resource } from './resource.js';

export class ResourceManager {

	private readonly logger: EccyLogger;

	private resources = new Map<Class<Resource>, Resource>();
	private queries = new SetMap<Class<Resource>, ResourceQueryImpl<any>>();

	public constructor(
		rootLogger: EccyLogger,
		resources: Set<Class<Resource, []>>,
	) {
		this.logger = rootLogger.child('resources');

		for (let res of resources) {
			this.resources.set(res, this.initialiseResource(res));
		}
	}

	private initialiseResource<T extends Resource>(R: Class<T, []>): T {
		this.logger.trace('Initialising resource', { resource: R.name });

		return new R();
	}

	public get<T extends Resource>(resource: Class<T>): T {
		let res = this.resources.get(resource);
		if (res == undefined) {
			throw new MissingResourceError(resource);
		}

		return res as T;
	}

	public addQuery<T extends Resource>(query: ResourceQueryImpl<T>, resource: Class<T>): T {
		this.queries.add(resource, query);
		return this.get(resource);
	}

	public markModified<T extends Resource>(resourceClass: Class<T>) {
		for (let query of this.queries.get(resourceClass)) {
			query.markModified();
		}
	}
}

export class MissingResourceError extends ReferenceError {
	public constructor(resource: Class<Resource, any>) {
		super(`Cannot find resource ${ resource.name }. Don't forget to add your resources to the engine.`);
	}
}
