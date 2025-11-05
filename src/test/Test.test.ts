import { describe, it } from "node:test";
import { assertGreaterThan, assertGreaterThanOrEqual, assertLessThan, assertSame } from "@kayahr/assert";
import { Test } from "../main/Test.ts";

const operation = () => {};

describe("Test", () => {
    describe("constructor", () => {
        it("creates new test with given name and operation", () => {
            const test = new Test({ name: "Test name", operation });
            assertSame(test.getName(), "Test name");
            assertSame(test.getOperation(), operation);
        });
    });

    describe("getSpeed", () => {
        it("initially returns 0", () => {
            assertSame(new Test({ name: "", operation: () => {} }).getSpeed(), 0);
        });
    });

    describe("getAverageSpeed", () => {
        it("initially returns 0", () => {
            assertSame(new Test({ name: "", operation: () => {} }).getAverageSpeed(), 0);
        });
    });

    describe("getLastResult", () => {
        it("initially returns null", () => {
            assertSame(new Test({ name: "", operation: () => {} }).getLastResult(), null);
        });
    });

    describe("run", () => {
        it("runs the operation multiple times and updates speed, average speed and last result accordingly", (context) => {
            let lastResult = 0;
            const operation = context.mock.fn(() => ++lastResult);
            const test = new Test({ name: "", operation });

            // Initial run
            test.run(5);
            assertGreaterThan(test.getSpeed(), 0);
            assertSame(test.getAverageSpeed(), 0); // Not updated in warm-up
            assertGreaterThan(operation.mock.callCount(), 0);
            assertSame(test.getLastResult(), lastResult);
            operation.mock.resetCalls();

            // 20 more runs
            for (let i = 0; i < 20; i++) {
                test.run(5);
                assertGreaterThan(operation.mock.callCount(), 0);
                assertGreaterThan(test.getSpeed(), 0);
                assertGreaterThan(test.getAverageSpeed(), 0);
                assertSame(test.getLastResult(), lastResult);
            }
        });
        it("calls operation functions with two numeric entropy integers", () => {
            let expectedA = 0;
            const test = new Test({
                name: "",
                operation: (a, b) => {
                    assertGreaterThanOrEqual(a, 0);
                    assertSame(a, Math.round(a));
                    assertGreaterThanOrEqual(b, 0);
                    assertSame(b, Math.round(b));
                    assertLessThan(a, b);
                    assertSame(a, expectedA);
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
