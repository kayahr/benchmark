/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, it } from "node:test";

import { isNode } from "../main/env.ts";
import { assertSame } from "@kayahr/assert";

describe("isNode", () => {
    it("returns true on Node.js", () => {
        assertSame(isNode(), true);
    });
});
