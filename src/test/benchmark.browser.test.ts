/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { before, beforeEach, describe, it } from "node:test";

import { benchmark } from "../main/benchmark.ts";
import { sleep } from "../main/sleep.ts";
import type { TestInit } from "../main/Test.ts";
import { assertContain, assertGreaterThan, assertSame } from "@kayahr/assert";
import { installDOM } from "./utils.ts";

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
    before(() => {
        installDOM();
    });

    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("Shows latest speed in HTML document", async () => {
        await benchmark(tests, { runs: 1 });
        const output = getOutput();
        assertContain(output, `<td class="name">Add</td>`);
        assertContain(output, `<td class="name">Multiply</td>`);
        assertContain(output, `<span id="speed-mode">Latest</span>`);
    });

    it("Shows average speed in HTML document when defined as option", async () => {
        await benchmark(tests, { runs: 1, showAverage: true });
        const output = getOutput();
        assertContain(output, `<td class="name">Add</td>`);
        assertContain(output, `<td class="name">Multiply</td>`);
        assertContain(output, `<span id="speed-mode">Average</span>`);
    });

    it("calls given init function before each run", async (context) => {
        const init = context.mock.fn();
        await benchmark(tests, { runs: 1, init });
        assertGreaterThan(init.mock.callCount(), 0);
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
        await sleep(0); // Necessary for happy-dom to ensure mutation observer handled the fakeScript insertion before adding the benchmark
        await benchmark(tests, { runs: 1 });
        assertSame(document.body.innerHTML, "Before<script></script><div></div>After");
    });
});
