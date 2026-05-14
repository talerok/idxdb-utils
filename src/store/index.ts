import { iterateCursor } from "../cursor/index.js";
import { promisifyRequest } from "../request/index.js";
import { Transaction } from "../transaction/index.js";

export type TypedCursor<T> = Omit<IDBCursorWithValue, "value"> & {
	readonly value: T;
};

export class ObjectStore<T = unknown> {
	constructor(public readonly raw: IDBObjectStore) {}

	get autoIncrement(): boolean {
		return this.raw.autoIncrement;
	}

	get indexNames(): DOMStringList {
		return this.raw.indexNames;
	}

	get keyPath(): string | string[] | null {
		return this.raw.keyPath;
	}

	get name(): string {
		return this.raw.name;
	}

	get transaction(): Transaction {
		return new Transaction(this.raw.transaction);
	}

	add(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return promisifyRequest(this.raw.add(value, key));
	}

	put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return promisifyRequest(this.raw.put(value, key));
	}

	get(query: IDBValidKey | IDBKeyRange): Promise<T | undefined> {
		return promisifyRequest(this.raw.get(query));
	}

	getAll(
		query?: IDBValidKey | IDBKeyRange | null,
		count?: number,
	): Promise<T[]> {
		return promisifyRequest(this.raw.getAll(query, count));
	}

	getKey(query: IDBValidKey | IDBKeyRange): Promise<IDBValidKey | undefined> {
		return promisifyRequest(this.raw.getKey(query));
	}

	getAllKeys(
		query?: IDBValidKey | IDBKeyRange | null,
		count?: number,
	): Promise<IDBValidKey[]> {
		return promisifyRequest(this.raw.getAllKeys(query, count));
	}

	count(query?: IDBValidKey | IDBKeyRange): Promise<number> {
		return promisifyRequest(this.raw.count(query));
	}

	delete(query: IDBValidKey | IDBKeyRange): Promise<undefined> {
		return promisifyRequest(this.raw.delete(query));
	}

	clear(): Promise<undefined> {
		return promisifyRequest(this.raw.clear());
	}

	cursor(
		query?: IDBValidKey | IDBKeyRange | null,
		direction?: IDBCursorDirection,
	): AsyncGenerator<TypedCursor<T>> {
		const cursor = this.raw.openCursor(query, direction);
		return iterateCursor(cursor);
	}

	keyCursor(
		query?: IDBValidKey | IDBKeyRange | null,
		direction?: IDBCursorDirection,
	): AsyncGenerator<IDBCursor> {
		const cursor = this.raw.openKeyCursor(query, direction);
		return iterateCursor(cursor);
	}

	index(name: string): IDBIndex {
		return this.raw.index(name);
	}

	createIndex(
		name: string,
		keyPath: string | string[],
		options?: IDBIndexParameters,
	): IDBIndex {
		return this.raw.createIndex(name, keyPath, options);
	}

	deleteIndex(name: string): void {
		this.raw.deleteIndex(name);
	}
}
