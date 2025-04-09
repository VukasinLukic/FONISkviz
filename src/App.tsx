import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { router } from './Routes';
import './index.css';

function App() {
  return (
    <GameProvider>
      {/* Use RouterProvider directly with the imported router */}
      <RouterProvider router={router} /> 
    </GameProvider>
  );
}

export default App;
