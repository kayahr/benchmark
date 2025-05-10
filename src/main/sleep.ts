/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep. 0 (Default) sleeps for the minimum amount of time (one macrotask).
 */
export async function sleep(ms = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
