import { playSound } from "../audio.js";

export const enemyTypes = [
    { label: "BUG: 404", color: "#ff0055", points: 100 },
    { label: "DEADLINE", color: "#ffcc00", points: 150 },
    { label: "LEGACY CODE", color: "#a855f7", points: 200 },
    { label: "NULL PTR", color: "#ef4444", points: 120 },
];

export const skillDrops = [
    { label: "React.js", color: "#00f3ff" },
    { label: "Node.js", color: "#22c55e" },
    { label: "Golang", color: "#eab308" },
    { label: "HTML/CSS", color: "#f97316" },
    { label: "n8n", color: "#ec4899" },
    { label: "JS ES6+", color: "#facc15" },
];

export function getPerformanceProfile() {
    const isMobile =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 768px)").matches;
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return {
        isMobile: isMobile || prefersReducedMotion,
        starCount: isMobile || prefersReducedMotion ? 30 : 60,
        particleCount: isMobile || prefersReducedMotion ? 8 : 12,
        spawnInterval: isMobile || prefersReducedMotion ? 60 : 45,
    };
}

export function createStarfield(width, height) {
    const { starCount } = getPerformanceProfile();
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

export function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

export class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 42;
        this.height = 28;
        this.speed = 420.0; // pixels per second
    }
}

export class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 12;
        this.speed = 570.0; // pixels per second
    }
}

export class Enemy {
    constructor(x, y, width, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 22;
        this.label = type.label;
        this.color = type.color;
        this.points = type.points;
        this.speed = 70.0 + Math.random() * 90.0; // px per second
        this.initialX = x;
        this.offset = Math.random() * Math.PI * 2; // for sine movement
    }
}

export class Powerup {
    constructor(x, y, skill) {
        this.x = x;
        this.y = y;
        this.width = 66;
        this.height = 20;
        this.label = skill.label;
        this.color = skill.color;
        this.speed = 90.0; // px per second
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 360.0; // px per sec
        this.dy = (Math.random() - 0.5) * 360.0;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.alpha = 1;
        this.life = 20;
    }
}
