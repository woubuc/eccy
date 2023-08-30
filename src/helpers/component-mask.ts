import { ComponentId } from '../engine/id.js';

/**
 * A simple bitmask to efficiently check whether an entity has all components for a query
 */
export class ComponentMask {
	private mask: number = 0;

	/**
	 * Sets or clears the component from the mask
	 *
	 * @param id - Component ID to update
	 * @param enabled - Whether the component is enabled
	 */
	public set(id: ComponentId, enabled: boolean) {
		if (enabled) {
			this.mask = this.mask | 1 << id;
		} else {
			this.mask = this.mask & ~(1 << id);
		}
	}

	public with(...ids: ComponentId[]): this {
		for (let id of ids) {
			this.set(id, true);
		}
		return this;
	}

	/**
	 * Checks if this mask includes the given component
	 *
	 * @param id - The component ID to check for
	 *
	 * @returns true if this mask contains the given components
	 */
	public includes(id: ComponentId): boolean {
		return (this.mask & (1 << id)) == (1 << id);
	}

	/**
	 * Tests if this mask includes all components
	 *
	 * @param other - Mask that should be included
	 *
	 * @returns true if this mask contains all components from `other`
	 */
	public includesAll(other: ComponentMask): boolean {
		return (this.mask & other.mask) == other.mask;
	}

	/**
	 * Tests if this mask includes some components
	 *
	 * @param other - Mask that should be included
	 *
	 * @returns true if this mask contains at least one component from `other`
	 */
	public includesSome(other: ComponentMask): boolean {
		return (this.mask & other.mask) != 0;
	}

	/**
	 * Tests if this mask excludes all components
	 *
	 * @param other - Mask that should be excluded
	 *
	 * @returns true if this mask contains none of the components from `other`
	 */
	public excludesAll(other: ComponentMask): boolean {
		return (this.mask & other.mask) == 0;
	}
}
