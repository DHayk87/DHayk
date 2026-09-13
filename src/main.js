import "./style.css";
import { toggleAudioState, playSound } from "./audio.js";
import { initGame, startGame, resizeCanvas, setGamePaused } from "./game.js";

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
    document.getElementById("btn-start-game").addEventListener("click", startGame);

    // Initialize Game Canvas
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
        initGame(canvas);
    }
});

function switchMode(mode) {
    const gameBtn = document.getElementById("btn-mode-game");
    const readBtn = document.getElementById("btn-mode-read");
    const gameSec = document.getElementById("section-game");
    const readSec = document.getElementById("section-cv");

    const setButtonState = (button, active) => {
        button.setAttribute("aria-pressed", String(active));
        button.className = active
            ? "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-cyan-500 !text-black"
            : "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-slate-800";
    };

    if (mode === "game") {
        setButtonState(gameBtn, true);
        setButtonState(readBtn, false);
        gameSec.classList.remove("hidden");
        readSec.classList.add("hidden");
        setGamePaused(false);
        resizeCanvas();
    } else {
        setButtonState(readBtn, true);
        setButtonState(gameBtn, false);
        readSec.classList.remove("hidden");
        gameSec.classList.add("hidden");
        setGamePaused(true);
    }
}

function toggleAudio() {
    const isMuted = toggleAudioState();
    const icon = document.getElementById("audio-icon");
    const button = document.getElementById("audio-toggle");

    button.setAttribute("aria-pressed", String(isMuted));
    button.setAttribute("aria-label", isMuted ? "Enable audio" : "Mute audio");

    if (isMuted) {
        icon.className = "fa-solid fa-volume-xmark text-red-400";
    } else {
        icon.className = "fa-solid fa-volume-high text-emerald-400";
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
