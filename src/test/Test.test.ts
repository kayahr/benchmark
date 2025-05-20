import { describe, expect, it, vi } from "vitest";

import { Test } from "../main/Test.js";

describe("Test", () => {
    describe("constructor", () => {
        it("creates new test with given name and operation", () => {
            const operation = () => {};
            const test = new Test({ name: "Test name", operation });
            expect(test.getName()).toBe("Test name");
            expect(test.getOperation()).toBe(operation);
        });
    });

    describe("getSpeed", () => {
        it("initially returns 0", () => {
            expect(new Test({ name: "", operation: () => {} }).getSpeed()).toBe(0);
        });
    });

    describe("getAverageSpeed", () => {
        it("initially returns 0", () => {
            expect(new Test({ name: "", operation: () => {} }).getAverageSpeed()).toBe(0);
        });
    });

    describe("getLastResult", () => {
        it("initially returns null", () => {
            expect(new Test({ name: "", operation: () => {} }).getLastResult()).toBe(null);
        });
    });

    describe("run", () => {
        it("runs the operation multiple times and updates speed, average speed and last result accordingly", () => {
            let lastResult = 0;
            const operation = vi.fn(() => ++lastResult);
            const test = new Test({ name: "", operation });

            // Initial run
            test.run(5);
            expect(test.getSpeed()).toBeGreaterThan(0);
            expect(test.getAverageSpeed()).toBe(0); // Not updated in warm-up
            expect(operation).toHaveBeenCalled();
            expect(test.getLastResult()).toBe(lastResult);
            operation.mockClear();

            // 20 more runs
            for (let i = 0; i < 20; i++) {
                test.run(5);
                expect(operation).toHaveBeenCalled();
                expect(test.getSpeed()).toBeGreaterThan(0);
                expect(test.getAverageSpeed()).toBeGreaterThan(0);
                expect(test.getLastResult()).toBe(lastResult);
            }
        });
        it("calls operation functions with two numeric entropy integers", () => {
            let expectedA = 0;
            const test = new Test({
                name: "",
                operation: (a, b) => {
                    expect(a).toBeGreaterThanOrEqual(0);
                    expect(a).toBe(Math.round(a));
                    expect(b).toBeGreaterThanOrEqual(0);
                    expect(b).toBe(Math.round(b));
                    expect(a).toBeLessThan(b);
                    expect(a).toBe(expectedA);
                    if (a === b - 1) {
                        expectedA = 0;
                    } else {
                        expectedA++;
                    }
                    return 0;
                }
            });
            test.run(5);
        });
    });
});
