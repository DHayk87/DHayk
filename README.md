# Hayk // 8-Bit Arcade CV & Game

A modern, interactive Full-Stack Developer Curriculum Vitae disguised as a retro 8-bit arcade game. This project allows users to read a professional CV or play a mini-game ("Dev Invaders") to unlock skills.

## Features

- **Interactive Arcade Game**: Built with HTML5 Canvas and Vanilla JavaScript. Shoot bugs and deadlines to collect skills!
- **Retro Aesthetic**: Custom CSS, Tailwind utility classes, pixel fonts (`Press Start 2P`, `VT323`), and a CRT overlay effect.
- **Responsive Design**: Works on desktop and mobile, featuring an on-screen D-pad with touch controls for mobile devices.
- **Web Audio API**: Synthesized retro sound effects for shooting, explosions, powerups, and game overs (no external audio files needed).
- **Vite & Tailwind Setup**: Modern, fast build tooling for optimized development.

## Project Structure

```text
├── index.html           # Main HTML structure and UI
├── package.json         # Project dependencies and scripts
├── postcss.config.js    # PostCSS config for Tailwind
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite development server config
└── src/
    ├── audio.js         # Web Audio API synthesizer logic
    ├── game.js          # Canvas game loop, rendering, and collision logic
    ├── main.js          # UI mode switching, event listeners, and initialization
    └── style.css        # Tailwind directives and custom CSS
```

## Getting Started

To run the project locally, you will need Node.js installed.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   This will start Vite on `http://localhost:3000`.

3. **Build for Production**
   ```bash
   npm run build
   ```
   The optimized production files will be output to the `dist/` directory. You can preview the production build using `npm run preview`.

## Controls

### Desktop
- **A / D** or **Left / Right Arrows**: Move Ship
- **Space** or **Up Arrow**: Shoot
- **P**: Pause Game

### Mobile
- **On-Screen D-Pad**: Tap left or right arrows to move
- **Fire Button**: Tap to shoot
