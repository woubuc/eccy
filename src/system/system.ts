import { Logger } from '../logger.js';
import { systemLogger } from '../scoped.js';
import { Commands } from './commands.js';

/**
 * Base class for systems
 */
export abstract class System {

	protected readonly logger: Logger = systemLogger.get();

	/**
	 * Called when the system runs
	 *
	 * @param cmd - Commands
	 */
	public abstract run(cmd: Commands): void;
}
