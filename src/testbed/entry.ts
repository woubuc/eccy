import 'source-map-support/register.js';
import 'reflect-metadata';

import { component, System, Engine } from '../index.js';
import { Commands } from '../system/commands.js';

@component()
class Position {
	public constructor(public x: number, public y: number) {}
}


class RenderSystem extends System {

	private data = this.query(q => q.select(Position));

	public override run() {
		for (let [id, position] of this.data()) {
			position.x++;
			console.log('entity', id, 'at', position);
		}
	}
}


class StartupSystem extends System {
	public override run(cmd: Commands) {
		cmd.spawn(new Position(10, 12));
	}
}


await new Engine()
	.startup(new StartupSystem())
	.with(new RenderSystem())
	.run(4);
