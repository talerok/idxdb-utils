# idxdb-utils

Tiny typed facade over IndexedDB. Promise-based, generic over value types, with `using` / `await using` lifecycle support.

## Quick start

```ts
import { type MigrationFn, migrator, open } from "idxdb-utils";

type User = { id: number; name: string };

const v1Migration: MigrationFn = ({ db }) => {
  db.createObjectStore<User>("users", { keyPath: "id" });
};

const migration = migrator([
  {
    forVersion: 1,
    migration: v1Migration,
  },
]);

using db = await open({
  name: "app",
  version: 1,
  migration,
});

{
  await using tx = db.transaction("users", "readwrite");
  const users = tx.objectStore<User>("users");
  await users.put({ id: 1, name: "Alice" });
  await users.put({ id: 2, name: "Bob" });
} // ← auto-commit; commit/abort errors surface here

const tx = db.transaction("users", "readonly");
const alice = await tx.objectStore<User>("users").get(1); // User | undefined
```

## API

### `open(params): Promise<Database>`

Opens a database and returns the `Database` wrapper.

```ts
type OpenParams = {
  readonly name: string;
  readonly version: number;
  readonly migration?: MigrationFn;
};

type MigrationFn = (params: MigrationParams) => void;

type MigrationParams = {
  readonly event: IDBVersionChangeEvent;
  readonly db: Database;
};
```

The migration runs inside the IDB upgrade transaction. Keep it synchronous — awaiting non-IDB work auto-commits the upgrade transaction.

### `Database`

Wraps `IDBDatabase`. Implements `Disposable` — `using db = await open(...)` calls `close()` on scope exit.

| Member                                       | Returns                 |
| -------------------------------------------- | ----------------------- |
| `name`, `version`, `objectStoreNames`, `raw` | (same as `IDBDatabase`) |
| `transaction(storeNames, mode?, options?)`   | `Transaction`           |
| `createObjectStore<T>(name, options?)`       | `ObjectStore<T>`        |
| `deleteObjectStore(name)`                    | `void`                  |
| `close()`                                    | `void`                  |

### `Transaction`

Wraps `IDBTransaction`. Implements `AsyncDisposable` — `await using tx = db.transaction(...)` awaits `tx.done` on scope exit (so commit/abort errors propagate).

| Member                                                         | Returns                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `db`, `durability`, `error`, `mode`, `objectStoreNames`, `raw` | (same as `IDBTransaction`)                                             |
| `objectStore<T>(name)`                                         | `ObjectStore<T>`                                                       |
| `commit()`, `abort()`                                          | `void`                                                                 |
| `done`                                                         | `Promise<void>` — resolves on `complete`, rejects on `error` / `abort` |

### `ObjectStore<T>`

Wraps `IDBObjectStore`. Methods that return `IDBRequest<X>` are exposed as `Promise<X>`. Generic `T` is the value type.

| Member                                                  | Returns                               |
| ------------------------------------------------------- | ------------------------------------- |
| `name`, `keyPath`, `autoIncrement`, `indexNames`, `raw` | (same as `IDBObjectStore`)            |
| `transaction`                                           | `Transaction`                         |
| `add(value, key?)`, `put(value, key?)`                  | `Promise<IDBValidKey>`                |
| `get(query)`                                            | `Promise<T \| undefined>`             |
| `getAll(query?, count?)`                                | `Promise<T[]>`                        |
| `getKey(query)`                                         | `Promise<IDBValidKey \| undefined>`   |
| `getAllKeys(query?, count?)`                            | `Promise<IDBValidKey[]>`              |
| `count(query?)`                                         | `Promise<number>`                     |
| `delete(query)`, `clear()`                              | `Promise<undefined>`                  |
| `cursor(query?, direction?)`                            | `AsyncGenerator<TypedCursor<T>>`      |
| `keyCursor(query?, direction?)`                         | `AsyncGenerator<IDBCursor>`           |
| `index(name)`, `createIndex(...)`, `deleteIndex(name)`  | (same as `IDBObjectStore`)            |

`TypedCursor<T>` is `IDBCursorWithValue` with `value: T`. Iterate it with `for await`:

```ts
const tx = db.transaction("users", "readonly");
for await (const cursor of tx.objectStore<User>("users").cursor()) {
  console.log(cursor.value.name); // typed as User
}
```

Inside the loop, only `await` IDB operations. Awaiting non-IDB work between iterations lets the transaction auto-commit and the next `continue()` will throw.

### `migrator(steps): MigrationFn`

Builds a migration function from version-keyed steps. A step runs when `step.forVersion > event.oldVersion && step.forVersion <= event.newVersion`. Steps execute in ascending `forVersion` order.

```ts
type MigratorStep = {
  readonly forVersion: number;
  readonly migration: MigrationFn;
};
```

### `iterateCursor(request): AsyncGenerator<IDBCursor>`

Low-level building block behind `ObjectStore.cursor()` / `.keyCursor()`. Useful for iterating cursors opened on `IDBIndex` (which isn't wrapped):

```ts
const idx = store.raw.index("by-name");
for await (const cursor of iterateCursor(idx.openCursor())) {
  // ...
}
```

Auto-advances after each yield — do not call `cursor.continue()` yourself.

### `promisifyRequest(request): Promise<T>`

Low-level escape hatch — turns any `IDBRequest<T>` into a one-shot promise.

```ts
const result = await promisifyRequest(store.raw.add(value));
```

## Escape hatch

Every wrapper exposes `.raw` — the underlying `IDBDatabase` / `IDBTransaction` / `IDBObjectStore`. Reach for it when you need behavior the facade doesn't surface.

## License

MIT
