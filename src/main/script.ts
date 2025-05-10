/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

/**
 * @returns The current script element.
 */
export async function getCurrentScript(): Promise<HTMLScriptElement | null> {
    return new Promise(resolve => {
        const scripts = Array.from(document.scripts);
        const onload = (event: Event) => {
            for (const script of scripts) {
                script.removeEventListener("load", onload, false);
            }
            console.log("Resolved");
            resolve(event.target as HTMLScriptElement);
        };
        for (const script of scripts) {
            script.addEventListener("load", onload, false);
        }

        // Give up after 100ms
        setTimeout(() => resolve(null), 100);
    });
}
