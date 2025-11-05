/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { getCurrentScript } from "./script.ts";
import { TestRunner } from "./TestRunner.ts";

/** The HTML/CSS template used for benchmark output. */
const template = `
  <style>
    p {
      margin: 4px 0 0 0;
    }
    table {
      border: solid 1px black;
      border-collapse: collapse;
    }
    td, th {
      border-left: solid 1px black;
      text-align: start;
      text-wrap: nowrap;
    }
    td:first-child, th:first-child {
      border-left: 0;
    }
    th {
      border-bottom: solid 1px black;
      padding: 4px 8px;
    }
    td {
      padding: 2px 8px;
    }
    tr:last-child td {
      padding-bottom: 4px;
    }
    tr:nth-child(2) td {
       padding-top: 4px;
    }
    td.percent {
      text-align: end;
    }
    td.bar {
      width: 256px;
    }
    td.bar > div {
      width: 0;
      height: 0.5em;
      background-color: black;
    }
    #speed {
        float: right;
    }
    #controls, #warmup, #table {
      display: none;
    }
    #controls {
      margin-bottom: 1em;
    }
    #benchmark.warmup > #warmup, #benchmark.running > #controls {
        display: block;
    }
    #benchmark.stopped > table, #benchmark.running > table {
        display: inline-block;
    }
  </style>
  <div id="benchmark" class="warmup">
    <p id="warmup">
      Warming up <span id="num-tests"></span> tests...
    </p>
    <template id="test">
      <table>
        <tr>
          <td class="name"></td>
          <td class="percent">000.0 %</td>
          <td class="bar">
            <div class="bar"><div>
          </td>
        </tr>
      </table>
    </template>
    <table id="table">
      <tr>
        <th>Test</th>
        <th colspan="2">Speed (<span id="speed-mode"></span>)<span id="speed"></span></th>
      </tr>
    </table>
    <p id="controls">
      <button id="stop-button">Stop</button>
      <button id="toggle-speed-button">Toggle Speed</button>
    </p>
  </div>
`;

/**
 * Browser implementation of a benchmark test runner.
 */
export class BrowserTestRunner extends TestRunner {
    private readonly currentScript = getCurrentScript();

    private root: ShadowRoot | null = null;

    private async createRoot(): Promise<ShadowRoot> {
        const container = document.createElement("div");
        const root = container.attachShadow({ mode: "open" });
        root.innerHTML = template;
        root.querySelector<HTMLSpanElement>("#num-tests")!.textContent = String(this.tests.length);
        root.querySelector<HTMLSpanElement>("#speed-mode")!.textContent = this.showAverage ? "Average" : "Latest";
        const testTemplate = root.querySelector<HTMLTemplateElement>("#test")!;
        const table = root.querySelector<HTMLTableElement>("#table")!;
        let index = 0;
        for (const test of this.tests) {
            const testRow = testTemplate.content.querySelector("tr")?.cloneNode(true) as HTMLTableRowElement;
            testRow.querySelector<HTMLTableCellElement>(".name")!.textContent = test.getName();
            testRow.querySelector<HTMLTableCellElement>(".percent")!.id = `percent-${index}`;
            testRow.querySelector<HTMLTableCellElement>(".bar > div")!.id = `bar-${index}`;
            table.appendChild(testRow);
            index++;
        }
        root.querySelector("#stop-button")?.addEventListener("click", () => {
            this.stop();
        });
        root.querySelector("#toggle-speed-button")?.addEventListener("click", () => {
            this.showAverage = !this.showAverage;
        });
        const script = await this.currentScript;
        if (script != null && document.body.contains(script)) {
            script.after(container);
        } else {
            document.body.appendChild(container);
        }
        return root;
    }

    /** @inheritdoc */
    protected report(): void {
        const root = this.root!;
        const fastestSpeed = this.tests.reduce((fastestSpeed, test) =>
            Math.max(fastestSpeed, this.showAverage ? test.getAverageSpeed() : test.getSpeed()), 0);
        root.querySelector<HTMLSpanElement>("#speed-mode")!.textContent = this.showAverage ? "Average" : "Latest";
        root.querySelector<HTMLSpanElement>("#speed")!.textContent = `${new Intl.NumberFormat("en-US").format(Math.round(fastestSpeed))} ops/s`;

        let index = 0;
        for (const test of this.tests) {
            const speed = this.showAverage ? test.getAverageSpeed() : test.getSpeed();
            const percent = speed === 0 ? 0 : Math.min(100, 100 * speed / fastestSpeed);
            root.querySelector<HTMLTableCellElement>(`#percent-${index}`)!.textContent = `${percent.toFixed(1)} %`;
            root.querySelector<HTMLTableCellElement>(`#bar-${index}`)!.style.width = `${percent.toFixed(1)}%`;
            index++;
        }
        root.querySelector<HTMLDivElement>("#benchmark")!.className = "running";
    }

    /** @inheritdoc */
    public override async run(): Promise<void> {
        const root = this.root = await this.createRoot();
        await super.run();
        root.querySelector<HTMLDivElement>("#benchmark")!.className = "stopped";
    }
}
