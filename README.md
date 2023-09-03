# Eccy

[![npm](https://img.shields.io/npm/v/eccy?style=for-the-badge)](https://www.npmjs.com/package/eccy)

*Yet Another ECS Library*

## Status

Very experimental, early development. You probably shouldn't use this for any real stuff just yet.

## How to use

##### 1. Define a component

A component can be any class.

```ts
// Define a component
@component()
class Position {
  public constructor(
    public x: number,
    public y: number,
  ) {}
}
```

##### 2. Define some systems

```ts
class RenderSystem extends System {
  // Create your queries
  private positions = Query.entities()
    .select(Position)
    .query();

  public override run() {
    // Iterate over the query results
    for (let [position] of this.positions) {
      position.x++;
    }
  }
}

@system({ runOnce: true })
class StartupSystem extends System {
  public override run(cmd: Commands) {
    // Spawn a new entity with a component
    cmd.spawn(new Position(10, 12));
  }
}
```

##### 3. Configure the engine

```ts
let engine = new Engine()
  .system(StartupSystem, RenderSystem)
  .finalise();
```

##### 4. Ready, set, go!

```ts
await engine.run(60); // Try to run at 60 fps
```
