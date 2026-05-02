import gsap from "gsap";
import { client } from "../../lib/sanityClient.js";
import i18next, { changeLanguage } from "../../lib/i18n.js";

/**
 * Silvio Chatbot Loader v2.1
 * Added i18n Support & Video Controls
 */
export default async function(container) {
    if (!container) return;

    // --- DOM ELEMENTS ---
    const chatLog = container.querySelector("#chat-log");
    const chatInput = container.querySelector("#chat-input");
    const sendBtn = container.querySelector("#send-btn");
    const video = document.querySelector("#silvio-video"); 
    const processingIndicator = container.querySelector("#processing-indicator");
    const videoToggle = document.querySelector("#video-toggle");
    const videoIcon = document.querySelector("#video-icon");
    const videoText = document.querySelector("#video-text");
    const omertaOverlay = document.querySelector("#omerta-overlay");
    
    let isProcessing = false;
    let processingInterval = null;



    // --- SANITY FETCH LOGIC ---
    let characters = {}; // Will be populated dynamically

    const fetchSanityData = async () => {
        try {
            // GROQ Query to map schema fields to chatbot format
            const query = `*[_type == "character" && !(_id in path('drafts.**'))]{
              name,
              "key": slug.current,
              "level": title,
              "bio": description,
              "aliases": select(defined(alias) => [alias], [])
            }`;

            const data = await client.fetch(query);
            
            // Map Sanity data to characters object
            data.forEach(char => {
                const charData = { 
                    name: char.name, 
                    level: char.level, 
                    bio: char.bio,
                    key: char.key // Store canonical slug for theme logic
                };
                
                // Map slug as key (e.g., "roland")
                if (char.key) characters[char.key] = charData;
                
                // Map aliases as keys (e.g., "ravenwood", "karga")
                if (char.aliases && Array.isArray(char.aliases)) {
                    char.aliases.forEach(alias => {
                        const aliasKey = alias.toLowerCase(); // Keep spaces for text matching
                        characters[aliasKey] = charData;
                    });
                }
            });
            console.log("Sanity Intel Loaded:", Object.keys(characters).length, "subjects.");

        } catch (error) {
            console.error("Sanity Connection Dropped.", error);
            // Optionally: Show a UI error explicitly
        }
    };

    // Initialize Intelligence
    await fetchSanityData();

    const getProcessingTexts = () => [
        i18next.t("silvio_page.processing.analyzing"),
        i18next.t("silvio_page.processing.consulting"),
        i18next.t("silvio_page.processing.decrypting"),
        i18next.t("silvio_page.processing.tracing")
    ];

    // --- OMERTA INTRO ---
    if (omertaOverlay) {
        const acceptBtn = omertaOverlay.querySelector("#omerta-accept-btn");
        const consentCheckbox = omertaOverlay.querySelector("#omerta-consent");

        if (consentCheckbox && acceptBtn) {
            consentCheckbox.addEventListener("change", () => {
                acceptBtn.disabled = !consentCheckbox.checked;
            });
        }

        // --- SES PROTOKOLÜ ---
        let currentAudio = null;

        const playOmertaVoice = (onComplete) => {
            // 1. Dil Tespiti
            const lang = (i18next && i18next.language) || navigator.language;
            const isTurkish = lang.startsWith("tr");

            // 2. Dosya Seçimi
            const audioPath = isTurkish 
                ? "/assets/audio/omerta_intro_tr.mp3" 
                : "/assets/audio/omerta_intro_en.mp3";

            // Stop previous if any
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }

            // 3. Audio Nesnesi Yarat
            currentAudio = new Audio(audioPath);
            currentAudio.volume = 1.0; 

            // 4. Varsa Arka Plan Müziğini Kıs
            const bgMusic = window.backgroundMusic || document.querySelector("#bg-music") || document.querySelector("audio"); 
            
            if (bgMusic && typeof bgMusic.play === 'function') {
                 gsap.to(bgMusic, { volume: 0.1, duration: 2 }); 
            }

            // 5. Oynat
            currentAudio.play().then(() => {
                console.log(`[Omerta] Voice Protocol Initiated: ${isTurkish ? 'TR' : 'EN'}`);
            }).catch(err => {
                console.warn("[Omerta] Voice blocked by browser policy:", err);
                // If blocked, just enable button immediately
                if (onComplete) onComplete();
            });

            // 6. Ses Bitince Müziği Geri Aç ve Callback
            currentAudio.onended = () => {
                if (bgMusic && typeof bgMusic.play === 'function') {
                    gsap.to(bgMusic, { volume: 0.5, duration: 3 }); 
                }
                if (onComplete) onComplete();
            };
        };

        if (consentCheckbox && acceptBtn) {
            consentCheckbox.addEventListener("change", () => {
                if (consentCheckbox.checked) {
                    // Start Audio, disable button until done
                    acceptBtn.disabled = true;
                    acceptBtn.style.opacity = "0.5";
                    acceptBtn.style.cursor = "not-allowed";
                    
                    playOmertaVoice(() => {
                        // On Audio Complete
                        acceptBtn.disabled = false;
                        acceptBtn.style.opacity = "1";
                        acceptBtn.style.cursor = "pointer";
                        // Visual feedback that it's ready
                        gsap.fromTo(acceptBtn, { scale: 1 }, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
                    });
                } else {
                    // Checkbox unchecked
                    acceptBtn.disabled = true;
                    acceptBtn.style.opacity = "0.5";
                    acceptBtn.style.cursor = "not-allowed";
                    
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                    }
                    // Restore music volume immediately if unchecked
                    const bgMusic = window.backgroundMusic || document.querySelector("#bg-music") || document.querySelector("audio"); 
                    if (bgMusic) gsap.to(bgMusic, { volume: 0.5, duration: 1 });
                }
            });
        }

        if (acceptBtn) {
            acceptBtn.addEventListener("click", () => {
                // 1. Button State
                const btnText = acceptBtn.querySelector("span");
                if (btnText) btnText.innerText = i18next.t("silvio_page.omerta.access_granted");
                acceptBtn.classList.remove("text-gold/40", "border-gold/20");
                acceptBtn.classList.add("text-black", "bg-gold", "border-gold", "shadow-[0_0_20px_rgba(197,160,89,0.8)]");
                
                // 2. Cinematic Exit Sequence (TV Turn Off)
                const tl = gsap.timeline({
                    onComplete: () => {
                        omertaOverlay.style.display = "none";
                        if (video && !video.paused) video.play();
                        
                        // Reveal Chat Interface
                        gsap.fromTo("#chatbot-wrapper", 
                            { opacity: 0, y: 50, filter: "blur(20px)" }, 
                            { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power2.out" }
                        );
                        
                        chatInput.focus();
                    }
                });

                // Step A: Glitch & Distort
                tl.to(omertaOverlay, { duration: 0.1, className: "+=glitch-active" })
                  .to(omertaOverlay, { duration: 0.2, scale: 1.02, filter: "brightness(1.5) contrast(1.2)" })
                  
                // Step B: Screen Collapse (Vertical)
                  .to(omertaOverlay, { 
                      duration: 0.3, 
                      scaleY: 0.005, 
                      scaleX: 1, 
                      ease: "power2.in" 
                  })
                  
                // Step C: Screen Zipping (Horizontal) + White Flash
                  .to(omertaOverlay, { 
                      duration: 0.2, 
                      scaleX: 0, 
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 100px 50px rgba(255,255,255,0.8)",
                      ease: "power4.out" 
                  });
            });
        }

        // Language Switcher Logic (Omerta) - Re-binding to ensure priority
        const langBtns = document.querySelectorAll("#omerta-overlay .lang-btn");
        console.log("Found Omerta Lang Buttons:", langBtns.length);

        langBtns.forEach(btn => {
            btn.style.cursor = "pointer"; // Force cursor
            btn.style.pointerEvents = "auto"; // Force pointer events

            // Remove existing listeners if any (cloning hack)
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = newBtn.getAttribute("data-lang");
                console.log("Omerta: Switching language to", lang);
                
                await changeLanguage(lang); // Use the wrapper from i18n.js which calls updateContent()
                
                // Sync Glitch Text
                const glitchHeader = omertaOverlay.querySelector(".glitch-text");
                if (glitchHeader) {
                   glitchHeader.setAttribute("data-text", glitchHeader.innerText);
                }

                // Update Active State
                const allBtns = document.querySelectorAll("#omerta-overlay .lang-btn");
                allBtns.forEach(b => b.classList.remove("text-gold", "underline"));
                newBtn.classList.add("text-gold", "underline");
            });
        });

        // --- EASTER EGG: İPLİKÇİ NEDİM PROTOKOLÜ ---
        const triggerIplikciEgg = () => {
            console.log("TSOF // SYSTEM HACK DETECTED: IPLIKCI_MODE");

            // Pause background video if it exists
            if (video && !video.paused) {
                video.pause();
                video.dataset.wasPlaying = "true";
            }

            // Modal Container
            const modal = document.createElement("div");
            Object.assign(modal.style, {
                position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
                backgroundColor: "rgba(0,0,0,0.95)", zIndex: "10000",
                display: "flex", justifyContent: "center", alignItems: "center",
                flexDirection: "column", cursor: "pointer", backdropFilter: "blur(10px)"
            });

            // Video Container
            const videoContainer = document.createElement("div");
            Object.assign(videoContainer.style, {
                width: "80%", maxWidth: "900px", aspectRatio: "16/9",
                border: "2px solid #c5a059", boxShadow: "0 0 50px rgba(197, 160, 89, 0.3)",
                position: "relative", backgroundColor: "#000"
            });

            // YouTube Iframe
            // start=4: "Suskunluk Yasası" moment
            const iframe = document.createElement("iframe");
            iframe.src = "https://www.youtube.com/embed/BiPTwActB-E?start=4&autoplay=1&rel=0"; 
            iframe.width = "100%";
            iframe.height = "100%";
            iframe.frameBorder = "0";
            iframe.allow = "autoplay; encrypted-media";
            
            // Close Hint
            const closeHint = document.createElement("p");
            closeHint.innerText = "// KONSEYİ KAPATMAK İÇİN TIKLA //";
            Object.assign(closeHint.style, {
                color: "#c5a059", fontFamily: "'Courier Prime', monospace", 
                marginTop: "30px", fontSize: "12px", letterSpacing: "0.2em",
                textShadow: "0 0 10px rgba(197, 160, 89, 0.5)",
                animation: "pulse 2s infinite"
            });

            videoContainer.appendChild(iframe);
            modal.appendChild(videoContainer);
            modal.appendChild(closeHint);
            document.body.appendChild(modal);

            // Close Logic
            modal.addEventListener("click", () => {
                modal.remove();
                if (video && video.dataset.wasPlaying === "true") {
                    video.play();
                    delete video.dataset.wasPlaying;
                }
            });
        };

        // Trigger Setup
        const glitchHeader = omertaOverlay.querySelector(".glitch-text");
        if (glitchHeader) {
            glitchHeader.style.cursor = "help"; // Hint cursor
            glitchHeader.title = "Konseyi Topla"; // Tooltip
            
            glitchHeader.addEventListener("click", (e) => {
                e.stopPropagation();
                triggerIplikciEgg();
            });
        }
    }

    // --- TOOLTIP SETUP ---
    const tooltip = document.createElement("div");
    tooltip.className = "character-tooltip";
    document.body.appendChild(tooltip);

    // Initial State
    if (video) {
        video.pause();
        // Power Saving: Pause video when tab is hidden
        document.addEventListener("visibilitychange", () => {
            if (document.hidden && !video.paused) {
                video.dataset.wasPlaying = "true";
                video.pause();
            } else if (!document.hidden && video.dataset.wasPlaying === "true") {
                video.play();
                delete video.dataset.wasPlaying;
            }
        });
    }

    // --- VIDEO CONTROLS ---
    if (videoToggle && video) {
        videoToggle.addEventListener("click", () => {
            if (video.paused) {
                video.play();
                videoIcon.classList.replace("fa-play", "fa-pause");
                videoText.setAttribute("data-i18n", "silvio_page.video_controls.pause");
                videoText.innerText = i18next.t("silvio_page.video_controls.pause");
            } else {
                video.pause();
                videoIcon.classList.replace("fa-pause", "fa-play");
                videoText.setAttribute("data-i18n", "silvio_page.video_controls.play");
                videoText.innerText = i18next.t("silvio_page.video_controls.play");
            }
        });
    }

    // --- PARSERS ---

    const formatText = (text) => {
        // 1. Convert Highlight (==text==) to HTML
        let html = text.replace(/==(.*?)==/g, '<span class="highlight">$1</span>');

        // 2. Convert Bold (**text**) to HTML
        // 2. Convert Bold (**text**) to HTML
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // 2.1 Convert Italics (*text*) to HTML
        html = html.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
        
        // 3. Inject Character References (Case insensitive)
        const keys = Object.keys(characters).sort((a, b) => b.length - a.length); // Longest first to avoid partial matches
        const regex = new RegExp(`\\b(${keys.join("|")})\\b`, "gi");
        
        html = html.replace(regex, (match) => {
            const key = match.toLowerCase();
            // Dynamic lookup: Any matched key exists in our characters map (including aliases)
            return `<span class="character-ref" data-character="${key}">${match}</span>`;
        });

        return html;
    };

    // --- ANIMATION & UI ---

    const addMessage = (text, isUser = false) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = isUser ? "user-message" : "silvio-message";
        
        // Initial State for Animation
        msgDiv.style.opacity = "0";
        msgDiv.style.filter = "blur(12px)"; 
        msgDiv.style.transform = "translateY(10px)";

        if (isUser) {
            msgDiv.innerHTML = `<p>${formatText(text)}</p>`;
            chatLog.appendChild(msgDiv);
            gsap.to(msgDiv, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.8, ease: "power2.out" });
        } else {
            // Silvio's Message
            if (Math.random() > 0.4) msgDiv.classList.add("stamped");
            
            const p = document.createElement("p");
            msgDiv.appendChild(p);
            chatLog.appendChild(msgDiv);
            
            // Add Intel Header (Luxury Noir)
            const header = document.createElement("span");
            header.className = "silvio-msg-header";
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            header.innerText = `${i18next.t("silvio_page.headers.source")}: OMEGA // ${i18next.t("silvio_page.headers.time")}: ${time}`;
            msgDiv.prepend(header);

            // 1. Reveal Container (Mist-in)
            gsap.to(msgDiv, { opacity: 1, filter: "blur(0px)", y: 0, duration: 1.5, ease: "power2.out" });

            // 2. Typewriter Effect
            let i = 0;
            const speed = 25; // Slightly slower for better readability
            
            const interval = setInterval(() => {
                p.textContent += text.charAt(i);
                i++;
                
                // Optimized scrolling
                if (i % 5 === 0) chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: "auto" });

                if (i >= text.length) {
                    clearInterval(interval);
                    p.innerHTML = formatText(text); 
                    chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: "smooth" });
                }
            }, speed);
        }
    };

    const handleThemeShift = (text) => {
        const lowerText = text.toLowerCase();
        document.body.classList.remove("theme-roland", "theme-silvio", "glitch-active");

        // Dynamic Theme Logic
        // Check if any known character key/alias is present in the text
        const keys = Object.keys(characters);
        const matchedKey = keys.find(key => lowerText.includes(key));

        if (matchedKey) {
            const charData = characters[matchedKey];
            const identity = charData.key; // The canonical slug (e.g., 'roland')

            if (identity === 'roland') document.body.classList.add("theme-roland");
            else if (identity === 'silvio') document.body.classList.add("theme-silvio");
        }

        // Keep glitch easter egg (unless 'Creator' becomes a character later)
        if (lowerText.match(/mimar|yaratıcı|creator/)) {
            document.body.classList.add("glitch-active");
            setTimeout(() => document.body.classList.remove("glitch-active"), 2000);
        }
    };

    // --- API HANDLER ---
    const askSilvio = async (question) => {
        try {
            const PRODUCTION_URL = "https://europe-west3-sins-of-the-fathers.cloudfunctions.net/askTheNovel";
            const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
                ? "http://localhost:3000/api/ask" 
                : PRODUCTION_URL;

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            if (!res.ok) throw new Error(i18next.t("silvio_page.errors.server"));
            const data = await res.json();
            return data.response || i18next.t("silvio_page.errors.connection");

        } catch (error) {
            console.error("API Error:", error);
            return i18next.t("silvio_page.errors.connection");
        }
    };

    // --- INTERACTION ---
    const handleSendMessage = async () => {
        const question = chatInput.value.trim();
        if (!question || isProcessing) return;

        isProcessing = true;
        sendBtn.disabled = true;
        chatInput.disabled = true;
        chatInput.value = "";

        addMessage(question, true);

        // Video Reaction
        if (video) {
            if (video.paused) video.play(); 
            gsap.to(video, { filter: "brightness(0.9) grayscale(0) contrast(1.2)", duration: 1.5 });
            videoIcon.classList.replace("fa-play", "fa-pause");
        }

        // Processing UI - FIXED CYCLING
        const processingTexts = getProcessingTexts();
        let currentIdx = 0;
        
        processingIndicator.innerHTML = `${processingTexts[currentIdx]} <span class="dots">...</span>`;
        processingIndicator.classList.add("active");
        
        processingInterval = setInterval(() => {
            currentIdx = (currentIdx + 1) % processingTexts.length;
            processingIndicator.innerHTML = `${processingTexts[currentIdx]} <span class="dots">...</span>`;
        }, 1500);
        
        handleThemeShift(question);

        // Fetch Answer
        const response = await askSilvio(question);

        // Reset UI
        clearInterval(processingInterval);
        isProcessing = false;
        chatInput.disabled = false;
        chatInput.focus();
        processingIndicator.classList.remove("active");
        
        // Revert Video
        if (video) gsap.to(video, { filter: "brightness(0.6) grayscale(0.5) contrast(1.1)", duration: 2 });
        
        addMessage(response);
    };

    // --- SPEECH RECOGNITION (Google STT) ---
    const micBtn = container.querySelector("#mic-btn");
    
    if (micBtn && ('webkitSpeechRecognition' in window)) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = i18next.language || 'en-US'; 

        recognition.onstart = () => {
             micBtn.classList.add("listening");
             chatInput.placeholder = i18next.t("silvio_page.placeholder_listening") || "Listening...";
        };

        recognition.onend = () => {
             micBtn.classList.remove("listening");
             chatInput.placeholder = i18next.t("silvio_page.placeholder");
        };

        recognition.onresult = (event) => {
             const transcript = event.results[0][0].transcript;
             chatInput.value = transcript;
             // Optional: Auto-send? Let's keep it manual for safety.
             chatInput.focus();
        };

        micBtn.addEventListener("click", () => {
            recognition.lang = i18next.language; // Update lang just in case
            recognition.start();
        });
    } else if (micBtn) {
        micBtn.style.display = 'none'; // Hide if not supported
    }

    // --- EVENT LISTENERS ---
    
    chatLog.addEventListener("mouseover", (e) => {
        if (e.target.classList.contains("character-ref")) {
            const key = e.target.getAttribute("data-character");
            const data = characters[key];
            if (data) {
                tooltip.innerHTML = `
                    <div class="tooltip-header">
                        <span class="level">LEVEL: ${data.level}</span>
                        <span class="status">● TRACKING</span>
                    </div>
                    <h3>${data.name}</h3>
                    <p>${data.bio}</p>
                `;
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.top - 160}px`;
                tooltip.classList.add("visible");
            }
        }
    });

    chatLog.addEventListener("mouseout", (e) => {
        if (e.target.classList.contains("character-ref")) {
            tooltip.classList.remove("visible");
        }
    });

    sendBtn.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleSendMessage(); });
}
