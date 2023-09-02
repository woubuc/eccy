/**
 * @file The internal scopes
 *
 * Since these scopes are accessed from several files across the Eccy
 * codebase, we collect them into a single file. This helps keep an overview
 * of the possible state that's flowing around the library, but also - more
 * practically - helps prevent circular dependencies.
 */

import { Class } from 'type-fest';
import { World } from './engine/world.js';
import { Scope } from './helpers/scope.js';
import { EccyLogger } from './logger.js';
import { System } from './system/system.js';

/**
 * The current system class, provided during systems initialisation
 */
export const initialisingSystem = new Scope<Class<System>>('InitialisingSystem');


/**
 * The current system logger, provided during systems initialisation
 */
export const systemLogger = new Scope<EccyLogger>('SystemLogger');

/**
 * The world instance, provided during the initialisation of the ECS engine,
 * including system & query initialisation.
 */
export const worldInstance = new Scope<World>('WorldInstance');
