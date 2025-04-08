import { createBrowserRouter, RouterProvider, Outlet, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import WaitingForPlayers from './pages/WaitingForPlayers';
import QuizStarting from './pages/QuizStarting';
import CategoryName from './pages/CategoryName';
import AnswersPage from './pages/AnswersPage';
import WaitingForAnswer from './pages/WaitingForAnswer';
import HowManyPoints from './pages/HowManyPoints';
import TeamPoints from './pages/TeamPoints';
import FinalTeamPoints from './pages/FinalTeamPoints';
import TensionPage from './pages/TensionPage';
import WinnersPage from './pages/WinnersPage';
import MascotSelection from './pages/MascotSelection';
import DevControls from './components/DevControls';
import SplashScreen from './pages/SplashScreen';
import QRCodePage from './pages/QRCodePage';
import LobbyPage from './pages/LobbyPage';
import TestPage from './pages/TestPage';
import QuestionDisplayPage from './pages/QuestionDisplayPage';
import AdminFlowLayout from './components/AdminFlowLayout';

// Error boundary component
function ErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);
  
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-primary mb-4 font-mainstay">Error {error.status}</h1>
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
        <h1 className="text-3xl font-bold text-primary mb-4 font-mainstay">Oops!</h1>
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

// Small DevControls wrapper component to avoid repetition
function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DevControls />
    </>
  );
}

// Define routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <ErrorBoundary />,
    children: [
      // Player routes (no layout)
      {
        index: true,
        element: <DevLayout><JoinPage /></DevLayout>,
      },
      {
        path: 'player', 
        element: <DevLayout><JoinPage /></DevLayout>,
      },
      {
        path: 'player/mascot',
        element: <DevLayout><MascotSelection /></DevLayout>,
      },
      {
        path: 'player/waiting',
        element: <DevLayout><WaitingForPlayers /></DevLayout>,
      },
      {
        path: 'player/quiz-starting',
        element: <DevLayout><QuizStarting /></DevLayout>,
      },
      {
        path: 'player/category',
        element: <DevLayout><CategoryName /></DevLayout>,
      },
      {
        path: 'player/answers',
        element: <DevLayout><AnswersPage /></DevLayout>,
      },
      {
        path: 'player/waiting-answer',
        element: <DevLayout><WaitingForAnswer /></DevLayout>,
      },
      {
        path: 'player/points',
        element: <DevLayout><HowManyPoints /></DevLayout>,
      },
      {
        path: 'player/team-points',
        element: <DevLayout><TeamPoints /></DevLayout>,
      },
      {
        path: 'player/final-team-points',
        element: <DevLayout><FinalTeamPoints /></DevLayout>,
      },
      {
        path: 'player/tension',
        element: <DevLayout><TensionPage /></DevLayout>,
      },
      {
        path: 'player/winners',
        element: <DevLayout><WinnersPage /></DevLayout>,
      },

      // Admin routes (nested under AdminFlowLayout)
      {
        path: 'admin',
        element: <AdminFlowLayout />,
        children: [
          {
            index: true,
            element: <SplashScreen />,
          },
          {
            path: 'qrcode',
            element: <DevLayout><QRCodePage /></DevLayout>,
          },
          {
            path: 'lobby',
            element: <DevLayout><LobbyPage /></DevLayout>,
          },
          {
            path: 'category',
            element: <DevLayout><CategoryName /></DevLayout>,
          },
          {
            path: 'question',
            element: <DevLayout><QuestionDisplayPage /></DevLayout>,
          },
          {
            path: 'waiting-answer',
            element: <DevLayout><WaitingForAnswer /></DevLayout>,
          },
          {
            path: 'answers',
            element: <DevLayout><AnswersPage /></DevLayout>,
          },
          {
            path: 'tension',
            element: <DevLayout><TensionPage /></DevLayout>,
          },
          {
            path: 'points',
            element: <DevLayout><TeamPoints /></DevLayout>,
          },
          {
            path: 'winners',
            element: <DevLayout><WinnersPage /></DevLayout>,
          }
        ]
      },

      // Other top-level routes
      {
        path: 'splash', // Keep separate splash if needed, or integrate into admin?
        element: <SplashScreen />,
      },
      {
        path: 'test',
        element: <TestPage />,
      }
    ]
  }
]);

// EXPORT the router object directly
export { router };
