import chalk from 'chalk';
import { format } from 'date-fns';
import stringifyObject from 'stringify-object';

/**
 * Log levels for the built-in logger
 */
export const enum LogLevel {
	/**
	 * Lowest log level - generally not recommended to have this enabled
	 *
	 * Use `Trace` for timings, details, and other minutiae that are
	 * occasionally useful when debugging specific things but that are
	 * generally too much for `Debug`.
	 */
	Trace = 0,

	/**
	 * Debug information and verbose output
	 */
	Debug = 1,

	/**
	 * Information about the high-level standard operation of the application
	 */
	Info = 2,

	/**
	 * Recoverable issues and things that should be brought to the
	 * developer's attention.
	 */
	Warning = 3,

	/**
	 * Unrecoverable problems in the application; generally implies the code
	 * cannot continue to run without intervention.
	 */
	Error = 4,
}

export type LogData = Record<string, any>;

export interface Logger {

	trace(message: string, data?: LogData): void;

	debug(message: string, data?: LogData): void;

	info(message: string, data?: LogData): void;

	warn(message: string, data?: LogData): void;

	error(message: string, data?: LogData): void;

}

function colourLevel(level: LogLevel) {
	switch (level) {
		case LogLevel.Trace:
			return chalk.grey('TRACE');
		case LogLevel.Debug:
			return 'DEBUG';
		case LogLevel.Info:
			return chalk.cyan('INFO ');
		case LogLevel.Warning:
			return chalk.yellow('WARN ');
		case LogLevel.Error:
			return chalk.red.bold('ERROR');
	}
}

let maxScopeLength = 0;

function padScope(scope: string): string {
	return scope + ' '.repeat(maxScopeLength - scope.length);
}

export class EccyLogger implements Logger {
	public constructor(
		private readonly scope: string,
		private readonly minLevel: LogLevel = LogLevel.Trace,
		private readonly data?: LogData,
	) {
		if (scope.length > maxScopeLength) {
			maxScopeLength = scope.length;
		}
	}

	private outputMessage(level: LogLevel, message: string, data?: LogData) {
		if (level < this.minLevel) {
			return;
		}

		let d = new Date();

		console.log(
			'%s %s %s %s %s',
			format(d, 'HH:mm:ss'),
			colourLevel(level),
			chalk.bold(padScope(this.scope)),
			chalk.grey('›'),
			message,
		);

		if (this.data !== undefined) {
			this.outputData(this.data);
		}
		if (data !== undefined) {
			this.outputData(data);
		}
	}

	private outputData(data: LogData) {
		let indentSize = (18 + maxScopeLength) + 2;
		for (let [k, v] of Object.entries(data)) {
			if (v === undefined) {
				continue;
			}

			if (typeof v === 'object') {
				v = stringifyObject(v, {
					indent: '  ',
					inlineCharacterLimit: Math.max(20, 80 - indentSize),
				});
			}

			console.log(
				'%s%s: %s',
				' '.repeat(indentSize),
				chalk.dim(k),
				chalk.cyan(v).replaceAll('\n', `\n${ ' '.repeat(indentSize) }`),
			);
		}
	}

	public trace(message: string, data?: LogData): void {
		this.outputMessage(LogLevel.Trace, message, data);
	}

	public debug(message: string, data?: LogData): void {
		this.outputMessage(LogLevel.Debug, message, data);
	}

	public info(message: string, data?: LogData): void {
		this.outputMessage(LogLevel.Info, message, data);
	}

	public warn(message: string, data?: LogData): void {
		this.outputMessage(LogLevel.Warning, message, data);
	}

	public error(message: string, data?: LogData): void {
		this.outputMessage(LogLevel.Error, message, data);
	}

	public child(scope: string, data?: LogData): EccyLogger {
		if (data != undefined || this.data != undefined) {
			data = Object.assign({}, this.data ?? {}, data ?? {});
		}

		return new EccyLogger(`${ this.scope }:${ scope }`, this.minLevel, data);
	}
}
