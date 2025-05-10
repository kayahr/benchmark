/*
 * Copyright (C) 2025 Klaus Reimer <k@ailis.de>
 * See LICENSE.md for licensing information
 */

import { TestRunner } from "./TestRunner.js";

/** The HTML/CSS template used for benchmark output. */
const template = `
  <style>
    #benchmark {
      border: solid 1px black;
      padding: 1px;
    }
    table {
      box-sizing: border-box;
      width: 100%;
      margin: 0px;
      padding: 0;
      border: solid 1px black;
      border-collapse: collapse;
    }
    td, th {
      border-left: solid 1px black;
      text-align: start;
      text-wrap: nowrap;
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
      width: 100%;
    }
    td.bar > div {
      height: 0.5em;
      background-color: black;
    }
    #speed {
        float: right;
    }
  </style>
  <div id="benchmark">
    <table id="table">
      <tr>
        <th>Test</th>
        <th colspan="2">Speed (<span id="speed-mode"></span>)<span id="speed"></span></th>
      </tr>
      <template id="test">
        <tr>
          <td class="name"></th>
          <td class="percent"></th>
          <td class="bar">
            <div class="bar"><div>
          </th>
        </tr>
      </template>
    </table>
  </div>
  <p id="benchmarking">
    Benchmarking... <button id="stop-button">Stop</button> <button id="toggle-speed-button">Toggle Speed</button>
  </p>
`;

/**
 * Browser implementation of a benchmark test runner.
 */
export class BrowserTestRunner extends TestRunner {
    /** @inheritDoc */
    protected initOutput(): void {
        document.body.innerHTML = template;
        const testTemplate = document.getElementById("test") as HTMLTemplateElement;
        const table = document.getElementById("table") as HTMLTableElement;
        let index = 0;
        for (const test of this.tests) {
            const testRow = testTemplate.content.cloneNode(true) as HTMLTableRowElement;
            (testRow.querySelector(".name") as HTMLTableCellElement).textContent = test.getName();
            (testRow.querySelector(".percent") as HTMLTableCellElement).id = `percent-${index}`;
            (testRow.querySelector(".bar > div") as HTMLTableCellElement).id = `bar-${index}`;
            table.appendChild(testRow);
            index++;
        }
        document.getElementById("stop-button")?.addEventListener("click", () => {
            document.getElementById("benchmarking")?.remove();
            this.stop();
        });
        document.getElementById("toggle-speed-button")?.addEventListener("click", () => {
            this.showAverage = !this.showAverage;
        });
    }

    /** @inheritDoc */
    protected updateOutput(): void {
        const fastestSpeed = this.tests.reduce((fastestSpeed, test) => Math.max(fastestSpeed, this.showAverage ? test.getAverageSpeed() : test.getSpeed()), 0);
        (document.getElementById("speed-mode") as HTMLSpanElement).textContent = this.showAverage ? "Average" : "Latest";
        (document.getElementById("speed") as HTMLSpanElement).textContent = new Intl.NumberFormat("en-US").format(Math.round(fastestSpeed)) + " ops/s";

        let index = 0;
        for (const test of this.tests) {
            const speed = this.showAverage ? test.getAverageSpeed() : test.getSpeed();
            const percent = speed === 0 ? 0 : Math.min(100, 100 * speed / fastestSpeed);
            (document.getElementById(`percent-${index}`) as HTMLTableCellElement).textContent = `${percent.toFixed(1)} %`;
            (document.getElementById(`bar-${index}`) as HTMLTableCellElement).style.width = `${percent.toFixed(1)}%`;
            index++;
        }
    }

    /** @inheritDoc */
    protected override error(message: string): void {
        this.status(message);
    }

    /** @inheritDoc */
    protected override status(message: string): void {
        document.body.textContent = message;
    }
}
