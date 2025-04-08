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

// Error boundary component
function ErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);
  
  // You can render different error messages based on the error type
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-accent p-6 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-primary mb-4 font-mainstay">Error {error.status}</h1>
          <p className="text-primary mb-6">{error.statusText || error.data.message}</p>
          <button 
            onClick={() => window.location.href = '/admin'} 
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
          onClick={() => window.location.href = '/admin'} 
          className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-all"
        >
          Go to Start Screen
        </button>
      </div>
    </div>
  );
}

// Layout komponenta koja sadrži DevControls
const Layout = () => {
  const isDev = import.meta.env.DEV;
  
  return (
    <>
      {isDev && <DevControls />}
      <div className="h-screen overflow-hidden"> {/* Uklonjen padding-top */}
        <Outlet />
      </div>
    </>
  );
};

// Admin Layout sa DevControls i za admin stranice
const AdminLayout = () => {
  const isDev = import.meta.env.DEV;
  
  return (
    <>
      {isDev && <DevControls visible={true} />}
      <div className="pt-20"> {/* Padding za DevControls */}
        <Outlet />
      </div>
    </>
  );
};

// Admin Layout sa DevControls i za admin stranice
const AdminLayout = () => {
  const isDev = import.meta.env.DEV;
  
  return (
    <>
      {isDev && <DevControls visible={true} />}
      <div className="pt-20"> {/* Padding za DevControls */}
        <Outlet />
      </div>
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Player Routes
      {
        path: '/player',
        element: <JoinPage />,
      },
      {
        path: '/player/mascot',
        element: <MascotSelection />,
      },
      {
        path: '/player/waiting',
        element: <WaitingForPlayers />,
      },
      {
        path: '/player/quiz-starting',
        element: <QuizStarting />,
      },
      {
        path: '/player/category',
        element: <CategoryName />,
      },
      {
        path: '/player/answers',
        element: <AnswersPage />,
      },
      {
        path: '/player/waiting-answer',
        element: <WaitingForAnswer />,
      },
      {
        path: '/player/points',
        element: <HowManyPoints />,
      },
      {
        path: '/player/team-points',
        element: <TeamPoints />,
      },
      {
        path: '/player/final-team-points',
        element: <FinalTeamPoints />,
      },
      {
        path: '/player/tension',
        element: <TensionPage />,
      },
      {
        path: '/player/winners',
        element: <WinnersPage />,
      },
      
      // Fallback i legacy rute (za kompatibilnost sa već napisanim kodom)
      {
        path: '/',
        element: <JoinPage />,
      },
      {
        path: '/mascot',
        element: <MascotSelection />,
      },
      {
        path: '/waiting',
        element: <WaitingForPlayers />,
      },
      {
        path: '/quiz-starting',
        element: <QuizStarting />,
      },
      {
        path: '/category',
        element: <CategoryName />,
      },
      {
        path: '/answers',
        element: <AnswersPage />,
      },
      {
        path: '/waiting-answer',
        element: <WaitingForAnswer />,
      },
      {
        path: '/points',
        element: <HowManyPoints />,
      },
      {
        path: '/team-points',
        element: <TeamPoints />,
      },
      {
        path: '/final-team-points',
        element: <FinalTeamPoints />,
      },
      {
        path: '/tension',
        element: <TensionPage />,
      },
      {
        path: '/winners',
        element: <WinnersPage />,
      },
    ],
  },
  // Admin Routes u posebnom layoutu
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <SplashScreen />,
      },
      {
        path: 'qrcode',
        element: <QRCodePage />,
      },
      {
        path: 'lobby',
        element: <LobbyPage />,
      },
      {
        path: 'category',
        element: <CategoryName />,
      },
      {
        path: 'answers',
        element: <AnswersPage />,
      },
      {
        path: 'tension',
        element: <TensionPage />,
      },
      {
        path: 'points',
        element: <TeamPoints />,
      },
      {
        path: 'winners',
        element: <WinnersPage />,
      },
    ],
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
