/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { benchmark } from "../main/benchmark.js";
import { sleep } from "../main/sleep.js";
import type { TestInit } from "../main/Test.js";

async function getElement(id: string): Promise<HTMLElement> {
    while (true) {
        const button = document.body.firstElementChild?.shadowRoot?.getElementById(id);
        if (button != null) {
            return button;
        }
        await sleep(50);
    }
}

function getOutput(): string {
    return document.body.firstElementChild?.shadowRoot?.innerHTML ?? "";
}

async function expectOutput(content: string): Promise<void> {
    while (true) {
        if (getOutput().includes(content)) {
            return;
        }
        await sleep(50);
    }
}

const tests: TestInit[] = [
    { name: "Add", operation: (a, b) => a + b },
    { name: "Multiply", operation: (a, b) => a * b }
];

describe("benchmark", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("Shows latest speed in HTML document", async () => {
        await benchmark(tests, { runs: 1 });
        const output = getOutput();
        expect(output).toContain(`<td class="name">Add</td>`);
        expect(output).toContain(`<td class="name">Multiply</td>`);
        expect(output).toContain(`<span id="speed-mode">Latest</span>`);
    });

    it("Shows average speed in HTML document when defined as option", async () => {
        await benchmark(tests, { runs: 1, showAverage: true });
        const output = getOutput();
        expect(output).toContain(`<td class="name">Add</td>`);
        expect(output).toContain(`<td class="name">Multiply</td>`);
        expect(output).toContain(`<span id="speed-mode">Average</span>`);
    });

    it("calls given init function before each run", async () => {
        const init = vi.fn();
        await benchmark(tests, { runs: 1, init });
        expect(init).toHaveBeenCalled();
    });

    it("provides button to switch speed mode", async () => {
        const promise = benchmark(tests);
        const button = await getElement("toggle-speed-button");
        await expectOutput(`<span id="speed-mode">Latest</span>`);
        button.click();
        await expectOutput(`<span id="speed-mode">Average</span>`);
        button.click();
        await expectOutput(`<span id="speed-mode">Latest</span>`);

         // Stop benchmark
        (await getElement("stop-button")).click();
        await promise;
    });

    it("inserts benchmark report after related script element", async () => {
        const fakeScript = document.createElement("script");
        // listener is called directly when added to emulate init detection of active script
        fakeScript.addEventListener = (type: string, listener: (event: unknown) => void) => listener({ target: fakeScript });
        const body = document.body;
        body.appendChild(document.createTextNode("Before"));
        body.appendChild(fakeScript);
        body.appendChild(document.createTextNode("After"));
        await benchmark(tests, { runs: 1 });
        expect(document.body.innerHTML).toBe("Before<script></script><div></div>After");
    });
});
