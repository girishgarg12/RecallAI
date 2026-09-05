export async function mapWithConcurrency(
    items,
    concurrency,
    asyncMapper
) {
    const results = new Array(items.length);

    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            results[index] = await asyncMapper(
                items[index],
                index
            );
        }
    }

    const workerCount = Math.min(
        concurrency,
        items.length
    );

    const workers = Array.from(
        { length: workerCount },
        () => worker()
    );

    await Promise.all(workers);

    return results;
}