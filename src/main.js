import './style.css';
import { toggleAudioState, playSound } from './audio.js';
import { initGame, startGame, resizeCanvas, setGamePaused } from './game.js';

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mode Switchers
    document.getElementById('btn-mode-game').addEventListener('click', () => switchMode('game'));
    document.getElementById('btn-mode-read').addEventListener('click', () => switchMode('read'));
    document.getElementById('btn-skip-read').addEventListener('click', () => switchMode('read'));

    // Audio Toggle
    document.getElementById('audio-toggle').addEventListener('click', toggleAudio);

    // CRT Toggle
    document.getElementById('crt-toggle').addEventListener('click', toggleCRT);

    // Start Game Button
    document.getElementById('btn-start-game').addEventListener('click', startGame);

    // Initialize Game Canvas
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        initGame(canvas);
    }
});

function switchMode(mode) {
    const gameBtn = document.getElementById('btn-mode-game');
    const readBtn = document.getElementById('btn-mode-read');
    const gameSec = document.getElementById('section-game');
    const readSec = document.getElementById('section-cv');

    if (mode === 'game') {
        gameBtn.className = "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-cyan-500 !text-black";
        readBtn.className = "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-slate-800";
        gameSec.classList.remove('hidden');
        readSec.classList.add('hidden');
        setGamePaused(false);
        resizeCanvas();
    } else {
        readBtn.className = "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-cyan-500 !text-black";
        gameBtn.className = "pixel-btn text-[13px] md:text-[16px] !py-1 !px-2 bg-slate-800";
        readSec.classList.remove('hidden');
        gameSec.classList.add('hidden');
        setGamePaused(true);
    }
}

function toggleAudio() {
    const isMuted = toggleAudioState();
    const icon = document.getElementById('audio-icon');
    if (isMuted) {
        icon.className = 'fa-solid fa-volume-xmark text-red-400';
    } else {
        icon.className = 'fa-solid fa-volume-high text-emerald-400';
        playSound('powerup');
    }
}

function toggleCRT() {
    const crt = document.getElementById('crt-screen');
    if (crt) {
        crt.classList.toggle('hidden');
    }
}
