/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it, vi } from "vitest";

import { serve } from "../main/serve.js";

describe("serve", () => {
    it("serves an entrypoint", async () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => {});
        await serve("src/test/data/test.js");
        expect(log).toHaveBeenCalledTimes(2);
        expect(log.mock.calls[0][0]).toMatch(/^Benchmark served on http:\/\/localhost:\d+\/$/);
        expect(log.mock.calls[1][0]).toBe("Press Ctrl-C to exit");
        const url = (log.mock.calls[0][0] as string).substring(20);
        expect(url).toMatch(/^http:\/\/localhost:\d+\/$/);
        log.mockRestore();

        // Test index.html
        const index = await (await fetch(url)).text();
        expect(index).toContain('<script type="module" src="src/test/data/test.js"></script>');

        // Test JS bundle
        const script = await (await fetch(`${url}src/test/data/test.js`)).text();
        expect(script).toContain("console.log(benchmark)");
        expect(script).toContain("BrowserTestRunner");

        // Test JS bundle
        const response = await fetch(`${url}not-there.txt`);
        expect(response.status).toBe(404);
        expect(response.statusText).toBe("Not Found");

        // Exit server
        const exiting = await (await fetch(`${url}exit`, { method: "POST" })).text();
        expect(exiting).toBe("Exiting");
    });
});
