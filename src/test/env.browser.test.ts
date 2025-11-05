/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { before, describe, it } from "node:test";

import { isNode } from "../main/env.ts";
import { assertSame } from "@kayahr/assert";
import { installDOM } from "./utils.ts";

describe("isNode", () => {
    before(() => {
        installDOM();
    });

    it("returns false on Browser", () => {
        assertSame(isNode(), false);
    });
});
