let queue: Promise<void> = Promise.resolve();

export function withDatabaseSyncLock<T>(
    label: string,
    operation: () => Promise<T>,
): Promise<T> {
    const queuedAt = Date.now();
    const run = queue.catch(() => undefined).then(async () => {
        const startedAt = Date.now();
        if (__DEV__) {
            console.debug("[DATABASE SYNC LOCK] Started", {
                label,
                waitDurationMs: startedAt - queuedAt,
            });
        }
        try {
            return await operation();
        } finally {
            if (__DEV__) {
                console.debug("[DATABASE SYNC LOCK] Released", {
                    label,
                    executionDurationMs: Date.now() - startedAt,
                });
            }
        }
    });

    queue = run.then(
        () => undefined,
        () => undefined,
    );
    return run;
}
