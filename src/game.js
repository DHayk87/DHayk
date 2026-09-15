import { initAudio, playSound } from "./audio.js";
import { loadHighScore, saveHighScore, loadUnlockedSkills, saveUnlockedSkills } from "./game/storage.js";
import { 
    Player, Bullet, Enemy, Powerup, Particle, 
    enemyTypes, skillDrops, getPerformanceProfile, 
    createStarfield, isColliding 
} from "./game/entities.js";

// Re-export for tests
export { createStarfield, isColliding };

let canvas, ctx;
let isGameRunning = false;
let isPaused = false;
let score = 0;
let highScore = 9990;
let unlockedSkills = new Set();
let enemySpawnTimer = 0;
let starfield = [];
let hud = {};

let lastTime = 0;
let animationFrameId = null;

const player = new Player();
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];
let keys = { left: false, right: false, space: false };

function cacheHud() {
    hud = {
        score: document.getElementById("game-score"),
        highScore: document.getElementById("game-highscore"),
        unlocked: document.getElementById("game-unlocked-count"),
        overlay: document.getElementById("game-overlay"),
        title: document.getElementById("overlay-title"),
        subtitle: document.getElementById("overlay-subtitle"),
        startButton: document.getElementById("btn-start-game"),
    };
}

function updateScoreHud() {
    if (hud.score) hud.score.textContent = String(score).padStart(5, "0");
}

function updateUnlockedHud() {
    if (hud.unlocked) hud.unlocked.textContent = `${unlockedSkills.size} / 6`;
    syncSkillsToCV();
}

function syncSkillsToCV() {
    // Add visually unlocked styles in CV mode
    const skillElements = document.querySelectorAll('[data-skill]');
    skillElements.forEach(el => {
        const skillName = el.getAttribute('data-skill');
        if (unlockedSkills.has(skillName)) {
            el.classList.add('skill-unlocked');
        }
    });
}

function resetStarfield() {
    if (!canvas) return;
    starfield = createStarfield(canvas.width, canvas.height);
}

export function initGame(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext("2d");
    
    highScore = loadHighScore();
    unlockedSkills = loadUnlockedSkills();
    cacheHud();
    
    if (hud.highScore) hud.highScore.textContent = String(highScore).padStart(5, "0");
    updateUnlockedHud();

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    setupKeyboardControls();
    setupTouchControls();

    // Do not start the game loop yet, main.js will resume it.
}

export function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 400;
    resetStarfield();
}

function setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            keys.left = true;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            keys.right = true;
        }
        if (
            e.key === " " ||
            e.key === "Spacebar" ||
            e.key === "ArrowUp" ||
            e.key === "w" ||
            e.key === "W"
        ) {
            if (isGameRunning && !isPaused && !keys.space) {
                shootBullet();
            }
            keys.space = true;
        }
        if (e.key === "p" || e.key === "P") {
            if (isGameRunning) isPaused = !isPaused;
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            keys.left = false;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            keys.right = false;
        }
        if (
            e.key === " " ||
            e.key === "Spacebar" ||
            e.key === "ArrowUp" ||
            e.key === "w" ||
            e.key === "W"
        ) {
            keys.space = false;
        }
    });
}

function setupTouchControls() {
    const btnLeft = document.getElementById("btn-left");
    const touchZoneLeft = document.getElementById("touch-zone-left");

    const btnRight = document.getElementById("btn-right");
    const touchZoneRight = document.getElementById("touch-zone-right");

    const btnFire = document.getElementById("btn-fire");
    const touchZoneFire = document.getElementById("touch-zone-fire");

    const bindTouchAndMouse = (containerElem, btnElem, onStart, onEnd) => {
        if (!containerElem) return;

        const startHandler = (e) => {
            if (e.cancelable) e.preventDefault();
            if (btnElem) btnElem.classList.add("active");
            onStart();
        };

        const endHandler = (e) => {
            if (e.cancelable) e.preventDefault();
            if (btnElem) btnElem.classList.remove("active");
            onEnd();
        };

        containerElem.addEventListener("touchstart", startHandler, { passive: false });
        containerElem.addEventListener("touchend", endHandler, { passive: false });
        containerElem.addEventListener("touchcancel", endHandler, { passive: false });

        containerElem.addEventListener("mousedown", startHandler);
        containerElem.addEventListener("mouseup", endHandler);
        containerElem.addEventListener("mouseleave", endHandler);
    };

    bindTouchAndMouse(
        touchZoneLeft,
        btnLeft,
        () => { keys.left = true; },
        () => { keys.left = false; },
    );

    bindTouchAndMouse(
        touchZoneRight,
        btnRight,
        () => { keys.right = true; },
        () => { keys.right = false; },
    );

    bindTouchAndMouse(
        touchZoneFire,
        btnFire,
        () => {
            keys.space = true;
            if (isGameRunning && !isPaused) {
                shootBullet();
            }
        },
        () => { keys.space = false; },
    );
}

function shootBullet() {
    bullets.push(new Bullet(player.x + player.width / 2 - 3, player.y));
    playSound("laser");
}

function spawnEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    ctx.font = '14px "VT323", monospace';
    const textWidth = ctx.measureText(type.label).width;
    const width = Math.max(76, textWidth + 16); // padding for text
    const x = Math.max(5, Math.min(canvas.width - width - 5, Math.random() * (canvas.width - width)));
    enemies.push(new Enemy(x, -30, width, type));
}

function spawnPowerup(x, y) {
    const skill = skillDrops[Math.floor(Math.random() * skillDrops.length)];
    const p = new Powerup(x, y, skill);
    
    ctx.font = '13px "Press Start 2P", cursive';
    const textWidth = ctx.measureText(skill.label).width;
    p.width = Math.max(66, textWidth + 16);
    
    // adjust x if powerup spawns out of bounds due to new width
    if (p.x + p.width > canvas.width) {
        p.x = canvas.width - p.width - 5;
    }
    
    powerups.push(p);
}

function createExplosion(x, y, color) {
    const { particleCount } = getPerformanceProfile();
    for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle(x, y, color));
    }
}

export function startGame() {
    initAudio();
    if (hud.overlay) hud.overlay.classList.add("hidden");
    score = 0;

    updateScoreHud();
    updateUnlockedHud();

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 35;

    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];

    isGameRunning = true;
    isPaused = false;
    resumeEngine();
    playSound("powerup");
}

export function setGamePaused(paused) {
    if (isGameRunning) isPaused = paused;
}

export function pauseEngine() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

export function resumeEngine() {
    if (!animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    isGameRunning = false;
    playSound("gameover");
    if (score > highScore) {
        highScore = score;
        saveHighScore(highScore);
        if (hud.highScore) hud.highScore.textContent = String(highScore).padStart(5, "0");
    }
    saveUnlockedSkills(unlockedSkills);

    if (hud.title && hud.subtitle && hud.overlay) {
        hud.title.textContent = "GAME OVER";
        hud.title.className =
            "font-pixel text-xl sm:text-2xl md:text-4xl text-red-500 mb-2 glow-text";
        hud.subtitle.textContent = `Final Score: ${score}. Unlocked ${unlockedSkills.size} skills! Switch to CV mode anytime to inspect full experience details!`;
        hud.overlay.classList.remove("hidden");
    }

    if (hud.startButton) {
        hud.startButton.textContent = "↻ PLAY AGAIN";
    }
}

function gameLoop(timestamp) {
    animationFrameId = requestAnimationFrame(gameLoop);

    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt > 0.1) dt = 0.1; // Cap dt for pausing/lag spikes

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1e2038";
    for (let i = 0; i < starfield.length; i += 1) {
        const star = starfield[i];
        star.y += star.speed * (dt * 60); // approximate conversion to maintain feel
        if (star.y > canvas.height) {
            star.y = -2;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    if (isGameRunning && !isPaused) {
        const profile = getPerformanceProfile();

        if (keys.left && player.x > 0) {
            player.x -= player.speed * dt;
        }
        if (keys.right && player.x < canvas.width - player.width) {
            player.x += player.speed * dt;
        }

        player.y = canvas.height - 35;
        
        enemySpawnTimer += dt;
        // Dynamic spawn rate: faster as score goes up, capped at 0.5s (which is faster than original ~0.75s)
        const spawnIntervalBase = profile.spawnInterval / 60.0;
        const spawnRate = Math.max(0.5, spawnIntervalBase - (score / 1500)); 

        if (enemySpawnTimer > spawnRate) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        for (let i = bullets.length - 1; i >= 0; i -= 1) {
            const bullet = bullets[i];
            bullet.y -= bullet.speed * dt;
            if (bullet.y < -10) bullets.splice(i, 1);
        }

        for (let e = enemies.length - 1; e >= 0; e -= 1) {
            const enemy = enemies[e];
            enemy.y += enemy.speed * dt;
            
            // Horizontal sine-wave movement
            const timeNow = timestamp / 1000;
            enemy.x = enemy.initialX + Math.sin(timeNow * 2.5 + enemy.offset) * 20;

            if (isColliding(enemy, player)) {
                createExplosion(player.x, player.y, "#ff0055");
                gameOver();
                break;
            }

            if (enemy.y > canvas.height) {
                enemies.splice(e, 1);
                continue;
            }

            let hit = false;
            for (let b = bullets.length - 1; b >= 0; b -= 1) {
                const bullet = bullets[b];
                if (isColliding(bullet, enemy)) {
                    createExplosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        enemy.color,
                    );
                    playSound("explosion");
                    score += enemy.points;
                    updateScoreHud();

                    if (Math.random() < 0.35) {
                        spawnPowerup(enemy.x, enemy.y);
                    }

                    enemies.splice(e, 1);
                    bullets.splice(b, 1);
                    hit = true;
                    break;
                }
            }

            if (hit) continue;
        }

        for (let i = powerups.length - 1; i >= 0; i -= 1) {
            const powerup = powerups[i];
            powerup.y += powerup.speed * dt;

            if (isColliding(powerup, player)) {
                playSound("powerup");
                unlockedSkills.add(powerup.label);
                saveUnlockedSkills(unlockedSkills);
                updateUnlockedHud();
                createExplosion(powerup.x, powerup.y, powerup.color);
                powerups.splice(i, 1);
                continue;
            }

            if (powerup.y > canvas.height) powerups.splice(i, 1);
        }

        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const particle = particles[i];
            particle.x += particle.dx * dt;
            particle.y += particle.dy * dt;
            particle.alpha -= 2.4 * dt; // equivalent to -0.04 per 60hz frame
            if (particle.alpha <= 0) particles.splice(i, 1);
        }
    }

    ctx.fillStyle = "#00f3ff";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff0055";
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + player.height - 4, 6, 4);

    ctx.fillStyle = "#ffcc00";
    for (let i = 0; i < bullets.length; i += 1) {
        const bullet = bullets[i];
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    for (let i = 0; i < enemies.length; i += 1) {
        const enemy = enemies[i];
        ctx.fillStyle = "#121324";
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

        ctx.fillStyle = enemy.color;
        ctx.font = '14px "VT323", monospace';
        ctx.textAlign = "center";
        ctx.fillText(enemy.label, enemy.x + enemy.width / 2, enemy.y + 15);
    }

    for (let i = 0; i < powerups.length; i += 1) {
        const powerup = powerups[i];
        ctx.fillStyle = "#00ff66";
        ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);

        ctx.fillStyle = "#000000";
        ctx.font = '13px "Press Start 2P", cursive';
        ctx.textAlign = "center";
        ctx.fillText(powerup.label, powerup.x + powerup.width / 2, powerup.y + 14);
    }

    for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = Math.max(0, particle.alpha);
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.globalAlpha = 1.0;
    }
}
