/* Partytown 0.8.0 - Loader Logic Updated */
(function(window, document, navigator, top, crossOriginIsolated, config, libPath, timeoutId, scripts, sandbox, currentScope, isLoaded) {
    
    // YENİ EKLEME: Konfigürasyon kontrolü ve güvenli atama
    // Eğer fonksiyona gelen config boşsa, global window'a bak, o da yoksa boş obje oluştur.
    config = config || window.partytown || {};

    function init() {
        if (isLoaded) return;
        isLoaded = 1;
        
        // Kütüphane yolunu belirle
        libPath = (config.lib || "/~partytown/") + (config.debug ? "debug/" : "");
        
        if (libPath[0] == "/") {
            scripts = document.querySelectorAll('script[type="text/partytown"]');
            
            if (top != window) {
                top.dispatchEvent(new CustomEvent("pt1", {
                    detail: window,
                    composed: true
                }));
            } else {
                timeoutId = setTimeout(fallback, 10000);
                document.addEventListener("pt0", clearFallbackTimeout);
                
                if (crossOriginIsolated) {
                    loadSandbox(1);
                } else if (navigator.serviceWorker) {
                    navigator.serviceWorker.register(libPath + (config.swPath || "partytown-sw.js"), {
                        scope: libPath
                    }).then(function(registration) {
                        if (registration.active) {
                            loadSandbox();
                        } else if (registration.installing) {
                            registration.installing.addEventListener("statechange", function(ev) {
                                if (ev.target.state == "activated") {
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

    function loadSandbox(isAtomic) {
        sandbox = document.createElement(isAtomic ? "script" : "iframe");
        if (!isAtomic) {
            sandbox.style.display = "block";
            sandbox.style.width = "0";
            sandbox.style.height = "0";
            sandbox.style.border = "0";
            sandbox.style.visibility = "hidden";
            sandbox.setAttribute("aria-hidden", true);
        }
        sandbox.src = libPath + "partytown-" + (isAtomic ? "atomics.js?v=0.8.0" : "sandbox-sw.html?" + Date.now());
        document.body.appendChild(sandbox);
    }

    function fallback(t, n) {
        clearFallbackTimeout();
        for (t = 0; t < scripts.length; t++) {
            n = document.createElement("script");
            n.innerHTML = scripts[t].innerHTML;
            n.nonce = config.nonce;
            if (scripts[t].src) {
                n.src = scripts[t].src;
            }
            n.type = "text/javascript";
            scripts[t].replaceWith(n);
        }
    }

    function clearFallbackTimeout() {
        clearTimeout(timeoutId);
    }

    if (top == window) {
        // YENİ DÜZELTME: config.forward'ı güvenli oku (optional chaining mantığı)
        (config.forward || []).map(function(item) {
            currentScope = window;
            item.split(".").map(function(part, index, arr) {
                currentScope = currentScope[part] = (index + 1 < arr.length) ?
                    (arr[index + 1] == "push" ? [] : currentScope[part] || {}) :
                    function() {
                        (window._ptf = window._ptf || []).push(arr, arguments);
                    };
            });
        });
    }

    if (document.readyState == "complete") {
        init();
    } else {
        window.addEventListener("DOMContentLoaded", init);
        window.addEventListener("load", init);
    }

})(window, document, navigator, top, window.crossOriginIsolated, window.partytown);