import React from 'react';
import { GameProvider } from './context/GameContext';
import { Route, Routes } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import JoinPage from './pages/JoinPage';
import QRCodePage from './pages/QRCodePage';
import LobbyPage from './pages/LobbyPage';
import AdminFlowLayout from './components/AdminFlowLayout';
import { router } from './Routes';
import './index.css';

function App() {
  return (
    <GameProvider>
      {/* Use RouterProvider directly with the imported router */}
      <Routes>
        {/* Main routes from the router */}
        {router.routes.map((route: any, index: number) => (
          <Route
            key={index}
            path={route.path}
            element={route.element}
          />
        ))}
      </Routes>
    </GameProvider>
  );
}

export default App;
