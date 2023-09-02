# Getting Started

This page contains a simple step-by-step introduction to Eccy, showing you how
to make your first components, systems, and queries.

## Prerequisites

- node 18 LTS
- typescript 5.1 or later
- [reflect-metadata](https://npmjs.com/package/reflect-metadata)

## Installation

Add Eccy to your project by installing the library as a dependency.

:::code-group

```sh [pnpm]
pnpm add eccy reflect-metadata
```

```sh [npm]
npm add eccy reflect-metadata
```

:::

Then at the very start of your code, import `reflect-metadata`. This is needed
for decorators to work.

```ts
import 'reflect-metadata';
```

## Components

A component in an ECS system amounts to nothing more than a collection of data.
Components don't have any logic and don't do anything on their own &mdash; but
we'll get to that later.

A component in Eccy is a simple class, annotated with the `@component()`
decorator:

```ts
import { component } from 'eccy';

@component()
class Name {
	public constructor(public name: string) {}
}
```

## Systems & Queries

Systems operate on components; this is where your logic lives.

A system in Eccy is a class that extends `System` and has, at the very least,
a `run()` method:

```ts
import { System } from 'eccy';

class GreetSystem extends System {
	public run(): void {

	}
}
```

Now for this system to do anything, we'll need to write a query. We'll tell the
ECS engine which components we need and it will return every entity with those
components.

:::details What is an entity?
It's common to think of entities as concrete objects, but in an ECS *entity*
simply refers to a collection of components. Entities don't have any form of
their own, other than a unique identifier.
:::

A simple entity query looks like this:

```ts
import { System, Query } from 'eccy';

class GreetSystem extends System {
	private query = Query.entities()  // [!code ++]
		.select(Name)  // [!code ++]
		.query();  // [!code ++]

	public run(): void {

	}
}
```

Using the `.select()` query, we've told the ECS engine which components we want
to see. Now let's do something with those `Name` components:

```ts
import { System, Query } from 'eccy';

class GreetSystem extends System {
	private query = Query.entities()
		.select(Name)
		.query();

	public run(): void {
		for (let [name] of this.query) {  // [!code ++]
			console.log('Hello,', name.name);  // [!code ++]
		}  // [!code ++]
	}
}
```

Great! Now let's run this system&hellip;


## The Engine
The starting point of any ECS application is the `Engine`. It lets us set up
all our systems, resources, and configuration in a convenient way:

```ts
import { Engine } from 'eccy';

let engine = new Engine()
	.system(GreetSystem)
	.finalise();
```

There, now we have an engine that contains our brand new system! All that's left
to do is start the engine:

```ts
import { Engine } from 'eccy';

let engine = new Engine()
	.system(GreetSystem)
	.finalise();

let fps = 10;  // [!code ++]
engine.start(fps);  // [!code ++]
```

Run the application, then look at the console output and&hellip; If you've done
this right, the application should start and then nothing else should happen.
That's because we have a system that operates on entities with the `Name`
component, but we haven't yet created any such entities!

## Startup systems
A startup system is a special type of system that runs only once, when the ECS
engine starts. We can use it to initialise some state:

```ts
import { system, System, Commands } from 'eccy';

@system({ runOnce: true })
class SpawnSystem extends System {
	public run(cmd: Commands): void {
		cmd.spawn(new Name('Rose Tyler'));
		cmd.spawn(new Name('Martha Jones'));
		cmd.spawn(new Name('Donna Noble'));
	}
}
```

A few new things here! For one, we've added the `@system()` decorator to provide
extra configuration for our system.

We've also added the `Commands` parameter in the `run()` method. Because of how
Eccy is designed, we don't manipulate the world directly. Instead, we issue
commands that get resolved *after* the system runs.

So in this system, we're issuing 3 commands, but those components are only
created in the engine *right after* the `run()` method is finished.

Now let's add this startup system to our engine:

```ts
let engine = new Engine()
	.system(SpawnSystem) // [!code ++]
	.system(GreetSystem)
	.finalise();
```

Let's run our application again and *voila*!


## Change detection
One more thing: our system keeps yelling the same names, over and over. Let's
add an `.added()` modifier to the query of our `GreetSystem`:

```ts
private query = Query.entities()
	.select(Name).added() // [!code ++]
	.query();
```

By doing this we've turned this query into a reactive query, which will only
include entities that have been changed since the last time the system ran.

Let's run our code again and see how it only logs the names once.

Note that the system still runs every tick, but the query results are empty
because there are no more entities that have just gotten a `Name` component.

:::details Code
If you want to double check your results, or if you've gotten stuck somewhere,
here is the entirety of the code we've just written:

```ts
import 'reflect-metadata';
import { Commands, component, Engine, Query, System, system } from 'eccy';

@component()
class Name {
	public constructor(public name: string) {}
}

class GreetSystem extends System {
	private query = Query.entities()
		.select(Name).added()
		.query();

	public run(): void {
		for (let [name] of this.query) {
			console.log('Hello,', name.name);
		}
	}
}

@system({ runOnce: true })
class SpawnSystem extends System {
	public run(cmd: Commands): void {
		cmd.spawn(new Name('Rose Tyler'));
		cmd.spawn(new Name('Martha Jones'));
		cmd.spawn(new Name('Donna Noble'));
	}
}

let engine = new Engine()
	.system(SpawnSystem)
	.system(GreetSystem)
	.finalise();

let fps = 10;
engine.start(fps);

```
:::
