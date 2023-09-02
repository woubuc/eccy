/**
 * Scoped global data
 *
 * @example
 * ```
 * let scope = new Scope<string>();
 *
 * function test() {
 *   return scope.get();
 * }
 *
 * scope.runWith('foo', test); // 'foo'
 *
 * test(); // OutOfScopeError
 * ```
 */
export class Scope<T = unknown> {
	/** Marks an empty scope */
	private static readonly SCOPE_EMPTY = Symbol('scope_empty');

	/** The current state */
	private state: T | typeof Scope.SCOPE_EMPTY = Scope.SCOPE_EMPTY;

	/**
	 * Initialises a new scope
	 *
	 * @param name - Human-readable scope name, used in error messages
	 */
	public constructor(private readonly name?: string) {}

	/**
	 * Runs a function with the given state
	 *
	 * @param state - State to provide
	 * @param fn - Function to run
	 */
	public runWith<TRes>(state: T, fn: () => TRes): TRes {
		let parentState = this.state;

		this.state = state;
		let res = fn();

		this.state = parentState;

		return res;
	}

	/**
	 * Gets the scoped.ts state
	 *
	 * @throws OutOfScopeError when called outside a scope
	 */
	public get(): T {
		if (this.state === Scope.SCOPE_EMPTY) {
			throw new OutOfScopeError(this.name);
		}

		return this.state;
	}
}


export class OutOfScopeError extends ReferenceError {
	public constructor(name?: string) {
		super(`Cannot get state for scope${ name === undefined ? '' : ` ${ name }`}: called outside of scope`);
	}
}
