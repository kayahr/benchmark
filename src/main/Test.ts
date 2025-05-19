/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

/**
 * Type of a test operation function. It takes two numeric arguments, the first one is the current iteration (starting with 0 and incremented on each
 * iteration), the second one is the total number of iterations to run. These two values can be used as entropy for generating a dynamic result which the
 * function must return to prevent the JS engine from discarding meaningless operations or optimizing static operations which would make the
 * benchmark useless.
 */
export type TestOperation<T = unknown> = (iteration: number, iterations: number) => T;

/**
 * Initialization options of a benchmark test operation.
 */
export interface TestInit<T = unknown> {
    /** The test name displayed in the benchmark results. */
    name: string;

    /** The test operation function to continuously run. */
    operation: TestOperation<T>;
}

/**
 * A single benchmark test.
 */
export class Test<T = unknown> {
    private readonly name: string;
    private readonly operation: TestOperation<T>;
    private speed = 0;
    private measurements = 0;
    private averageSpeed = 0;
    private lastResult: T | null = null;

    /**
     * Creates a new benchmark test with the given options.
     *
     * @param init - The initialization options of the test.
     */
    public constructor({ name, operation }: TestInit<T>) {
        this.name = name;
        this.operation = operation;
    }

    /**
     * @returns The test name.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * @returns The test operation.
     */
    public getOperation(): TestOperation {
        return this.operation;
    }

    /**
     * @returns The last measured speed in operations per second.
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * @returns The average measured speed in operations per second.
     */
    public getAverageSpeed(): number {
        return this.averageSpeed;
    }

    /**
     * @returns The last result returned by the test operation.
     */
    public getLastResult(): T | null {
        return this.lastResult;
    }

    /**
     * Continuously runs the test operation for the given number of times.
     *
     * @param iterations - The number of times to run the function.
     * @param warmup     - Set to true if this run is just for warmup. During warmup the average speed is not updated.
     *
     */
    private runLoop(iterations: number, warmup: boolean): number {
        let lastResult: T | null = null;
        const operation = this.operation;
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            lastResult = operation(i, iterations);
        }
        const endTime = performance.now();
        const runTime = endTime - startTime;
        this.speed = iterations * 1000 / runTime;
        if (!warmup) {
            this.averageSpeed = (this.measurements * this.averageSpeed + this.speed) / (this.measurements + 1);
            this.measurements++;
        }
        this.lastResult = lastResult;
        return runTime;
    }

    /**
     * Runs the tests for the given duration. If speed has not been measured before then it is estimated in a warm-up round.
     *
     * @param duration - The test duration in milliseconds.
     */
    public run(duration: number): void {
        if (this.speed === 0) {
            // Speed is not known yet so constantly measure the time and incrementally update the number of iterations to get a good estimation of speed.
            let iterations = 1;
            let time = performance.now();
            const stopTime = time + duration;
            do {
                time += this.runLoop(iterations, true);
                iterations *= 2;
            } while (time < stopTime);
        } else {
            // Run the test with iterations based on the last measured speed. After 10 measurements use the average speed
            this.runLoop((this.measurements > 10 ? this.averageSpeed : this.speed) * duration / 1000, false);
        }
    }
}
