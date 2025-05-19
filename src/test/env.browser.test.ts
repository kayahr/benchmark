/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { isNode } from "../main/env.js";

describe("isNode", () => {
    it("returns false on Browser", () => {
        expect(isNode()).toBe(false);
    });
});
