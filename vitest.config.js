import { defineConfig } from "vitest/config";

export default defineConfig(
{
    test: {
        include: [ "src/test/**/*.test.ts" ],
        reporters: [
            "default",
            [ "junit", { outputFile: "lib/test/junit.xml", suiteName: "benchmark tests" } ]
        ],
        env: {
            NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --expose-gc`
        },
        browser: {
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            instances: [
                {
                    browser: "chromium",
                    launch: {
                        args: [
                            "--js-flags=--expose-gc"
                        ]
                    }
                }
            ]
        },
        coverage: {
            enabled: true,
            provider: "istanbul",
            reporter: [ "text-summary", "json", "lcov", "clover", "cobertura", "html" ],
            reportsDirectory: "lib/test/coverage",
            include: [ "src/main/**/*.ts" ]
        }
    }
});
