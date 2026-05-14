import type { MigrationFn, MigrationParams } from "../open/types.js";
import type { MigratorStep } from "./types.js";

export const migrator =
	(steps: MigratorStep[]): MigrationFn =>
	(params: MigrationParams): void => {
		const { oldVersion, newVersion } = params.event;
		if (newVersion === null) return;
		for (const step of getSteps(steps, oldVersion, newVersion)) {
			step.migration(params);
		}
	};

const getSteps = (
	steps: MigratorStep[],
	from: number,
	to: number,
): MigratorStep[] =>
	steps
		.filter((s) => s.forVersion > from && s.forVersion <= to)
		.sort((a, b) => a.forVersion - b.forVersion);

export type { MigratorStep } from "./types.js";
