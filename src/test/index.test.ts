/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { benchmark } from "../main/benchmark.js";
import * as exports from "../main/index.js";
import { type TestInit, type TestOperation } from "../main/Test.js";
import { type TestRunnerOptions } from "../main/TestRunner.js";

describe("index", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Check classes and enums
        expect({ ...exports }).toEqual({
            benchmark
        });

        // Interfaces and types can only be checked by TypeScript
        ((): TestOperation => (({} as exports.TestOperation)))();
        ((): TestInit => (({} as exports.TestInit)))();
        ((): TestRunnerOptions => (({} as exports.TestRunnerOptions)))();
    });
});
