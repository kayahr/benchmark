/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

/**
 * Checks if current environment is Node.js.
 *
 * @returns True if environment is Node.js, false if it is a browser.
 */
export function isNode(): boolean {
    return typeof process === "object" && typeof process.versions?.node === "string";
}
