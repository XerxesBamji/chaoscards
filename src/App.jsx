import { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import './index.css';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'game'
  const [gameConfig, setGameConfig] = useState(null);

  const handleStart = (config) => {
    setGameConfig(config);
    setScreen('game');
  };

  const handleBack = () => {
    setScreen('setup');
    setGameConfig(null);
  };

  return (
    <div className="app">
      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} />
      )}
      {screen === 'game' && gameConfig && (
        <GameScreen config={gameConfig} onBack={handleBack} />
      )}
    </div>
  );
}
