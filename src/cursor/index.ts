export async function* iterateCursor<C extends IDBCursor>(
	request: IDBRequest<C | null>,
): AsyncGenerator<C> {
	let resolveNext!: (value: C | null) => void;
	let rejectNext!: (reason: unknown) => void;

	const onSuccess = () => resolveNext(request.result as C | null);
	const onError = () => rejectNext(request.error);

	request.addEventListener("success", onSuccess);
	request.addEventListener("error", onError);

	const arm = () =>
		new Promise<C | null>((resolve, reject) => {
			resolveNext = resolve;
			rejectNext = reject;
		});

	try {
		let pending = arm();
		while (true) {
			const cursor = await pending;
			if (!cursor) return;

			pending = arm();
			yield cursor;
			cursor.continue();
		}
	} finally {
		request.removeEventListener("success", onSuccess);
		request.removeEventListener("error", onError);
	}
}
