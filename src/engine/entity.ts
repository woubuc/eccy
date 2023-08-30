import { ComponentMask } from '../helpers/component-mask.js';
import { ComponentId, EntityId } from './id.js';

export interface EntityData {
	componentMask: ComponentMask;
	componentData: Map<ComponentId, any>,
}
