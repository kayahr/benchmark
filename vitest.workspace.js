import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
    {
        extends: "./vitest.config.js",
        test: {
            name: "Node",
            exclude: [ "**/*.browser.test.*" ]
        }
    },
    {
        extends: "./vitest.config.js",
        test: {
            name: "Browser",
            exclude: [ "**/*.node.test.*" ],
            browser: {
                enabled: true
            }
        }
    }
]);
