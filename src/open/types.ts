import type { Database } from "../database/index.js";

export type MigrationParams = {
	readonly event: IDBVersionChangeEvent;
	readonly db: Database;
};

export type OpenParams = {
	readonly name: string;
	readonly version: number;
	readonly migration?: MigrationFn;
};

export type MigrationFn = (params: MigrationParams) => void;
