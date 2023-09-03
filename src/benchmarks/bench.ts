import 'reflect-metadata';
import Bench from 'tinybench';
import { Commands, component, Engine, Query, system, System } from '../index.js';

let bench = new Bench({
	warmupIterations: 20,
	time: 2_000,
});

bench.add('no-op', () => {});

@component()
class Counter {
	public constructor(public counter: number) {}
}

class StaticQuerySystem extends System {
	private query = Query.entities()
		.select(Counter)
		.query();

	public override run(): void {
		for (let [counter] of this.query) {

		}
	}
}

let staticNoChanges = new Engine().system(StaticQuerySystem).finalise();
bench.add('static query, no changes', () => staticNoChanges.update());


@system({ runOnce: true })
class SpawnOnceSystem extends System {
	public run(cmd: Commands): void {
		cmd.spawn(new Counter(0));
	}
}

class CountSystem extends System {
	private query = Query.entities()
		.select(Counter).writable()
		.query();

	public run(): void {
		for (let [counter] of this.query) {
			counter.counter++;
		}
	}
}

let staticCounter = new Engine().system(SpawnOnceSystem, CountSystem, StaticQuerySystem).finalise();
bench.add('static query, changes', () => staticCounter.update());


class SpawnSystem extends System {
	public override run(cmd: Commands): void {
		cmd.spawn(new Counter(1));
	}
}


let spawnOnly = new Engine().system(SpawnSystem).finalise();
bench.add('spawn', () => spawnOnly.update());


class DespawnSystem extends System {

	private query = Query.entities()
		.selectId()
		.select(Counter)
		.query();

	public run(cmd: Commands): void {
		for (let [id, component] of this.query) {
			cmd.entity(id).despawn();
		}
	}
}

let spawnDespawn = new Engine().system(SpawnSystem, DespawnSystem).finalise();
bench.add('spawn + despawn', () => spawnDespawn.update());

await bench.run();

console.table(bench.table());
