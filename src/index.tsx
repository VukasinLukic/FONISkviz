import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { initializeGameState } from './lib/firebase';
import useDeviceDetection from './lib/useDeviceDetection';

// Initialize Firebase game state
initializeGameState()
  .then(() => console.log('Firebase game state initialized'))
  .catch((error) => console.error('Error initializing Firebase game state:', error));

// Root component that detects device type and redirects accordingly
const Root = () => {
  const { isMobile } = useDeviceDetection();
  
  // Redirect based on device type
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to={isMobile ? "/player" : "/admin"} replace />} 
        />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

// Render the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
); 