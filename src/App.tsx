import React from 'react';
import { GameProvider } from './context/GameContext';
import { Outlet } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <GameProvider>
      <Outlet />
    </GameProvider>
  );
}

export default App;
