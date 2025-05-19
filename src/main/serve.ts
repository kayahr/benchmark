/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { createServer, type RequestListener, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { relative } from "node:path";

import esbuild from "esbuild";

/**
 * Creates a ESM bundle script for the given entry point and returns it as a string.
 *
 * @param entryPoint - The file name of the entry point.
 * @returns The bundled script ready to be served to a browser.
 */
async function bundle(entryPoint: string): Promise<string> {
    const result = await esbuild.build({
        entryPoints: [ entryPoint ],
        bundle: true,
        write: false,
        format: "esm",
        external: [
            "*/NodeTestRunner.js"
        ]
    });
    return result.outputFiles.map(file => file.text).join("\n");
}

/**
 * Starts an HTTP server on the given port (or a subsequent port if already in use) with the given request listener.
 *
 * @param startPort - The first port to try. If already in use then the next port is tried until a free port is found.
 * @param listener  - The request listener.
 * @returns The created HTTP server.
 */
async function startServer(startPort: number, listener: RequestListener): Promise<Server> {
    return new Promise((resolve, reject) => {
        const server = createServer(listener).listen(startPort);
        server.on("error", (e: NodeJS.ErrnoException) => {
            if (e.code === "EADDRINUSE") {
                startServer(startPort + 1, listener).then(resolve, reject);
            } else {
                reject(e);
            }
        });
        server.on("listening", () => {
            resolve(server);
        });
    });
}

/**
 * Serves the benchmark script via HTTP.
 *
 * @param benchmarkScript - The benchmark script to serve.
 * @param port            - The port to listen on. Automatically increased if already occupied. Defaults to 49152.
 */
export async function serve(benchmarkScript: string, port = 49152): Promise<void> {
    const scriptUrl = relative(process.cwd(), benchmarkScript).replaceAll("\\", "/");
    const source = await bundle(benchmarkScript);
    const server = await startServer(port, function (req, res) {
        if (req.url === "/" || req.url === "/index.html") {
            res.writeHead(200, "Found", { "Content-Type": "text/html" });
            res.end(`<!DOCTYPE html>
              <html>
                <body>
                  <h1>Benchmarking ${scriptUrl}</h1>
                  <script type="module" src="${scriptUrl}"></script>
                  <p><script>document.writeln(navigator.userAgent)</script></p>
                </body>
               </html>
            `);
        } else if (req.url === `/${scriptUrl}`) {
            res.writeHead(200, { "Content-Type": "application/javascript" });
            res.end(source);
        } else if (req.url === `/exit` && req.method === "POST") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Exiting");
            res.destroy();
            server.close();
        } else {
            res.writeHead(404, "Not Found");
            res.end("Not Found");
        }
    });
    console.log(`Benchmark served on http://localhost:${(server.address() as AddressInfo).port}/`);
    console.log("Press Ctrl-C to exit");
}
