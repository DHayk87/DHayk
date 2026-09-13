import { describe, it, expect } from "vitest";
import { createStarfield, isColliding } from "./game.js";

describe("Game Logic", () => {
    describe("isColliding", () => {
        it("should return true when two rectangles overlap", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 5, y: 5, width: 10, height: 10 };
            expect(isColliding(rect1, rect2)).toBe(true);
        });

        it("should return false when two rectangles do not overlap (X axis)", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 15, y: 0, width: 10, height: 10 };
            expect(isColliding(rect1, rect2)).toBe(false);
        });

        it("should return false when two rectangles do not overlap (Y axis)", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 0, y: 15, width: 10, height: 10 };
            expect(isColliding(rect1, rect2)).toBe(false);
        });

        it("should return false when rectangles touch edges but do not overlap", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 10, y: 0, width: 10, height: 10 };
            // By AABB definition (x < x2 + w2 && x + w > x2), touching edges is false
            expect(isColliding(rect1, rect2)).toBe(false);
        });

        it("should return true when one rectangle is completely inside another", () => {
            const rect1 = { x: 0, y: 0, width: 20, height: 20 };
            const rect2 = { x: 5, y: 5, width: 10, height: 10 };
            expect(isColliding(rect1, rect2)).toBe(true);
            expect(isColliding(rect2, rect1)).toBe(true);
        });
    });

    describe("createStarfield", () => {
        it("should generate a valid background starfield with bounded coordinates and sizes", () => {
            const stars = createStarfield(800, 400);

            expect(Array.isArray(stars)).toBe(true);
            expect(stars.length).toBeGreaterThan(30);
            expect(stars.length).toBeLessThanOrEqual(90);

            for (const star of stars) {
                expect(star.x).toBeGreaterThanOrEqual(0);
                expect(star.x).toBeLessThanOrEqual(800);
                expect(star.y).toBeGreaterThanOrEqual(0);
                expect(star.y).toBeLessThanOrEqual(400);
                expect(star.size).toBeGreaterThanOrEqual(1);
                expect(star.size).toBeLessThanOrEqual(3);
                expect(star.speed).toBeGreaterThanOrEqual(0.5);
            }
        });
    });
});
