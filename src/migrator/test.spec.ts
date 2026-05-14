import { describe, expect, it, vi } from "vitest";
import type { Database } from "../database/index.js";
import type { MigrationParams } from "../open/types.js";
import { migrator } from "./index.js";

const makeParams = (
	oldVersion: number,
	newVersion: number | null,
): MigrationParams => ({
	event: { oldVersion, newVersion } as unknown as IDBVersionChangeEvent,
	db: {} as Database,
});

describe("migrator", () => {
	it("runs only steps whose forVersion is in (oldVersion, newVersion]", () => {
		const calls: number[] = [];
		const run = migrator([
			{ forVersion: 1, migration: () => calls.push(1) },
			{ forVersion: 2, migration: () => calls.push(2) },
			{ forVersion: 3, migration: () => calls.push(3) },
			{ forVersion: 4, migration: () => calls.push(4) },
		]);

		run(makeParams(0, 3));

		expect(calls).toEqual([1, 2, 3]);
	});

	it("runs steps in ascending forVersion order regardless of input order", () => {
		const calls: number[] = [];
		const run = migrator([
			{ forVersion: 3, migration: () => calls.push(3) },
			{ forVersion: 1, migration: () => calls.push(1) },
			{ forVersion: 4, migration: () => calls.push(4) },
			{ forVersion: 2, migration: () => calls.push(2) },
		]);

		run(makeParams(0, 4));

		expect(calls).toEqual([1, 2, 3, 4]);
	});

	it("skips steps at or below oldVersion when upgrading", () => {
		const calls: number[] = [];
		const run = migrator([
			{ forVersion: 1, migration: () => calls.push(1) },
			{ forVersion: 2, migration: () => calls.push(2) },
			{ forVersion: 3, migration: () => calls.push(3) },
		]);

		run(makeParams(1, 3));

		expect(calls).toEqual([2, 3]);
	});

	it("does nothing when newVersion is null", () => {
		const step = vi.fn();
		const run = migrator([{ forVersion: 1, migration: step }]);

		run(makeParams(0, null));

		expect(step).not.toHaveBeenCalled();
	});

	it("does nothing when there are no matching steps", () => {
		const calls: number[] = [];
		const run = migrator([
			{ forVersion: 1, migration: () => calls.push(1) },
			{ forVersion: 5, migration: () => calls.push(5) },
		]);

		run(makeParams(1, 4));

		expect(calls).toEqual([]);
	});

	it("forwards params to each step migration", () => {
		const params = makeParams(0, 2);
		const seen: MigrationParams[] = [];
		const run = migrator([
			{ forVersion: 1, migration: (p) => seen.push(p) },
			{ forVersion: 2, migration: (p) => seen.push(p) },
		]);

		run(params);

		expect(seen).toEqual([params, params]);
	});
});
