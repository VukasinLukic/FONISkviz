// Ovaj fajl više nije potreban jer smo prebacili rute direktno u App.tsx
// Možemo ga izbrisati ili ostaviti kao referencu za složenije rutiranje u budućnosti

import { createBrowserRouter, Outlet, useRouteError, isRouteErrorResponse, Navigate } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import WaitingForPlayers from './pages/WaitingForPlayers';
import MascotSelection from './pages/MascotSelection';
import SplashScreen from './pages/SplashScreen';
import QRCodePage from './pages/QRCodePage';
import LobbyPage from './pages/LobbyPage';
import AdminQuestionPage from './pages/AdminQuestionPage';
import PlayerQuestionPage from './pages/PlayerQuestionPage';
import PlayerWaitingAnswerPage from './pages/PlayerWaitingAnswerPage';
import PlayerAnswerResultPage from './pages/PlayerAnswerResultPage';
import AdminWinnersPage from './pages/AdminWinnersPage';
import PlayerFinishedPage from './pages/PlayerFinishedPage';
import TestPage from './pages/TestPage';
import useDeviceDetection from './lib/useDeviceDetection';

// Device detection component for the root route
const DeviceRedirect = () => {
  // Only redirect at the root path to avoid loops
  if (window.location.pathname !== '/') {
    return null;
  }
  
  // Simple mobile detection based on screen width
  const isMobile = window.innerWidth <= 768;
  
  // Save device type to localStorage
  localStorage.setItem('deviceType', isMobile ? 'mobile' : 'desktop');
  
  // For mobile devices, redirect to player route
  if (isMobile) {
    return <Navigate to="/player" replace />;
  }
  
  // For desktop devices, redirect to admin route
  return <Navigate to="/admin" replace />;
};

// Error boundary component
function ErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);
  
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-primary mb-4 font-serif">Error {error.status}</h1>
          <p className="text-primary mb-6">{error.statusText || error.data.message}</p>
          <button 
            onClick={() => window.location.href = '/admin'} // Redirect to Admin Splash Screen
            className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-all"
          >
            Go to Start Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-primary mb-4 font-serif">Oops!</h1>
        <p className="text-primary mb-6">Something went wrong.</p>
        <button 
          onClick={() => window.location.href = '/admin'} // Redirect to Admin Splash Screen
          className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-all"
        >
          Go to Start Screen
        </button>
      </div>
    </div>
  );
}

// Funkcije koje još uvek mogu biti korisne 
export { DeviceRedirect, ErrorBoundary };
