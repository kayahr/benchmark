/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { describe, expect, it } from "vitest";

import { getCurrentScript } from "../main/script.js";

function createDummyScript(id: string, type?: string): HTMLScriptElement {
    const script = document.createElement("script");
    script.id = id;
    if (type === "module") {
        script.type = type;
    } else if (type === "defer") {
        script.defer = true;
    } else if (type === "async") {
        script.async = true;
    }
    script.src = "data:application/javascript,false";
    return script;
}

describe("getCurrentScript", () => {
    it("returns null when script element can not be determined", async () => {
        expect(await getCurrentScript()).toBe(null);
    });

    it("returns script element which loaded the module script", async () => {
        const script = await new Promise<HTMLScriptElement>((resolve, reject) => {
            // Some script elements before the right one
            document.body.appendChild(createDummyScript("script-1"));
            document.body.appendChild(createDummyScript("script-2", "module"));
            document.body.appendChild(createDummyScript("script-3", "async"));
            document.body.appendChild(createDummyScript("script-4", "defer"));

            const global = globalThis as Record<string, unknown>;
            global._getCurrentScript = getCurrentScript;
            global._resolve = resolve;
            const script = document.createElement("script");
            script.id = "test-script";
            script.type = "module";
            script.onerror = () => reject(new Error("Script execution failed"));
            script.src = "data:application/javascript,_resolve(await globalThis._getCurrentScript())";
            document.body.appendChild(script);

            // Some script elements after the right one
            document.body.appendChild(createDummyScript("script-5"));
            document.body.appendChild(createDummyScript("script-6", "module"));
            document.body.appendChild(createDummyScript("script-7", "async"));
            document.body.appendChild(createDummyScript("script-8", "defer"));
        });
        expect(script.id).toBe("test-script");
    });
});
