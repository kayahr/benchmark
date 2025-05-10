import { sleep } from "./sleep.js";
import { Test } from "./Test.js";

export interface TestRunnerOptions {
    /** Function called before each test iteration. Can be used to init/reset static test data. */
    init?: (() => void) | null;
}

export abstract class TestRunner {
    protected running: boolean = false;
    protected readonly tests: Test[] = [];
    protected showAverage = false;
    private readonly init: (() => void) | null;

    public constructor({ init = null }: TestRunnerOptions = {}) {
        this.init = init;
    }

    public addTest(test: Test): this {
        this.tests.push(test);
        return this;
    }

    protected abstract initOutput(): void;

    protected abstract updateOutput(): void;

    protected abstract error(message: string): void;

    protected abstract status(message: string): void;

    public async run(): Promise<void> {
        const numTests = this.tests.length;
        if (numTests === 0) {
            this.error("No tests defined");
            return;
        }
        this.status(`Warming up ${numTests} tests...`);
        const duration = 250 / numTests;
        let runs = 0;
        const tests = this.tests;
        this.running = true;
        while (this.running) {
            for (const test of tests) {
                this.init?.();
                test.run(duration, runs === 0);
                await sleep();
            }
            if (runs === 1) {
                this.initOutput();
            }
            if (runs > 0) {
                this.updateOutput();
            }
            runs++;
        }
    }

    public stop(): void {
        this.running = false;
    }
}
