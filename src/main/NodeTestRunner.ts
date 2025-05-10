/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { Test } from "./Test.js";
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
    private titleLen: number | null = null;
    private titles: string[] | null = null;

    /** @inheritDoc */
    public override addTest(test: Test): this {
        this.titles = null;
        this.titleLen = null;
        return super.addTest(test);
    }

    /** @inheritDoc */
    private getTitles(): string[] {
        return this.titles ??= this.tests.map(test => test.getName())
            .map(title => title.length > maxTitleLen ? (title.substring(0, maxTitleLen - 1) + "…") : title);
    }

    /** @inheritDoc */
    private getTitleLen(): number {
        return this.titleLen ??= this.getTitles().reduce((titleLen, title) => Math.max(title.length, titleLen), minTitleLen);
    }

    /** @inheritDoc */
    protected override error(message: string): void {
        console.error(message);
    }

    /** @inheritDoc */
    protected override status(message: string): void {
        console.log(message);
    }

    /** @inheritDoc */
    protected initOutput(): void {
        const titles = this.getTitles();
        const titleLen = this.getTitleLen();
        console.log("\u001B[2A");
        console.log(`╔${"═".repeat(titleLen + 2)}╤${"═".repeat(tableWidth - titleLen - 5)}╗`);
        console.log(`║ ${"Test".padEnd(titleLen)} │ Speed${" ".repeat(tableWidth - titleLen - 11)}║`);
        console.log("╟" + "─".repeat(titleLen + 2) + "┼─────────┬" + "─".repeat(tableWidth - titleLen - 15) + "╢");
        for (const title of titles) {
            console.log("║ " + title.padEnd(titleLen) + " │         │" + " ".repeat(tableWidth - titleLen - 15) + "║");
        }
        console.log("╚" + "═".repeat(titleLen + 2) + "╧═════════╧" + "═".repeat(tableWidth - titleLen - 15) + "╝");
        console.log("Benchmarking... (Press CTRL-C or Q to quit, M to toggle speed display mode)");
    }

    /** @inheritDoc */
    protected override updateOutput(): void {
        const fastestSpeed = this.tests.reduce((fastestSpeed, test) => Math.max(fastestSpeed, this.showAverage ? test.getAverageSpeed() : test.getSpeed()), 0);
        const titleLen = this.getTitleLen();
        const fastestSpeedStr = (new Intl.NumberFormat("en-US").format(Math.round(fastestSpeed)) + " ops/s").padStart(tableWidth - titleLen - 22);
        console.log(`\u001B[${this.tests.length + 4}A\u001B[${titleLen + 11}C${this.showAverage ? "(Average)" : "(Latest) "}${fastestSpeedStr}\n`);
        const maxBarLen = tableWidth - titleLen - 17;
        for (const test of this.tests) {
            const speed = this.showAverage ? test.getAverageSpeed() : test.getSpeed();
            const percent = speed === 0 ? 0 : Math.min(100, 100 * speed / fastestSpeed);
            const barLen = maxBarLen * percent / 100;
            const roundedBarLen = Math.round(barLen);
            const bar = ("■".repeat(roundedBarLen));
            console.log(`\u001B[${this.getTitleLen() + 5}C${percent.toFixed(1).padStart(5)} %\u001B[3C\u001B[3m${bar.padEnd(maxBarLen)}\u001B[0m`);
        }
        console.log("\n");
    }

    private async registerKeypressListener(): Promise<() => void> {
        const readline = (await import("readline")).default;

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

    public override async run(): Promise<void> {
        if (process.stdout.isTTY) {
            const unregisterKeypressListener = await this.registerKeypressListener();
            await super.run();
            unregisterKeypressListener();
            console.log(`\u001B[1A\u001B[KExiting...`);
        } else {
            console.log("TODO Implement non-interactive mode");
        }
    }
}
