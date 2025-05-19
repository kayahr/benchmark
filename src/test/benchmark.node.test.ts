/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { benchmark } from "../main/benchmark.js";
import { sleep } from "../main/sleep.js";
import type { TestInit } from "../main/Test.js";

const tests: TestInit[] = [
    { name: "Add", operation: (a, b) => a + b },
    { name: "Multiply", operation: (a, b) => a * b }
];

describe("benchmark", () => {
    const origLog = console.log;
    let output: string;
    let listeners: Array<(str: string, key: { name: string, ctrl: boolean }) => void>;

    beforeEach(() => {
        listeners = [];
        console.log = text => output += text + "\n";
        output = "";
    });

    afterEach(() => {
        console.log = origLog;
    });

    async function emulateTTY(fn: () => Promise<void>): Promise<void> {
        const origIsTTY = process.stdout.isTTY;
        const origSetRawMode = process.stdin.setRawMode;
        const origOn = process.stdin.on;
        process.stdout.isTTY = true;
        process.stdin.setRawMode = () => process.stdin;
        process.stdin.on = (event: string, listener: (...args: any[]) => void) => {
            if (event === "keypress") {
                listeners.push(listener);
            }
            return process.stdin;
        };
        try {
            await fn();
        } finally {
            process.stdout.isTTY = origIsTTY;
            process.stdin.setRawMode = origSetRawMode;
            process.stdin.on = origOn;
        }
    }

    async function expectOutput(content: string): Promise<void> {
        while (true) {
            if (output.includes(content)) {
                return;
            }
            await sleep(50);
        }
    }

    function clearOutput(): void {
        output = "";
    }

    function pressKey(key: string, ctrl = false) {
        for (const listener of listeners) {
            listener(key, { name: key, ctrl });
        }
    }

    it("Shows latest speed in HTML document", async () => {
        await emulateTTY(async () => {
            await benchmark(tests, { runs: 2 });
            expect(output).toContain("║ Test     │");
            expect(output).toContain("║ Add      │");
            expect(output).toContain("│ Speed (Latest) ");
        });
    });

    it("Shows average speed in HTML document when defined as option", async () => {
        await emulateTTY(async () => {
            await benchmark(tests, { runs: 2, showAverage: true });
            expect(output).toContain("║ Test     │");
            expect(output).toContain("║ Add      │");
            expect(output).toContain("│ Speed (Average) ");
        });
    });

    it("calls given init function before each run", async () => {
        await emulateTTY(async () => {
            const init = vi.fn();
            await benchmark(tests, { runs: 1, init });
            expect(init).toHaveBeenCalled();
        });
    });

    it("can switch speed mode", async () => {
        await emulateTTY(async () => {
            const promise = benchmark(tests);
            await expectOutput("│ Speed (Latest) ");
            clearOutput();
            pressKey("m");
            await expectOutput("│ Speed (Average) ");
            clearOutput();
            pressKey("m");
            await expectOutput("│ Speed (Latest) ");

            // Stop benchmark with Q
            pressKey("q");
            await promise;
        });
    });

    it("does nothing when pressing unknown key", async () => {
        await emulateTTY(async () => {
            const promise = benchmark(tests);
            await expectOutput("│ Speed (Latest) ");
            clearOutput();
            pressKey("n");
            await expectOutput("│ Speed (Latest) ");

            // Stop benchmark with Q
            pressKey("q");
            await promise;
        });
    });

    it("can stop with Ctrl-C", async () => {
        await emulateTTY(async () => {
            const promise = benchmark(tests);
            await expectOutput("Benchmarking...");
            pressKey("c", true);
            await promise;
        });
    });

    it("outputs a single benchmark result with average speed after 25 tries when not running in TTY", { timeout: 20000 }, async () => {
        await benchmark(tests);
        expect(output).toContain("║ Test     │");
        expect(output).toContain("║ Add      │");
        expect(output).toContain("│ Speed (Average) ");
        expect(output).not.toContain("Benchmarking...");
        expect(output).not.toContain("Warming up");
    });

    it("provides web-based benchmark when --web parameter is used", async () => {
        vi.spyOn(process, "argv", "get").mockReturnValue([ "node", "src/test/data/test.js", "--web" ]);
        const promise = benchmark(tests);
        await expectOutput("Benchmark served");
        expect(output).toMatch(/^Benchmark served on http:\/\/localhost:\d+\/\nPress Ctrl-C to exit\n$/);
        const url = output.split("\n")[0].substring(20).trim();

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
        expect(await (await fetch(`${url}exit`, { method: "POST" })).text()).toBe("Exiting");
        await promise;
    });
});
