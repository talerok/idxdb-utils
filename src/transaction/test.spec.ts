import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../database/index.js";
import { open } from "../open/index.js";

const DB_NAME = "transaction-done-db";

describe("Transaction.done", () => {
	let db: Database;

	beforeEach(async () => {
		db = await open({
			name: DB_NAME,
			version: 1,
			migration: ({ db }) => {
				db.createObjectStore("items", { keyPath: "id" });
			},
		});
	});

	afterEach(() => {
		db.close();
		indexedDB.deleteDatabase(DB_NAME);
	});

	it("creates a transaction without throwing (regression: this.raw must be set before done initializer)", () => {
		expect(() => db.transaction("items", "readwrite")).not.toThrow();
	});

	it("done resolves when the transaction completes", async () => {
		const tx = db.transaction("items", "readwrite");
		await tx.objectStore("items").add({ id: 1, name: "A" });
		await expect(tx.done).resolves.toBeUndefined();
	});

	it("done rejects when the transaction is explicitly aborted", async () => {
		const tx = db.transaction("items", "readwrite");
		tx.abort();
		await expect(tx.done).rejects.toThrow(/aborted/i);
	});
});
