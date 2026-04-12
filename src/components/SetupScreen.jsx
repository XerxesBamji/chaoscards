import { useState, useRef, useEffect } from 'react';
import { ALL_MODES, DEFAULT_EXTRA_PEOPLE } from '../data/prompts';
import './SetupScreen.css';

const STORAGE_KEY = 'chaos-cards-custom-prompts';

function loadCustomPrompts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function SetupScreen({ onStart }) {
  const [players, setPlayers] = useState(['']);
  const [extraPeople, setExtraPeople] = useState(DEFAULT_EXTRA_PEOPLE);
  const [newExtra, setNewExtra] = useState('');
  const [useExtra, setUseExtra] = useState(true);
  const [selectedMode, setSelectedMode] = useState('normal');
  const [showExtra, setShowExtra] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Custom prompts
  const [customPrompts, setCustomPrompts] = useState(loadCustomPrompts);
  const [newPrompt, setNewPrompt] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [promptError, setPromptError] = useState('');

  const inputRefs = useRef([]);

  // Persist custom prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrompts));
  }, [customPrompts]);

  /* ── Players ── */
  const addPlayer = () => {
    setPlayers(prev => [...prev, '']);
    setTimeout(() => {
      inputRefs.current[players.length]?.focus();
    }, 50);
  };

  const removePlayer = (i) => setPlayers(prev => prev.filter((_, idx) => idx !== i));

  const updatePlayer = (i, val) =>
    setPlayers(prev => prev.map((p, idx) => idx === i ? val : p));

  const handlePlayerKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (i === players.length - 1) addPlayer();
      else inputRefs.current[i + 1]?.focus();
    }
  };

  /* ── Extra people ── */
  const addExtraPerson = () => {
    const val = newExtra.trim();
    if (val && !extraPeople.includes(val)) {
      setExtraPeople(prev => [...prev, val]);
      setNewExtra('');
    }
  };
  const removeExtra = (name) => setExtraPeople(prev => prev.filter(p => p !== name));

  /* ── Custom prompts ── */
  const addCustomPrompt = () => {
    const val = newPrompt.trim();
    if (!val) return;
    if (val.length < 10) {
      setPromptError('Prompt is too short — add more detail!');
      return;
    }
    if (customPrompts.includes(val)) {
      setPromptError('That prompt already exists.');
      return;
    }
    setCustomPrompts(prev => [...prev, val]);
    setNewPrompt('');
    setPromptError('');
  };

  const removeCustomPrompt = (idx) =>
    setCustomPrompts(prev => prev.filter((_, i) => i !== idx));

  const handlePromptKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addCustomPrompt();
    }
  };

  /* ── Start ── */
  const validPlayers = players.map(p => p.trim()).filter(Boolean);
  const canStart = validPlayers.length >= 3;

  const handleStart = () => {
    if (!canStart) return;
    onStart({ players: validPlayers, extraPeople, useExtra, mode: selectedMode, soundEnabled, customPrompts });
  };

  return (
    <div className="setup-screen">
      {/* Particles */}
      <div className="particles" aria-hidden="true">
        {[...Array(12)].map((_, i) => <div key={i} className={`particle particle-${i}`} />)}
      </div>

      <div className="setup-inner">
        {/* Header */}
        <header className="setup-header">
          <div className="logo-badge"><img src="/logo.png" alt="Chaos Cards" /></div>
          <h1 className="setup-title">
            <span className="gradient-text">Chaos</span>
            <span className="setup-title-white"> Cards</span>
          </h1>
          <p className="setup-subtitle">The party game with no chill</p>
        </header>

        {/* Players */}
        <section className="setup-section" aria-label="Add players">
          <div className="section-header">
            <h2 className="section-title">👥 Players</h2>
            <span className="player-count">{validPlayers.length} / min 3</span>
          </div>
          <div className="players-list">
            {players.map((p, i) => (
              <div key={i} className="player-row" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="player-icon">{i + 1}</div>
                <input
                  ref={el => inputRefs.current[i] = el}
                  className="player-input"
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={p}
                  onChange={e => updatePlayer(i, e.target.value)}
                  onKeyDown={e => handlePlayerKeyDown(e, i)}
                  maxLength={20}
                  aria-label={`Player ${i + 1} name`}
                />
                {players.length > 1 && (
                  <button className="remove-btn" onClick={() => removePlayer(i)} aria-label={`Remove player ${i + 1}`}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button className="add-player-btn" onClick={addPlayer} id="add-player-btn">
            <span>+</span> Add Player
          </button>
        </section>

        {/* Game Mode */}
        <section className="setup-section" aria-label="Game mode selection">
          <h2 className="section-title">🎯 Game Mode</h2>
          <div className="modes-grid">
            {ALL_MODES.map(mode => (
              <button
                key={mode.id}
                id={`mode-${mode.id}`}
                className={`mode-card ${selectedMode === mode.id ? 'mode-card--active' : ''} ${mode.id === 'ultrachaos' ? 'mode-card--ultra' : ''}`}
                onClick={() => setSelectedMode(mode.id)}
                style={{ '--mode-gradient': mode.gradient, '--mode-color': mode.color }}
                aria-pressed={selectedMode === mode.id}
              >
                <span className="mode-emoji">{mode.emoji}</span>
                <span className="mode-label">{mode.label}</span>
                <span className="mode-desc">{mode.description}</span>
                {selectedMode === mode.id && <div className="mode-active-ring" />}
              </button>
            ))}
          </div>
        </section>

        {/* Extra People */}
        <section className="setup-section" aria-label="Extra people settings">
          <div className="section-header extra-people-header">
            <div className="section-header-left">
              <h2 className="section-title">👀 Extra People</h2>
              <p className="section-desc">Wild card names that appear in prompts</p>
            </div>
            <label className="toggle" aria-label="Enable extra people">
              <input type="checkbox" checked={useExtra} onChange={e => setUseExtra(e.target.checked)} aria-label="Toggle extra people" />
              <span className="toggle-slider" />
            </label>
          </div>
          <button className="extra-expand-btn" onClick={() => setShowExtra(s => !s)} aria-expanded={showExtra}>
            {showExtra ? '▲ Hide names' : '▼ Edit names'}
          </button>
          {showExtra && (
            <div className="extra-panel">
              <div className="extra-chips">
                {extraPeople.map(name => (
                  <span key={name} className="extra-chip">
                    {name}
                    <button onClick={() => removeExtra(name)} aria-label={`Remove ${name}`}>✕</button>
                  </span>
                ))}
              </div>
              <div className="extra-input-row">
                <input className="player-input" type="text" placeholder="Add name..." value={newExtra}
                  onChange={e => setNewExtra(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExtraPerson()} maxLength={20} aria-label="New extra person name" />
                <button className="add-extra-btn" onClick={addExtraPerson} aria-label="Add extra person">+</button>
              </div>
            </div>
          )}
        </section>

        {/* ✨ Custom Prompts */}
        <section className="setup-section custom-prompts-section" aria-label="Custom prompts">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="section-title">✏️ Custom Prompts</h2>
              <p className="section-desc">
                Your rules, your game
                {customPrompts.length > 0 && (
                  <span className="custom-count-badge">{customPrompts.length} added</span>
                )}
              </p>
            </div>
          </div>

          <button className="extra-expand-btn" onClick={() => setShowCustom(s => !s)} aria-expanded={showCustom} id="toggle-custom-prompts-btn">
            {showCustom ? '▲ Hide' : '▼ Add & manage'}
          </button>

          {showCustom && (
            <div className="custom-panel">
              <div className="custom-hint">
                <span className="hint-label">💡 Use variables:</span>
                <code className="hint-code">{'{player}'}</code>
                <code className="hint-code">{'{player2}'}</code>
                <code className="hint-code">{'{any_name}'}</code>
              </div>

              <div className="custom-input-group">
                <textarea
                  className="prompt-textarea"
                  placeholder='e.g. "{player}, do your best impression of {player2}. Everyone votes — loser drinks."'
                  value={newPrompt}
                  onChange={e => { setNewPrompt(e.target.value); setPromptError(''); }}
                  onKeyDown={handlePromptKeyDown}
                  rows={3}
                  maxLength={300}
                  aria-label="New custom prompt"
                  id="custom-prompt-input"
                />
                {promptError && <p className="prompt-error">{promptError}</p>}
                <div className="custom-input-footer">
                  <span className="char-count">{newPrompt.length} / 300</span>
                  <button className="add-prompt-btn" onClick={addCustomPrompt} id="add-custom-prompt-btn">
                    + Add Prompt
                  </button>
                </div>
              </div>

              {customPrompts.length > 0 && (
                <div className="custom-prompts-list">
                  <p className="custom-prompts-list-label">Your prompts ({customPrompts.length})</p>
                  {customPrompts.map((prompt, idx) => (
                    <div key={idx} className="custom-prompt-item" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <p className="custom-prompt-text">{prompt}</p>
                      <button
                        className="remove-prompt-btn"
                        onClick={() => removeCustomPrompt(idx)}
                        aria-label={`Remove prompt ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sound settings */}
        <section className="setup-section settings-row" aria-label="Game settings">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔊</span>
              <span className="setting-label">Sound Effects</span>
            </div>
            <label className="toggle" aria-label="Toggle sound effects">
              <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        {/* Start button */}
        <button
          className={`start-btn ${canStart ? 'start-btn--ready' : 'start-btn--disabled'}`}
          onClick={handleStart}
          disabled={!canStart}
          id="start-game-btn"
          aria-disabled={!canStart}
        >
          {canStart ? (
            <><span>Let's Go</span><span className="start-arrow">🚀</span></>
          ) : (
            <span>Add at least 3 players</span>
          )}
        </button>

        <p className="setup-footer">Please drink responsibly 🥂</p>
      </div>
    </div>
  );
}
