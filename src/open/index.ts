import { Database } from "../database/index.js";
import type { OpenParams } from "./types.js";

export async function open(params: OpenParams): Promise<Database> {
	const { name, version, migration } = params;
	const request = indexedDB.open(name, version);

	if (migration) {
		request.onupgradeneeded = (event) => {
			migration({ event, db: new Database(request.result) });
		};
	}

	const raw = await new Promise<IDBDatabase>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error(`db ${name} is blocked`));
	});

	return new Database(raw);
}

export type { MigrationFn, MigrationParams, OpenParams } from "./types.js";
