import { useState, useEffect, useCallback, useRef } from 'react';
import { buildDeck } from '../utils/gameEngine';
import { ALL_MODES } from '../data/prompts';
import './GameScreen.css';

// Woosh / click sound synthesised via Web Audio API
function playCardSound(enabled) {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

function vibrateDevice() {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

const MODE_META = Object.fromEntries(ALL_MODES.map(m => [m.id, m]));

export default function GameScreen({ config, onBack }) {
  const { players, extraPeople, useExtra, mode, soundEnabled, customPrompts = [] } = config;
  const [deck, setDeck] = useState(() => buildDeck(mode, players, extraPeople, useExtra, customPrompts));
  const [index, setIndex] = useState(0);
  const [animState, setAnimState] = useState('in'); // 'in' | 'out'
  const [showMenu, setShowMenu] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [totalSeen, setTotalSeen] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const animTimeout = useRef(null);

  const currentMeta = MODE_META[currentMode];
  const totalCards = deck.length;
  const progress = Math.round(((index + 1) / totalCards) * 100);

  // Rebuild deck when mode changes mid-game
  const switchMode = useCallback((newMode) => {
    const newDeck = buildDeck(newMode, players, extraPeople, useExtra, customPrompts);
    setDeck(newDeck);
    setIndex(0);
    setCurrentMode(newMode);
    setShowMenu(false);
    setShowEndScreen(false);
    setTotalSeen(0);
  }, [players, extraPeople, useExtra, customPrompts]);

  const advance = useCallback(() => {
    if (animState !== 'in') return;

    // Trigger exit animation
    setAnimState('out');
    vibrateDevice();
    playCardSound(soundEnabled);

    animTimeout.current = setTimeout(() => {
      const nextIdx = index + 1;

      if (nextIdx >= totalCards) {
        // Rebuild deck for another cycle
        const newDeck = buildDeck(currentMode, players, extraPeople, useExtra, customPrompts);
        setDeck(newDeck);
        setIndex(0);
        setTotalSeen(prev => prev + totalCards);
        setAnimState('in');
      } else {
        setIndex(nextIdx);
        setAnimState('in');
      }
    }, 280);
  }, [animState, index, totalCards, currentMode, players, extraPeople, useExtra, soundEnabled]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
      if (e.key === 'Escape') setShowMenu(s => !s);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance]);

  // Swipe support
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only swipe left as advance, avoid vertical scrolls
    if (Math.abs(dx) > Math.abs(dy) && dx < -40) {
      advance();
    }
  };

  const handleCardClick = (e) => {
    // Ignore clicks on overlay buttons
    if (e.target.closest('button')) return;
    advance();
  };

  const currentPrompt = deck[index] ?? '';

  return (
    <div
      className={`game-screen mode-bg-${currentMode}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      role="main"
      aria-label="Game card"
    >
      {/* Ambient background blobs */}
      <div className="ambient-blob blob-1" aria-hidden="true" />
      <div className="ambient-blob blob-2" aria-hidden="true" />
      <div className="ambient-blob blob-3" aria-hidden="true" />

      {/* Top bar */}
      <header className="game-topbar" onClick={e => e.stopPropagation()}>
        <button className="topbar-btn" onClick={onBack} aria-label="Back to setup" id="back-btn">
          ← Back
        </button>

        <div className="mode-badge" style={{ '--mode-gradient': currentMeta.gradient }}>
          <span>{currentMeta.emoji}</span>
          <span>{currentMeta.label}</span>
        </div>

        <button
          className="topbar-btn menu-btn"
          onClick={() => setShowMenu(s => !s)}
          aria-label="Open menu"
          aria-expanded={showMenu}
          id="menu-btn"
        >
          ⚙️
        </button>
      </header>

      {/* Progress bar */}
      <div className="progress-bar-container" aria-label={`Card ${index + 1} of ${totalCards}`}>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%`, background: currentMeta.gradient }}
          />
        </div>
        <span className="progress-label">{index + 1} / {totalCards}</span>
      </div>

      {/* Main card */}
      <main className="card-container">
        <div
          className={`card card--${animState} card-mode-${currentMode}`}
          id="game-card"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Card shimmer effect */}
          <div className="card-shimmer" aria-hidden="true" />

          {/* Card content */}
          <div className="card-content">
            <div
              className="card-mode-icon"
              style={{ background: currentMeta.gradient }}
            >
              {currentMeta.emoji}
            </div>

            <p className="card-text" aria-label={`Prompt: ${currentPrompt}`}>
              {currentPrompt}
            </p>

            <div className="card-tap-hint">
              <span>Tap anywhere to continue</span>
              <span className="tap-arrow">→</span>
            </div>
          </div>
        </div>
      </main>

      {/* Stats footer */}
      <footer className="game-footer" onClick={e => e.stopPropagation()}>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{players.length}</span>
            <span className="stat-label">Players</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{totalSeen + index + 1}</span>
            <span className="stat-label">Total seen</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{currentMeta.label}</span>
            <span className="stat-label">Mode</span>
          </div>
        </div>
      </footer>

      {/* Settings menu overlay */}
      {showMenu && (
        <div
          className="menu-overlay"
          onClick={e => { e.stopPropagation(); setShowMenu(false); }}
          role="dialog"
          aria-label="Game menu"
          aria-modal="true"
        >
          <div className="menu-panel" onClick={e => e.stopPropagation()}>
            <div className="menu-handle" />
            <h2 className="menu-title">Options</h2>

            <div className="menu-section">
              <p className="menu-section-label">Switch Mode</p>
              <div className="menu-modes">
                {ALL_MODES.map(m => (
                  <button
                    key={m.id}
                    id={`switch-mode-${m.id}`}
                    className={`menu-mode-btn ${currentMode === m.id ? 'menu-mode-btn--active' : ''}`}
                    onClick={() => switchMode(m.id)}
                    style={{ '--mode-color': m.color, '--mode-gradient': m.gradient }}
                    aria-pressed={currentMode === m.id}
                  >
                    <span className="menu-mode-emoji">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="menu-section">
              <p className="menu-section-label">Players</p>
              <div className="menu-players">
                {players.map((p, i) => (
                  <span key={i} className="menu-player-chip">{p}</span>
                ))}
              </div>
            </div>

            <button
              className="menu-newgame-btn"
              onClick={onBack}
              id="new-game-btn"
            >
              🔄 New Game
            </button>

            <button
              className="menu-close-btn"
              onClick={() => setShowMenu(false)}
              id="close-menu-btn"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
