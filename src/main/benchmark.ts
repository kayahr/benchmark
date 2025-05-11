/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { BrowserTestRunner } from "./BrowserTestRunner.js";
import { isNode } from "./env.js";
import { Test, TestInit } from "./Test.js";
import type { TestRunner, TestRunnerOptions } from "./TestRunner.js";

/**
 * Benchmarks the given test operations.
 *
 * @param tests   - Array with test definitions. Each entry needs a `name` string and an `operation` function. The operation function gets a single numeric
 *                  argument which is incremented during each test run. The function should use this argument to generate a dynamic result which it must return
 *                  to prevent the JS engine from discarding meaningless operations or optimizing static operations which would make the benchmark useless.
 * @param options - Optional test runner options.
 */
export async function benchmark(tests: TestInit[], options?: TestRunnerOptions): Promise<void> {
    let runner: TestRunner;
    if (isNode()) {
        // Import NodeTestRunner dynamically so no Node.js imports can make any trouble when running in browser
        const { NodeTestRunner } = await import("./NodeTestRunner.js");
        runner = new NodeTestRunner(options);
    } else {
        runner = new BrowserTestRunner(options);
    }
    for (const test of tests) {
        runner.addTest(new Test(test));
    }
    await runner.run();
}
