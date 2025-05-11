/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { getCurrentScript } from "./script.js";
import { TestRunner } from "./TestRunner.js";

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
    <table id="table">
      <tr>
        <th>Test</th>
        <th colspan="2">Speed (<span id="speed-mode"></span>)<span id="speed"></span></th>
      </tr>
      <template id="test">
        <tr>
          <td class="name"></th>
          <td class="percent">000.0 %</th>
          <td class="bar">
            <div class="bar"><div>
          </th>
        </tr>
      </template>
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
        const root = container.attachShadow({ mode: "closed" });
        root.innerHTML = template;
        (root.querySelector("#num-tests") as HTMLSpanElement).textContent = String(this.tests.length);
        (root.querySelector("#speed-mode") as HTMLSpanElement).textContent = this.showAverage ? "Average" : "Latest";
        const testTemplate = root.querySelector("#test") as HTMLTemplateElement;
        const table = root.querySelector("#table") as HTMLTableElement;
        let index = 0;
        for (const test of this.tests) {
            const testRow = testTemplate.content.cloneNode(true) as HTMLTableRowElement;
            (testRow.querySelector(".name") as HTMLTableCellElement).textContent = test.getName();
            (testRow.querySelector(".percent") as HTMLTableCellElement).id = `percent-${index}`;
            (testRow.querySelector(".bar > div") as HTMLTableCellElement).id = `bar-${index}`;
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
            script.insertAdjacentElement("afterend", container);
        } else {
            document.body.appendChild(container);
        }
        return root;
    }

    /** @inheritDoc */
    protected report(): void {
        const root = this.root;
        if (root == null) {
            return;
        }
        const fastestSpeed = this.tests.reduce((fastestSpeed, test) => Math.max(fastestSpeed, this.showAverage ? test.getAverageSpeed() : test.getSpeed()), 0);
        (root.querySelector("#speed-mode") as HTMLSpanElement).textContent = this.showAverage ? "Average" : "Latest";
        (root.querySelector("#speed") as HTMLSpanElement).textContent = new Intl.NumberFormat("en-US").format(Math.round(fastestSpeed)) + " ops/s";

        let index = 0;
        for (const test of this.tests) {
            const speed = this.showAverage ? test.getAverageSpeed() : test.getSpeed();
            const percent = speed === 0 ? 0 : Math.min(100, 100 * speed / fastestSpeed);
            (root.querySelector(`#percent-${index}`) as HTMLTableCellElement).textContent = `${percent.toFixed(1)} %`;
            (root.querySelector(`#bar-${index}`) as HTMLTableCellElement).style.width = `${percent.toFixed(1)}%`;
            index++;
        }
        (root.querySelector("#benchmark") as HTMLDivElement).className = "running";
    }

    /** @inheritDoc */
    public override async run(): Promise<void> {
        const root = this.root = await this.createRoot();
        await super.run();
        (root.querySelector("#benchmark") as HTMLDivElement).className = "stopped";
    }
}
