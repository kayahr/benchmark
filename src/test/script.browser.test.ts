/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { before, describe, it } from "node:test";

import { getCurrentScript } from "../main/script.ts";
import { assertSame } from "@kayahr/assert";
import { installDOM } from "./utils.ts";

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
    before(() => {
        installDOM();
    });

    it("returns null when script element can not be determined", async () => {
        assertSame(await getCurrentScript(), null);
    });

    it("returns script element which loaded the module script", { timeout: 2000 }, async () => {
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
            script.addEventListener("error", () => {
                reject(new Error("Script execution failed" ))
            });
            script.textContent = "console.log('test'); globalThis._getCurrentScript().then(globalThis._resolve);";
            // script.src = "data:application/javascript,console.log('test');return true";
            document.body.appendChild(script);

            // Some script elements after the right one
            document.body.appendChild(createDummyScript("script-5"));
            document.body.appendChild(createDummyScript("script-6", "module"));
            document.body.appendChild(createDummyScript("script-7", "async"));
            document.body.appendChild(createDummyScript("script-8", "defer"));
        });
        assertSame(script.id, "test-script");
    });
});
