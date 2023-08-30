# Eccy
A very experimental ECS that you should probably not use.

## Development
- Node LTS probably
- Use [pnpm](https://pnpm.io/)
- Respect [editorconfig](https://editorconfig.org/) & existing code style
- Prefer [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

```shell
$ pnpm install
$ pnpm dev
```

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
  private data = this.query(q => q
    .select(Position), // We want all entities with a `Position` component
  );

  public override run() {
    // Iterate over the query results
    for (let [id, position] of this.data()) {
      position.x++;
      console.log('entity', id, 'at', position);
    }
  }
}


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
  // A startup system runs once on startup
  .startup(new StartupSystem())
  // Other systems run every tick
  .with(new RenderSystem());
```

##### 4. Ready, set, go!
```ts
engine.run(60); // Cause we want 60 fps
```
