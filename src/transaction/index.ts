import { ObjectStore } from "../store/index.js";

export class Transaction implements AsyncDisposable {
	readonly raw: IDBTransaction;
	readonly done: Promise<void>;

	constructor(raw: IDBTransaction) {
		this.raw = raw;
		this.done = new Promise<void>((resolve, reject) => {
			raw.addEventListener("complete", () => resolve());
			raw.addEventListener("error", (e) => reject(errorOf(raw, e)));
			raw.addEventListener("abort", (e) => reject(errorOf(raw, e)));
		});
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.done;
	}

	get db(): IDBDatabase {
		return this.raw.db;
	}

	get durability(): IDBTransactionDurability {
		return this.raw.durability;
	}

	get error(): DOMException | null {
		return this.raw.error;
	}

	get mode(): IDBTransactionMode {
		return this.raw.mode;
	}

	get objectStoreNames(): DOMStringList {
		return this.raw.objectStoreNames;
	}

	objectStore<T = unknown>(name: string): ObjectStore<T> {
		return new ObjectStore<T>(this.raw.objectStore(name));
	}

	abort(): void {
		this.raw.abort();
	}

	commit(): void {
		this.raw.commit();
	}
}

function errorOf(tr: IDBTransaction, event: Event) {
	if (tr.error) return tr.error;
	const target = event.target as IDBRequest;
	if (target?.error) return target.error;
	return new Error("Transaction aborted");
}
