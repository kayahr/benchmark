/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { sleep } from "./sleep.ts";
import type { Test } from "./Test.ts";

/**
 * Benchmark test runner options.
 */
export interface TestRunnerOptions {
    /** Function called before each test iteration. Can be used to init/reset static test data. */
    init?: (() => void) | null;

    /** The number of times to run the benchmark tests. Runs indefinitely if not specified */
    runs?: number;

    /** Show average speed by default. */
    showAverage?: boolean;
}

/**
 * Benchmark test runner.
 */
export abstract class TestRunner {
    private readonly init: (() => void) | null;
    private readonly runs: number;

    /** Set to true while tests are running. */
    protected running = false;

    /** The tests to run. */
    protected readonly tests: Test[] = [];

    /** True to show average speed instead of of latest speed. */
    protected showAverage: boolean;

    /**
     * Creates a new test runner with the given options.
     *
     * @param options - The test runner options.
     */
    public constructor({ init = null, runs = Infinity, showAverage = false }: TestRunnerOptions = {}) {
        this.init = init;
        this.runs = runs;
        this.showAverage = showAverage;
    }

    /**
     * Adds benchmark test to this runner.
     *
     * @param test - The benchmark test to add.
     */
    public addTest(test: Test): this {
        this.tests.push(test);
        return this;
    }

    /**
     * Renders the benchmark report.
     *
     * @param runs - The number of times the benchmark was run up to now.
     */
    protected abstract report(runs: number): Promise<void> | void;

    /**
     * Runs the benchmark continuously until {@link stop} is called.
     */
    public async run(): Promise<void> {
        const numTests = this.tests.length;
        const duration = 250 / numTests;
        let runs = 0;
        const tests = this.tests;
        this.running = true;
        while (this.running && runs < this.runs) {
            for (const test of tests) {
                this.init?.();
                test.run(duration);
                await sleep();
            }
            await this.report(runs++);
        }
    }

    /**
     * Stops benchmarking.
     */
    public stop(): void {
        this.running = false;
    }
}
