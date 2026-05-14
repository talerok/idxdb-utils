import { ObjectStore } from "../store/index.js";
import { Transaction } from "../transaction/index.js";

export class Database implements Disposable {
	constructor(public readonly raw: IDBDatabase) {}

	get name(): string {
		return this.raw.name;
	}

	get version(): number {
		return this.raw.version;
	}

	get objectStoreNames(): DOMStringList {
		return this.raw.objectStoreNames;
	}

	transaction(
		storeNames: string | string[],
		mode?: IDBTransactionMode,
		options?: IDBTransactionOptions,
	): Transaction {
		return new Transaction(this.raw.transaction(storeNames, mode, options));
	}

	createObjectStore<T = unknown>(
		name: string,
		options?: IDBObjectStoreParameters,
	): ObjectStore<T> {
		return new ObjectStore<T>(this.raw.createObjectStore(name, options));
	}

	deleteObjectStore(name: string): void {
		this.raw.deleteObjectStore(name);
	}

	close(): void {
		this.raw.close();
	}

	[Symbol.dispose](): void {
		this.raw.close();
	}
}
