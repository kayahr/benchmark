import { Window } from "happy-dom";

export function installDOM(): void {
    const window = new Window({ url: 'http://localhost/' });

    // Register global DOM stuff
    Object.assign(globalThis, {
        window,
        document: window.document,
        customElements: window.customElements,
        HTMLElement: window.HTMLElement,
        Node: window.Node,
        Element: window.Element,
        HTMLScriptElement: window.HTMLScriptElement,
        Event: window.Event,
        CustomEvent: window.CustomEvent,
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
        MutationObserver: window.MutationObserver
    });

    // Execute JavaScript in appended script elements
    const scripts: HTMLScriptElement[] = [];
    const observer = new MutationObserver(muts => {
        for (const m of muts) {
            for (const node of Array.from(m.addedNodes)) {
                if (node instanceof HTMLScriptElement) {
                    scripts.push(node);
                    // oxlint-disable-next-line no-eval
                    eval(node.src.startsWith("data:application/javascript,") ? node.src.substring(28) : node.textContent);
                    node.dispatchEvent(new Event("load"));
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    Object.defineProperty(document, "scripts", { value: scripts });

    // Set node version to null so benchmark thinks this is a browser
    Object.defineProperty(process.versions, "node", { value: null });
}
