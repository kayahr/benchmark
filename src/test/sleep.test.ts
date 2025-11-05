/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it, mock } from "node:test";

import { sleep } from "../main/sleep.ts";

describe("sleep", () => {
    it("sleeps for given number of milliseconds", async () => {
        mock.timers.enable({ apis: [ "setTimeout" ] });
        try {
            const promise = sleep(10_000);
            mock.timers.tick(10_000);
            await promise;
        } finally {
            mock.timers.reset();
        }
    });
});
