import "./style.css";
import { toggleAudioState, playSound } from "./audio.js";

let gameModule = null;
let gameReady = false;

async function ensureGameLoaded() {
    if (!gameModule) {
        gameModule = await import("./game.js");
    }

    if (!gameReady) {
        const canvas = document.getElementById("gameCanvas");
        if (canvas) {
            gameModule.initGame(canvas);
            gameReady = true;
            
            // If the game section is visible, resume engine immediately
            if (!document.getElementById("section-game").classList.contains("hidden")) {
                gameModule.resumeEngine();
            }
        }
    }

    return gameModule;
}

// Setup Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const gameBtn = document.getElementById("btn-mode-game");
    const readBtn = document.getElementById("btn-mode-read");
    const audioToggle = document.getElementById("audio-toggle");
    const crtToggle = document.getElementById("crt-toggle");

    // Mode Switchers
    gameBtn.addEventListener("click", () => switchMode("game"));
    readBtn.addEventListener("click", () => switchMode("read"));
    document
        .getElementById("btn-skip-read")
        .addEventListener("click", () => switchMode("read"));

    // Audio Toggle
    audioToggle.addEventListener("click", toggleAudio);

    // CRT Toggle
    crtToggle.addEventListener("click", toggleCRT);

    switchMode("game");

    // Start Game Button
    document.getElementById("btn-start-game").addEventListener("click", async () => {
        const module = await ensureGameLoaded();
        module.startGame();
    });

    // Initialize Game Canvas only when the user actually enters game mode
    if (window.matchMedia("(min-width: 769px)").matches) {
        ensureGameLoaded().catch(() => {
            console.warn("Game module failed to load");
        });
    }
});

function switchMode(mode) {
    const gameBtn = document.getElementById("btn-mode-game");
    const readBtn = document.getElementById("btn-mode-read");
    const gameSec = document.getElementById("section-game");
    const readSec = document.getElementById("section-cv");

    const setButtonState = (button, active) => {
        button.setAttribute("aria-pressed", String(active));
        button.className = "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2";
    };

    if (mode === "game") {
        setButtonState(gameBtn, true);
        setButtonState(readBtn, false);
        gameSec.classList.remove("hidden");
        readSec.classList.add("hidden");

        if (gameModule) {
            gameModule.resizeCanvas();
            gameModule.resumeEngine();
        }
    } else {
        setButtonState(readBtn, true);
        setButtonState(gameBtn, false);
        readSec.classList.remove("hidden");
        gameSec.classList.add("hidden");
        
        if (gameModule) {
            gameModule.pauseEngine();
        }
    }
}

function toggleAudio() {
    const isMuted = toggleAudioState();
    const icon = document.getElementById("audio-icon");
    const button = document.getElementById("audio-toggle");

    button.setAttribute("aria-pressed", String(isMuted));
    button.setAttribute("aria-label", isMuted ? "Enable audio" : "Mute audio");

    if (isMuted) {
        icon.textContent = "🔇";
        icon.className = "text-red-400";
    } else {
        icon.textContent = "🔊";
        icon.className = "text-emerald-400";
        playSound("powerup");
    }
}

function toggleCRT() {
    const crt = document.getElementById("crt-screen");
    const button = document.getElementById("crt-toggle");
    const isHidden = crt.classList.toggle("hidden");

    button.setAttribute("aria-pressed", String(isHidden ? false : true));
    button.setAttribute(
        "aria-label",
        isHidden ? "Enable CRT effect" : "Disable CRT effect",
    );
}
