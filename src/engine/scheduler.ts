export class Scheduler {
	private readonly msPerTick: number;
	private lastTick = -1;

	public constructor(fps: number) {
		this.msPerTick = 1_000 / fps;
	}

	public async waitForNextTick(): Promise<void> {
		if (this.lastTick < 0) {
			this.lastTick = Date.now();
		}

		let nextTick = this.lastTick + this.msPerTick;
		let timeRemaining = nextTick - Date.now();
		if (timeRemaining > 0) {
			await new Promise(resolve => setTimeout(resolve, timeRemaining));
		}

		this.lastTick += this.msPerTick;
	}
}
