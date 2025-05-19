/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import readline from "node:readline";

import { serve } from "./serve.js";
import { TestRunner } from "./TestRunner.js";

/** The width of the rendered table. */
const tableWidth = 80;

/** The minimum title column length. */
const minTitleLen = 4;

/** The maximum title column length. Longer test names are automatically abbreviated. */
const maxTitleLen = 30;

/**
 * Node.js implementation of a benchmark test runner rendering the benchmark results with ANSI sequences on the console.
 */
export class NodeTestRunner extends TestRunner {
    /** @inheritDoc */
    protected override report(runs: number): void {
        const isTTY = process.stdout.isTTY;
        const tests = this.tests;
        const numTests = tests.length;
        if (isTTY && runs === 0) {
            console.log(`Warming up ${numTests} tests...`);
        } else {
            if (isTTY) {
                // Move cursor to first line of output to overwrite previous output
                console.log(`\u001B[${runs === 1 ? 2 : (numTests + 6)}A`);
            } else if (runs < 25) {
                // In non-interactive mode do nothing for the first 25 runs
                return;
            }
            const titleLen = Math.min(tests.reduce((titleLen, test) => Math.max(test.getName().length, titleLen), minTitleLen), maxTitleLen);
            const fastest = tests.reduce((fastestSpeed, test) => Math.max(fastestSpeed, this.showAverage ? test.getAverageSpeed() : test.getSpeed()), 0);
            const fastestStr = (new Intl.NumberFormat("en-US").format(Math.round(fastest)) + " ops/s").padStart(tableWidth - titleLen - 22);
            const maxBarLen = tableWidth - titleLen - 17;
            console.log(`╔${"═".repeat(titleLen + 2)}╤${"═".repeat(tableWidth - titleLen - 5)}╗`);
            console.log(`║ ${"Test".padEnd(titleLen)} │ Speed ${this.showAverage ? "(Average)" : "(Latest) "}${fastestStr} ║`);
            console.log(`╟${"─".repeat(titleLen + 2)}┼─────────┬${"─".repeat(tableWidth - titleLen - 15)}╢`);
            for (const test of tests) {
                const speed = this.showAverage ? test.getAverageSpeed() : test.getSpeed();
                const percent = Math.min(100, 100 * speed / fastest);
                const barLen = maxBarLen * percent / 100;
                const roundedBarLen = Math.round(barLen);
                const bar = ("■".repeat(roundedBarLen));
                console.log(`║ ${test.getName().padEnd(titleLen)} │ ${percent.toFixed(1).padStart(5)} % │ ${bar.padEnd(maxBarLen)} ║`);
            }
            console.log(`╚${"═".repeat(titleLen + 2)}╧═════════╧${"═".repeat(tableWidth - titleLen - 15)}╝`);

            if (isTTY) {
                console.log("Benchmarking... (Press CTRL-C or Q to quit, M to toggle speed display mode)");
            } else {
                // In non-interactive mode exit after report
                this.stop();
            }
        }
    }

    private registerKeypressListener(): () => void {
        const readlineInterface = readline.createInterface({
            input: process.stdin
        });
        const listener = (str: string, key: { name: string, ctrl: boolean }) => {
            if (key.name === "q" || (key.ctrl && key.name === "c")) {
                this.stop();
            } else if (key.name === "m") {
                this.showAverage = !this.showAverage;
            }
        };
        readline.emitKeypressEvents(process.stdin, readlineInterface);
        process.stdin.setRawMode(true);
        process.stdin.on("keypress", listener);
        return () => {
            process.stdin.off("keypress", listener);
            process.stdin.setRawMode(false);
            readlineInterface.close();
        };
    }

    /** @inheritDoc */
    public override async run(): Promise<void> {
        if (process.argv.includes("--web")) {
            await serve(process.argv[1]);
        } else {
            if (process.stdout.isTTY) {
                const unregisterKeypressListener = this.registerKeypressListener();
                await super.run();
                unregisterKeypressListener();
                console.log(`\u001B[1A\u001B[KExiting...`);
            } else {
                // In non-interactive mode always use average speeds
                this.showAverage = true;
                await super.run();
            }
        }
    }
}
