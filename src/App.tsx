import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import DevTools from './components/DevTools';
import FontLoader from './components/FontLoader';
import AnimatedBackground from './components/AnimatedBackground';
import { initializeData } from './scripts';
import SplashScreen from './pages/SplashScreen';
import JoinPage from './pages/JoinPage';
import TestPage from './pages/TestPage';
import MascotSelection from './pages/MascotSelection';
import WaitingForPlayers from './pages/WaitingForPlayers';
import QRCodePage from './pages/QRCodePage';
import LobbyPage from './pages/LobbyPage';
import AdminQuestionPage from './pages/AdminQuestionPage';
import PlayerQuestionPage from './pages/PlayerQuestionPage';
import PlayerWaitingAnswerPage from './pages/PlayerWaitingAnswerPage';
import PlayerAnswerResultPage from './pages/PlayerAnswerResultPage';
import AdminWinnersPage from './pages/AdminWinnersPage';
import PlayerFinishedPage from './pages/PlayerFinishedPage';
import AdminAnswerRevealPage from './pages/AdminAnswerRevealPage';
import { getDb } from './lib/firebase';
import { FirebaseApp } from 'firebase/app';
import { Database } from 'firebase/database';
import { ref, set, remove, get, query, orderByChild, equalTo, onValue, DataSnapshot } from 'firebase/database';

// Definišemo interfejs za rutu
interface AppRoute {
  path: string;
  element: React.ReactNode;
}

// Definišemo rute
const appRoutes: AppRoute[] = [
  { path: '/', element: <SplashScreen /> },
  { path: '/player', element: <JoinPage /> },
  { path: '/player/mascot', element: <MascotSelection /> },
  { path: '/player/waiting', element: <WaitingForPlayers /> },
  { path: '/player/question', element: <PlayerQuestionPage /> },
  { path: '/player/waiting-answer', element: <PlayerWaitingAnswerPage /> },
  { path: '/player/answer-result', element: <PlayerAnswerResultPage /> },
  { path: '/player/finished', element: <PlayerFinishedPage /> },
  { path: '/admin', element: <SplashScreen /> },
  { path: '/admin/qrcode', element: <QRCodePage /> },
  { path: '/admin/lobby', element: <LobbyPage /> },
  { path: '/admin/question', element: <AdminQuestionPage /> },
  { path: '/admin/answer', element: <AdminAnswerRevealPage /> },
  { path: '/admin/winners', element: <AdminWinnersPage /> },
  { path: '/test', element: <TestPage /> }
];

function GlobalDevTools() {
  const [gameCode, setGameCode] = useState<string | null>(null);

  useEffect(() => {
    // Get game code from localStorage on mount
    const code = localStorage.getItem('gameCode');
    setGameCode(code);
  }, []);

  if (!gameCode) return null;

  return <DevTools gameCode={gameCode} />;
}

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [initStatus, setInitStatus] = useState<{ success?: boolean; error?: any } | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [firebaseError, setFirebaseError] = useState<any>(null);
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    // Proveri da li je Firebase inicijalizovan by trying to get the DB instance
    const checkFirebase = async () => {
      try {
        const dbInstance = await getDb();
        setDatabase(dbInstance);
        console.log("Firebase App Reference (indirectly via DB):", dbInstance.app);
        console.log("Firebase Database Reference:", dbInstance);
        setFirebaseStatus('success');
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setFirebaseStatus('error');
        setFirebaseError(error);
      }
    };
    checkFirebase();
  }, []);

  useEffect(() => {
    // Učitaj fontove koristeći FontLoader modul
    try {
      const loaded = FontLoader.loadFonts();
      if (loaded) {
        // Sačekaj malo da se fontovi učitaju
        setTimeout(() => {
          setFontsLoaded(true);
        }, 500);
      }
    } catch (error) {
      console.error("Greška pri učitavanju fontova:", error);
      // Ipak prikaži aplikaciju ako fontovi ne mogu da se učitaju
      setFontsLoaded(true);
    }
  }, []);

  const handleInitializeData = async () => {
    try {
      const result = await initializeData();
      setInitStatus(result);
    } catch (error) {
      setInitStatus({ success: false, error });
    }
  };

  if (!fontsLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-2xl text-white">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex-grow">
        <Routes>
          {appRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Check if GlobalDevTools needs gameCode or remove */}
          {/* <GlobalDevTools /> */}
          
          {/* Firebase Status Panel */}
          {/* 
          <div className={`mt-2 p-2 rounded text-white ${
            firebaseStatus === 'success' 
              ? 'bg-green-500' 
              : firebaseStatus === 'error' 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
          }`}>
            Firebase: {firebaseStatus}
            {firebaseStatus === 'error' && (
              <div className="text-xs mt-1">{firebaseError?.message || firebaseError}</div>
            )}
          </div>
          */}

          {/* 
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
            onClick={handleInitializeData}
          >
            Inicijalizuj podatke
          </button>
          */}
          {initStatus && (
            <div className={`text-sm mt-2 p-2 rounded ${initStatus.success ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {initStatus.success 
                ? 'Podaci uspešno inicijalizovani!' 
                : `Greška: ${initStatus.error?.message || 'Nepoznata greška'}`}
            </div>
          )}
        </div>
      )}
      {/* Render DevTools directly if needed, passing gameCode */}
      {process.env.NODE_ENV === 'development' && localStorage.getItem('isAdmin') === 'true' && (
        <DevTools gameCode={localStorage.getItem('gameCode') || 'default'} />
      )}
    </div>
  );
};

// Simple error boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, info: any) {
    console.error("App error:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
          <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-3xl font-bold text-primary mb-4">Something went wrong</h1>
            <p className="text-primary mb-6">Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default App;
