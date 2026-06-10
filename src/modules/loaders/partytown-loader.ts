export {};

interface PartytownConfig {
  lib?: string;
  debug?: boolean;
  swPath?: string;
  nonce?: string;
  forward?: string[];
}

declare global {
  interface Window {
    partytown?: PartytownConfig;
    _ptf?: [string[], IArguments][];
    crossOriginIsolated?: boolean;
  }
}

(function (
  win: Window & typeof globalThis,
  doc: Document,
  nav: Navigator,
  topWin: Window,
  crossOriginIsolated: boolean | undefined,
  config: PartytownConfig,
  libPath: string,
  timeoutId: ReturnType<typeof setTimeout> | undefined,
  scripts: NodeListOf<HTMLScriptElement>,
  sandbox: HTMLScriptElement | HTMLIFrameElement | undefined,
  currentScope: Record<string, unknown>,
  isLoaded: number
) {
  config = config || win.partytown || {};

  function init(): void {
    if (isLoaded) return;
    isLoaded = 1;

    libPath = (config.lib || "/~partytown/") + (config.debug ? "debug/" : "");

    if (libPath[0] == "/") {
      scripts = doc.querySelectorAll<HTMLScriptElement>('script[type="text/partytown"]');

      if (topWin != win) {
        topWin.dispatchEvent(
          new CustomEvent("pt1", {
            detail: win,
            composed: true,
          })
        );
      } else {
        timeoutId = setTimeout(fallback, 10000);
        doc.addEventListener("pt0", clearFallbackTimeout);

        if (crossOriginIsolated) {
          loadSandbox(1);
        } else if (nav.serviceWorker) {
          nav.serviceWorker
            .register(libPath + (config.swPath || "partytown-sw.js"), {
              scope: libPath,
            })
            .then(function (registration: ServiceWorkerRegistration) {
              if (registration.active) {
                loadSandbox();
              } else if (registration.installing) {
                registration.installing.addEventListener("statechange", function (ev: Event) {
                  if ((ev.target as ServiceWorker)?.state == "activated") {
                    loadSandbox();
                  }
                });
              }
            }, console.error);
        } else {
          fallback();
        }
      }
    }
  }

  function loadSandbox(isAtomic?: number): void {
    sandbox = doc.createElement(isAtomic ? "script" : "iframe") as HTMLScriptElement | HTMLIFrameElement;
    if (!isAtomic) {
      const frame = sandbox as HTMLIFrameElement;
      frame.style.display = "block";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.style.visibility = "hidden";
      frame.setAttribute("aria-hidden", "true");
    }
    sandbox.src =
      libPath + "partytown-" + (isAtomic ? "atomics.js?v=0.8.0" : "sandbox-sw.html?" + Date.now());
    doc.body?.appendChild(sandbox);
  }

  function fallback(): void {
    clearFallbackTimeout();
    for (let t = 0; t < scripts.length; t++) {
      const n = doc.createElement("script");
      n.innerHTML = scripts[t].innerHTML;
      n.nonce = config.nonce;
      if (scripts[t].src) {
        n.src = scripts[t].src;
      }
      n.type = "text/javascript";
      scripts[t].replaceWith(n);
    }
  }

  function clearFallbackTimeout(): void {
    clearTimeout(timeoutId);
  }

  if (topWin == win) {
    (config.forward ?? []).map(function (item: string) {
      currentScope = win as unknown as Record<string, unknown>;
      item.split(".").map(function (part: string, index: number, arr: string[]) {
        currentScope = (currentScope[part] = (index + 1 < arr.length)
          ? (arr[index + 1] == "push" ? [] : currentScope[part] || {})
          : function () {
              (win._ptf = win._ptf || []).push([arr, arguments as unknown as IArguments]);
            }) as Record<string, unknown>;
      });
    });
  }

  if (doc.readyState == "complete") {
    init();
  } else {
    win.addEventListener("DOMContentLoaded", init);
    win.addEventListener("load", init);
  }
})(
  window,
  document,
  navigator,
  top as Window,
  window.crossOriginIsolated,
  window.partytown as PartytownConfig,
  "",
  undefined,
  document.querySelectorAll<HTMLScriptElement>('script[type="text/partytown"]'),
  undefined,
  {} as Record<string, unknown>,
  0
);
