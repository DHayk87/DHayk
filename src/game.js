import { initAudio, playSound } from './audio.js';

let canvas, ctx;
let isGameRunning = false;
let isPaused = false;
let score = 0;
let highScore = 9990;
let unlockedSkills = new Set();
let enemySpawnTimer = 0;

const player = {
    x: 0,
    y: 0,
    width: 42,
    height: 28,
    speed: 7.0
};

let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];

const enemyTypes = [
    { label: 'BUG: 404', color: '#ff0055', points: 100 },
    { label: 'DEADLINE', color: '#ffcc00', points: 150 },
    { label: 'LEGACY CODE', color: '#a855f7', points: 200 },
    { label: 'NULL PTR', color: '#ef4444', points: 120 }
];

const skillDrops = [
    { label: 'React.js', color: '#00f3ff' },
    { label: 'Node.js', color: '#22c55e' },
    { label: 'Golang', color: '#eab308' },
    { label: 'HTML/CSS', color: '#f97316' },
    { label: 'n8n', color: '#ec4899' },
    { label: 'JS ES6+', color: '#facc15' }
];

const keys = { left: false, right: false, space: false };

export function initGame(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas);
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
}

function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = true;
        }
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            if (isGameRunning && !isPaused && !keys.space) {
                shootBullet();
            }
            keys.space = true;
        }
        if (e.key === 'p' || e.key === 'P') {
            if (isGameRunning) isPaused = !isPaused;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = false;
        }
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            keys.space = false;
        }
    });
}

function setupTouchControls() {
    const btnLeft = document.getElementById('btn-left');
    const touchZoneLeft = document.getElementById('touch-zone-left');

    const btnRight = document.getElementById('btn-right');
    const touchZoneRight = document.getElementById('touch-zone-right');

    const btnFire = document.getElementById('btn-fire');
    const touchZoneFire = document.getElementById('touch-zone-fire');

    const bindTouchAndMouse = (containerElem, btnElem, onStart, onEnd) => {
        if (!containerElem) return;

        const startHandler = (e) => {
            if (e.cancelable) e.preventDefault();
            if (btnElem) btnElem.classList.add('active');
            onStart();
        };

        const endHandler = (e) => {
            if (e.cancelable) e.preventDefault();
            if (btnElem) btnElem.classList.remove('active');
            onEnd();
        };

        containerElem.addEventListener('touchstart', startHandler, { passive: false });
        containerElem.addEventListener('touchend', endHandler, { passive: false });
        containerElem.addEventListener('touchcancel', endHandler, { passive: false });

        containerElem.addEventListener('mousedown', startHandler);
        containerElem.addEventListener('mouseup', endHandler);
        containerElem.addEventListener('mouseleave', endHandler);
    };

    bindTouchAndMouse(
        touchZoneLeft,
        btnLeft,
        () => { keys.left = true; },
        () => { keys.left = false; }
    );

    bindTouchAndMouse(
        touchZoneRight,
        btnRight,
        () => { keys.right = true; },
        () => { keys.right = false; }
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
        () => { keys.space = false; }
    );
}

function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 3,
        y: player.y,
        width: 6,
        height: 12,
        speed: 9.5
    });
    playSound('laser');
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
        speed: 1.2 + Math.random() * 1.5
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
        speed: 1.5
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: color,
            alpha: 1,
            life: 20
        });
    }
}

export function startGame() {
    initAudio();
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.classList.add('hidden');
    score = 0;
    unlockedSkills.clear();
    
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) scoreEl.textContent = '00000';
    
    const unlockedEl = document.getElementById('game-unlocked-count');
    if (unlockedEl) unlockedEl.textContent = '0 / 6';
    
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 35;

    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];

    isGameRunning = true;
    isPaused = false;
    playSound('powerup');
}

export function setGamePaused(paused) {
    if (isGameRunning) {
        isPaused = paused;
    }
}

function gameOver() {
    isGameRunning = false;
    playSound('gameover');
    if (score > highScore) {
        highScore = score;
        const hsEl = document.getElementById('game-highscore');
        if (hsEl) hsEl.textContent = String(highScore).padStart(5, '0');
    }

    const overlay = document.getElementById('game-overlay');
    const title = document.getElementById('overlay-title');
    const subtitle = document.getElementById('overlay-subtitle');

    if (title && subtitle && overlay) {
        title.textContent = "GAME OVER";
        title.className = "font-pixel text-xl sm:text-2xl md:text-4xl text-red-500 mb-2 glow-text";
        subtitle.textContent = `Final Score: ${score}. Unlocked ${unlockedSkills.size} skills! Switch to CV mode anytime to inspect full experience details!`;
        overlay.classList.remove('hidden');
    }
}

// AABB Collision Detection Function
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

    // Draw Background Starfield
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#1e2038';
    for (let i = 0; i < 30; i++) {
        const sx = (i * 37) % canvas.width;
        const sy = (i * 53 + Date.now() * 0.02) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
    }

    if (isGameRunning && !isPaused) {
        // Smooth Movement Handling
        if (keys.left && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.right && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }

        player.y = canvas.height - 35;

        // Spawn Enemies
        enemySpawnTimer++;
        if (enemySpawnTimer > 45) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        // Update Bullets
        bullets.forEach((b, i) => {
            b.y -= b.speed;
            if (b.y < -10) bullets.splice(i, 1);
        });

        // Update Enemies
        enemies.forEach((enemy, eIdx) => {
            enemy.y += enemy.speed;

            // Collision with Player
            if (isColliding(enemy, player)) {
                createExplosion(player.x, player.y, '#ff0055');
                gameOver();
            }

            if (enemy.y > canvas.height) {
                enemies.splice(eIdx, 1);
            }

            // Bullet Hit Collision
            bullets.forEach((bullet, bIdx) => {
                if (isColliding(bullet, enemy)) {
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
                    playSound('explosion');
                    score += enemy.points;
                    
                    const scoreEl = document.getElementById('game-score');
                    if (scoreEl) scoreEl.textContent = String(score).padStart(5, '0');

                    if (Math.random() < 0.35) {
                        spawnPowerup(enemy.x, enemy.y);
                    }

                    enemies.splice(eIdx, 1);
                    bullets.splice(bIdx, 1);
                }
            });
        });

        // Powerups
        powerups.forEach((p, pIdx) => {
            p.y += p.speed;

            if (isColliding(p, player)) {
                playSound('powerup');
                unlockedSkills.add(p.label);
                
                const unlockedEl = document.getElementById('game-unlocked-count');
                if (unlockedEl) unlockedEl.textContent = `${unlockedSkills.size} / 6`;
                
                createExplosion(p.x, p.y, p.color);
                powerups.splice(pIdx, 1);
            }

            if (p.y > canvas.height) powerups.splice(pIdx, 1);
        });

        // Particles
        particles.forEach((part, pIdx) => {
            part.x += part.dx;
            part.y += part.dy;
            part.alpha -= 0.04;
            if (part.alpha <= 0) particles.splice(pIdx, 1);
        });
    }

    // Draw Ship
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + player.height - 4, 6, 4);

    // Draw Bullets
    ctx.fillStyle = '#ffcc00';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw Enemies
    enemies.forEach(e => {
        ctx.fillStyle = '#121324';
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.strokeRect(e.x, e.y, e.width, e.height);

        ctx.fillStyle = e.color;
        ctx.font = '14px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.label, e.x + e.width / 2, e.y + 15);
    });

    // Draw Powerups
    powerups.forEach(p => {
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        ctx.fillStyle = '#000000';
        ctx.font = '13px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x + p.width / 2, p.y + 14);
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;
    });

    requestAnimationFrame(gameLoop);
}
