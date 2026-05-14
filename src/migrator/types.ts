import type { MigrationFn } from "../open/types.js";

export interface MigratorStep {
	readonly migration: MigrationFn;
	readonly forVersion: number;
}
