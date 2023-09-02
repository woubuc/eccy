import 'reflect-metadata';
import 'source-map-support/register.js';

import { Commands, component, Engine, LogLevel, Query, Resource, System, system } from '../index.js';

@component()
class Position {
	public constructor(
		public x: number,
		public y: number,
	) {}

	toString() {
		return `(${ this.x }, ${ this.y })`;
	}

	public static random(max: number) {
		return new Position(
			Math.round(Math.random() * max),
			Math.round(Math.random() * max),
		);
	}
}

@component()
class Person {
	public constructor(
		public speed: number,
	) {}
}

@component()
class Name {
	public constructor(
		public name: string,
	) {}
}

class Clock extends Resource {
	private _t = Date.now();

	public get startedAt(): number {
		return this._t;
	}

	public elapsed(): number {
		return Date.now() - this._t;
	}

	public reset(): void {
		this._t = Date.now();
	}
}

@system()
class LogicSystem extends System {
	public run(): void {}

}

@system({
	runAfter: [LogicSystem],
})
class MovePeopleSystem extends System {

	private people = Query.entities()
		.select(Position).writable()
		.select(Person)
		.select(Name).optional()
		.query();

	public override run() {
		this.logger.info('System run');

		if (this.people.count === 0) {
			this.logger.warn('No people found!');
		}

		for (let [position, person, name] of this.people) {
			position.x += person.speed;

			this.logger.debug('Character moved', { position });
		}
	}
}

@system({
	runOnce: true,
})
class StartupSystem extends System {
	public override run(cmd: Commands) {
		this.logger.info(`Spawning named entities`);

		cmd.spawn(new Name(`John Smith`));
	}
}

class RenameSystem extends System {
	private clock = Query.resource(Clock).query();

	private named = Query.entities()
		.select(Name).writable()
		.query();

	public override run(cmd: Commands) {
		let clock = this.clock.get();

		if (clock.elapsed() > 5_000) {
			clock.reset();

			for (let [name] of this.named) {
				name.name += ' +1';
			}

			this.logger.debug('Names updated');
		}
	}
}

@system({ runAfter: [RenameSystem] })
class HelloSystem extends System {
	private named = Query.entities()
		.select(Name).added().changed()
		.query();

	public override run() {
		if (this.named.count === 0) {
			this.logger.warn('No changed names');
		}

		for (let [name] of this.named) {
			this.logger.info(`Hello, ${ name.name }`);
		}
	}
}

let engine = new Engine()
	.logLevel(LogLevel.Trace)
	.resource(Clock)
	.system(
		StartupSystem,
		HelloSystem,
		RenameSystem,
	)
	.finalise();

await engine.start(1);
