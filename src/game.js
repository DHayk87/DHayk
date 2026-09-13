import { initAudio, playSound } from "./audio.js";

let canvas, ctx;
let isGameRunning = false;
let isPaused = false;
let score = 0;
let highScore = 9990;
let unlockedSkills = new Set();
let enemySpawnTimer = 0;
let starfield = [];
let hud = {};

const player = {
    x: 0,
    y: 0,
    width: 42,
    height: 28,
    speed: 7.0,
};

let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];

const enemyTypes = [
    { label: "BUG: 404", color: "#ff0055", points: 100 },
    { label: "DEADLINE", color: "#ffcc00", points: 150 },
    { label: "LEGACY CODE", color: "#a855f7", points: 200 },
    { label: "NULL PTR", color: "#ef4444", points: 120 },
];

const skillDrops = [
    { label: "React.js", color: "#00f3ff" },
    { label: "Node.js", color: "#22c55e" },
    { label: "Golang", color: "#eab308" },
    { label: "HTML/CSS", color: "#f97316" },
    { label: "n8n", color: "#ec4899" },
    { label: "JS ES6+", color: "#facc15" },
];

const keys = { left: false, right: false, space: false };

export function createStarfield(width, height) {
    const starCount = Math.min(90, Math.max(35, Math.floor((width * height) / 12)));
    const nextStars = [];

    for (let i = 0; i < starCount; i += 1) {
        nextStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1.2 + 0.5,
        });
    }

    return nextStars;
}

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
}

function resetStarfield() {
    if (!canvas) return;
    starfield = createStarfield(canvas.width, canvas.height);
}

export function initGame(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext("2d");
    cacheHud();

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    setupKeyboardControls();
    setupTouchControls();

    requestAnimationFrame(gameLoop);
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
        () => {
            keys.left = true;
        },
        () => {
            keys.left = false;
        },
    );

    bindTouchAndMouse(
        touchZoneRight,
        btnRight,
        () => {
            keys.right = true;
        },
        () => {
            keys.right = false;
        },
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
        () => {
            keys.space = false;
        },
    );
}

function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 3,
        y: player.y,
        width: 6,
        height: 12,
        speed: 9.5,
    });
    playSound("laser");
}

function spawnEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const width = 76;
    const x = Math.random() * (canvas.width - width);
    enemies.push({
        x: Math.max(5, Math.min(canvas.width - width - 5, x)),
        y: -30,
        width: width,
        height: 22,
        label: type.label,
        color: type.color,
        points: type.points,
        speed: 1.2 + Math.random() * 1.5,
    });
}

function spawnPowerup(x, y) {
    const skill = skillDrops[Math.floor(Math.random() * skillDrops.length)];
    powerups.push({
        x: x,
        y: y,
        width: 66,
        height: 20,
        label: skill.label,
        color: skill.color,
        speed: 1.5,
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i += 1) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: color,
            alpha: 1,
            life: 20,
        });
    }
}

export function startGame() {
    initAudio();
    if (hud.overlay) hud.overlay.classList.add("hidden");
    score = 0;
    unlockedSkills.clear();

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
    playSound("powerup");
}

export function setGamePaused(paused) {
    if (isGameRunning) isPaused = paused;
}

function gameOver() {
    isGameRunning = false;
    playSound("gameover");
    if (score > highScore) {
        highScore = score;
        if (hud.highScore) hud.highScore.textContent = String(highScore).padStart(5, "0");
    }

    if (hud.title && hud.subtitle && hud.overlay) {
        hud.title.textContent = "GAME OVER";
        hud.title.className =
            "font-pixel text-xl sm:text-2xl md:text-4xl text-red-500 mb-2 glow-text";
        hud.subtitle.textContent = `Final Score: ${score}. Unlocked ${unlockedSkills.size} skills! Switch to CV mode anytime to inspect full experience details!`;
        hud.overlay.classList.remove("hidden");
    }

    if (hud.startButton) {
        hud.startButton.innerHTML =
            '<i class="fa-solid fa-rotate-right mr-2"></i> PLAY AGAIN';
    }
}

export function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1e2038";
    for (let i = 0; i < starfield.length; i += 1) {
        const star = starfield[i];
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -2;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    if (isGameRunning && !isPaused) {
        if (keys.left && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.right && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }

        player.y = canvas.height - 35;

        enemySpawnTimer += 1;
        if (enemySpawnTimer > 45) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        for (let i = bullets.length - 1; i >= 0; i -= 1) {
            const bullet = bullets[i];
            bullet.y -= bullet.speed;
            if (bullet.y < -10) bullets.splice(i, 1);
        }

        for (let e = enemies.length - 1; e >= 0; e -= 1) {
            const enemy = enemies[e];
            enemy.y += enemy.speed;

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
            powerup.y += powerup.speed;

            if (isColliding(powerup, player)) {
                playSound("powerup");
                unlockedSkills.add(powerup.label);
                updateUnlockedHud();
                createExplosion(powerup.x, powerup.y, powerup.color);
                powerups.splice(i, 1);
                continue;
            }

            if (powerup.y > canvas.height) powerups.splice(i, 1);
        }

        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const particle = particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.alpha -= 0.04;
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

    requestAnimationFrame(gameLoop);
}
