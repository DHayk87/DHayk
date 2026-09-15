const STORAGE_KEY_SCORE = "hayk_cv_highscore";
const STORAGE_KEY_SKILLS = "hayk_cv_unlocked_skills";

export function loadHighScore() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SCORE);
        if (stored) {
            return parseInt(stored, 10) || 0;
        }
    } catch (e) {
        console.warn("localStorage is not available", e);
    }
    return 9990; // Default high score
}

export function saveHighScore(score) {
    try {
        localStorage.setItem(STORAGE_KEY_SCORE, score.toString());
    } catch (e) {
        console.warn("localStorage is not available", e);
    }
}

export function loadUnlockedSkills() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SKILLS);
        if (stored) {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr)) {
                return new Set(arr);
            }
        }
    } catch (e) {
        console.warn("localStorage is not available", e);
    }
    return new Set();
}

export function saveUnlockedSkills(skillsSet) {
    try {
        localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(Array.from(skillsSet)));
    } catch (e) {
        console.warn("localStorage is not available", e);
    }
}
