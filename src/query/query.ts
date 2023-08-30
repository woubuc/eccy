import { Class } from 'type-fest';
import { Concat, ConcatMultiple } from 'typescript-tuple';
import { EntityId } from '../engine/id.js';
import { World } from '../engine/world.js';
import { BasicFilter, QueryFilter, WithoutFilter } from './filter.js';
import { BasicSelector, OptionalSelector, QuerySelector } from './selector.js';

/**
 * Select the entity even if it does not have the given component. In place of the component, `null` will be returned.
 * @param component
 */
export function optional<T>(component: Class<T>): QuerySelector<T | undefined> {
	return new OptionalSelector(component);
}

/**
 * Filter out all entities that have the given component
 *
 * @param component - Component to filter out
 */
export function not<T>(component: Class<T>): QueryFilter {
	return new WithoutFilter(component);
}

/**
 * The query builder API
 */
export interface QueryBuilder<TSelected extends any[] = [EntityId]> {
	/**
	 * Selects components to be returned from the query
	 *
	 * Entities without these components will be excluded from the results.
	 *
	 * @param selectors - One or more component classes
	 */
	select<TAdd extends any[]>(...selectors: SelectorList<TAdd>): QueryBuilder<Concat<TSelected, ConcatMultiple<[TAdd]>>>;

	/**
	 * Requires that the entity has these components
	 *
	 * @param filters - One or more component classes
	 */
	where(...filters: FilterList): this;
}

/**
 * A list of query selectors, or plain component constructors
 *
 * Component constructors get converted into basic selectors.
 */
type SelectorList<T extends any[]> = {
	[K in keyof T]: Class<T[K]> | QuerySelector<T[K]>;
}

/**
 * A list of query filters, or plain component constructors
 *
 * Component constructors get converted into basic filters.
 */
type FilterList = (Class<any> | QueryFilter)[];


export class Query<T extends any[] = [EntityId]> implements QueryBuilder<T> {
	public selectors: QuerySelector<any>[] = [];
	public filters: QueryFilter[] = [];

	public select<TAdd extends any[]>(...selectors: SelectorList<TAdd>): QueryBuilder<Concat<T, ConcatMultiple<[TAdd]>>> {
		this.selectors.push(...selectors.map(selectorOrComponent => {
			if (selectorOrComponent instanceof QuerySelector) {
				return selectorOrComponent;
			} else {
				return new BasicSelector(selectorOrComponent);
			}
		}));
		return this as any;
	}

	public where(...filters: FilterList): this {
		this.filters.push(...filters.map(filterOrComponent => {
			if (filterOrComponent instanceof QueryFilter) {
				return filterOrComponent;
			} else {
				return new BasicFilter(filterOrComponent);
			}
		}));

		return this;
	}

	public* execute(world: World): Generator<T> {
		for (let [id, entity] of world.iterateEntities()) {
			let satisfiesFilter = this.filters.every(f => f.filter(entity, id));
			if (!satisfiesFilter) {
				continue;
			}

			yield [id, ...this.selectors.map(s => s.select(entity, id))] as any;
		}
	}
}
