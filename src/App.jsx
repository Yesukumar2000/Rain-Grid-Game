import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// --- Constants ---
const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 25;
const CELL_SIZE = 25; // px

// Color palettes for raindrops (head to tail gradients)
const BASE_COLORS = [
    ['#FF0055', '#D40048', '#AA003B', '#80002C', '#55001E', '#330011', '#22000A'],
    ['#FF4081', '#F03071', '#E02061', '#D01051', '#C00041', '#A00031', '#800021'],
];
const BACKGROUND_COLOR = '#0A0A0F';

// --- Helper Functions ---
/**
 * Initializes a 2D grid with the given background color.
 */
function initializeGrid(numRows, numCols, bgColor) {
    return Array.from({ length: numRows }, () => Array(numCols).fill(bgColor));
}

// --- RainGrid Component ---
/**
 * Renders the rain grid as a grid of colored cells.
 */
const RainGrid = React.memo(({ grid, cellSize }) => {
    if (!grid?.length) {
        return <div style={{ color: 'white', padding: '1rem' }}>Initializing Grid...</div>;
    }
    const numRows = grid.length;
    const numCols = grid[0].length;

    return (
        <div
            className="grid-display-style"
            style={{
                display: 'grid',
                gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
                backgroundColor: BACKGROUND_COLOR,
                overflow: 'hidden',
                borderRadius: '4px',
            }}
        >
            {grid.map((row, rowIndex) =>
                row.map((cellColor, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: cellColor,
                            boxSizing: 'border-box',
                            border: '1px solid #444',
                        }}
                    />
                ))
            )}
        </div>
    );
});

// --- App Component ---
function App() {
    // --- State ---
    const [rows, setRows] = useState(DEFAULT_ROWS);
    const [cols, setCols] = useState(DEFAULT_COLS);
    const [grid, setGrid] = useState(() => initializeGrid(DEFAULT_ROWS, DEFAULT_COLS, BACKGROUND_COLOR));
    const [raindrops, setRaindrops] = useState([]);
    const [isRunning, setIsRunning] = useState(true);
    const [animationSpeed, setAnimationSpeed] = useState(40); // ms per frame
    const [dropDensity, setDropDensity] = useState(0.02); // Probability per col per frame

    // --- Refs ---
    const animationFrameId = useRef(null);
    const lastUpdateTime = useRef(0);
    const gameLogicRef = useRef(null);

    // --- Reset grid and raindrops when size changes ---
    const resetGridAndDrops = useCallback(() => {
        setGrid(initializeGrid(rows, cols, BACKGROUND_COLOR));
        setRaindrops([]);
    }, [rows, cols]);

    useEffect(() => {
        resetGridAndDrops();
    }, [rows, cols, resetGridAndDrops]);

    // --- Main Rain Animation Logic ---
    gameLogicRef.current = (timestamp) => {
        const deltaTime = timestamp - lastUpdateTime.current;
        if (deltaTime >= animationSpeed) {
            lastUpdateTime.current = timestamp - (deltaTime % animationSpeed);

            // Move existing drops down, remove those out of bounds
            const updatedRaindrops = raindrops
                .map(drop => ({ ...drop, y: drop.y + 1 }))
                .filter(drop => drop.y - drop.length < rows);

            // Possibly add new drops at the top
            for (let c = 0; c < cols; c++) {
                if (Math.random() < dropDensity) {
                    const colorPalette = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
                    const maxLength = colorPalette.length;
                    const length = Math.floor(Math.random() * (maxLength - 2)) + 3;
                    updatedRaindrops.push({
                        id: timestamp + Math.random() * 1000 + c,
                        col: c,
                        y: 0,
                        length: Math.min(length, maxLength),
                        colors: colorPalette,
                    });
                }
            }
            setRaindrops(updatedRaindrops);

            // Draw drops onto a new grid
            const nextGrid = initializeGrid(rows, cols, BACKGROUND_COLOR);
            updatedRaindrops.forEach(drop => {
                for (let i = 0; i < drop.length; i++) {
                    const currentY = drop.y - i;
                    if (
                        currentY >= 0 &&
                        currentY < rows &&
                        drop.col >= 0 &&
                        drop.col < cols
                    ) {
                        nextGrid[currentY][drop.col] = drop.colors[i] || BACKGROUND_COLOR;
                    }
                }
            });
            setGrid(nextGrid);
        }
    };

    // --- Animation Frame Loop ---
    useEffect(() => {
        const loop = (timestamp) => {
            if (isRunning && gameLogicRef.current) {
                gameLogicRef.current(timestamp);
            }
            animationFrameId.current = requestAnimationFrame(loop);
        };

        if (isRunning) {
            lastUpdateTime.current = performance.now();
            animationFrameId.current = requestAnimationFrame(loop);
        } else if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning]);

    // --- UI Handlers ---
    const handleStartStop = () => setIsRunning(running => !running);
    const handleReset = () => {
        setIsRunning(false);
        resetGridAndDrops();
    };

    // --- Render ---
    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">Digital Rainfall</h1>
                <p className="app-subtitle">Visualizer</p>
            </header>
            <main className="main-content">
                <div className="grid-outer-container">
                    <RainGrid grid={grid} cellSize={CELL_SIZE} />
                </div>
                <section className="controls-panel">
                    <div className="controls-grid">
                        <div>
                            <label htmlFor="rows" className="control-label">
                                Rows: <span className="control-label-value">{rows}</span>
                            </label>
                            <input
                                type="range"
                                id="rows"
                                min="10"
                                max="30"
                                value={rows}
                                onChange={e => setRows(Number(e.target.value))}
                                className="range-input"
                            />
                        </div>
                        <div>
                            <label htmlFor="cols" className="control-label">
                                Columns: <span className="control-label-value">{cols}</span>
                            </label>
                            <input
                                type="range"
                                id="cols"
                                min="10"
                                max="50"
                                value={cols}
                                onChange={e => setCols(Number(e.target.value))}
                                className="range-input"
                            />
                        </div>
                        <div>
                            <label htmlFor="speed" className="control-label">
                                Frame Delay (ms): <span className="control-label-value">{animationSpeed}</span>
                            </label>
                            <input
                                type="range"
                                id="speed"
                                min="30"
                                max="300"
                                step="10"
                                value={animationSpeed}
                                onChange={e => setAnimationSpeed(Number(e.target.value))}
                                className="range-input"
                            />
                        </div>
                        <div>
                            <label htmlFor="density" className="control-label">
                                Drop Density: <span className="control-label-value">{dropDensity.toFixed(2)}</span>
                            </label>
                            <input
                                type="range"
                                id="density"
                                min="0.01"
                                max="0.3"
                                step="0.01"
                                value={dropDensity}
                                onChange={e => setDropDensity(Number(e.target.value))}
                                className="range-input"
                            />
                        </div>
                    </div>
                    <div className="buttons-container">
                        <button
                            onClick={handleStartStop}
                            className="control-button button-primary"
                        >
                            {isRunning ? 'Pause Effect' : 'Start Effect'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="control-button button-secondary"
                        >
                            Reset Grid
                        </button>
                    </div>
                </section>
            </main>
            <footer className="app-footer">
                <p>
                    &copy; {new Date().getFullYear()} Digital Rain Visualizer. Yesu Kumar All rights reserved.
                </p>
                <p>Inspired by the iconic matrix digital rain.</p>
            </footer>
        </div>
    );
}

export default App;
