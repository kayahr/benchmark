/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it, vi } from "vitest";

import { sleep } from "../main/sleep.js";

describe("sleep", () => {
    it("sleeps for given number of milliseconds", async () => {
        vi.useFakeTimers({ toFake: [ "setTimeout" ] });
        try {
            const promise = sleep(10000);
            vi.advanceTimersByTime(10000);
            await expect(promise).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });
});
