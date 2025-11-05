/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */


import { describe, it } from "node:test";

import { serve } from "../main/serve.ts";
import { assertContain, assertMatch, assertNotSame, assertSame, assertThrowWithMessage } from "@kayahr/assert";

describe("serve", () => {
    it("serves an entrypoint", async (context) => {
        const log = context.mock.method(console, "log", () => {});
        await serve("src/test/data/test.js");
        assertSame(log.mock.callCount(), 2);
        assertMatch(log.mock.calls[0].arguments[0], /^Benchmark served on http:\/\/localhost:\d+\/$/);
        assertSame(log.mock.calls[1].arguments[0], "Press Ctrl-C to exit");
        const url = (log.mock.calls[0].arguments[0] as string).substring(20);
        assertMatch(url, /^http:\/\/localhost:\d+\/$/);
        log.mock.restore();

        // Test index.html
        const index = await (await fetch(url)).text();
        assertContain(index, '<script type="module" src="src/test/data/test.js"></script>');

        // Test JS bundle
        const script = await (await fetch(`${url}src/test/data/test.js`)).text();
        assertContain(script, "console.log(benchmark)");
        assertContain(script, "BrowserTestRunner");

        // Test JS bundle
        const response = await fetch(`${url}not-there.txt`);
        assertSame(response.status, 404);
        assertSame(response.statusText, "Not Found");

        // Exit server
        const exiting = await (await fetch(`${url}exit`, { method: "POST" })).text();
        assertSame(exiting, "Exiting");
    });
    it("automatically increases port number if port is already used", async (context) => {
        const log = context.mock.method(console, "log", () => {});
        await serve("src/test/data/test.js");
        assertMatch(log.mock.calls[0].arguments[0], /^Benchmark served on http:\/\/localhost:\d+\/$/);
        const url1 = (log.mock.calls[0].arguments[0] as string).substring(20);
        log.mock.resetCalls();

        await serve("src/test/data/test.js");
        assertMatch(log.mock.calls[0].arguments[0], /^Benchmark served on http:\/\/localhost:\d+\/$/);
        const url2 = (log.mock.calls[0].arguments[0] as string).substring(20);
        assertNotSame(url1, url2);
        log.mock.restore();

        // Test JS bundle
        const script = await (await fetch(`${url2}src/test/data/test.js`)).text();
        assertContain(script, "console.log(benchmark)");
        assertContain(script, "BrowserTestRunner");

        // Exit both servers
        assertSame(await (await fetch(`${url1}exit`, { method: "POST" })).text(), "Exiting");
        assertSame(await (await fetch(`${url2}exit`, { method: "POST" })).text(), "Exiting");
    });
    it("rejects if port is out of range", async () => {
        await assertThrowWithMessage(() => serve("src/test/data/test.js", 65_536), RangeError,
            "options.port should be >= 0 and < 65536. Received type number (65536).");
    });
    if (process.getuid != null && process.getuid() > 0) {
        it("rejects if port cannot be opened", async () => {
            await assertThrowWithMessage(() => serve("src/test/data/test.js", 22), Error,
                "listen EACCES: permission denied 0.0.0.0:22");
        });
    }
});
