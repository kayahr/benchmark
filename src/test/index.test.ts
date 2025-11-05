/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { benchmark } from "../main/benchmark.ts";
import * as exports from "../main/index.ts";
import type { TestInit, TestOperation } from "../main/Test.ts";
import type { TestRunnerOptions } from "../main/TestRunner.ts";
import { assertEquals } from "@kayahr/assert";

describe("index", () => {
    it("exports relevant types and functions and nothing more", () => {
        // Check classes and enums
        assertEquals({ ...exports }, {
            benchmark
        });

        // Interfaces and types can only be checked by TypeScript
        ((): TestOperation => (({} as exports.TestOperation)))();
        ((): TestInit => (({} as exports.TestInit)))();
        ((): TestRunnerOptions => (({} as exports.TestRunnerOptions)))();
    });
});
