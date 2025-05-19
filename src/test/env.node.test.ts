/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { isNode } from "../main/env.js";

describe("isNode", () => {
    it("returns true on Node.js", () => {
        expect(isNode()).toBe(true);
    });
});
