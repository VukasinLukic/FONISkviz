import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
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
import DevControls from './components/DevControls';

// Admin stranice će doći kasnije
const AdminHome = () => <div className="min-h-screen bg-accent p-4 flex items-center justify-center">
  <h1 className="text-primary text-2xl font-bold">Admin Home (Coming Soon)</h1>
</div>;

// Layout komponenta koja sadrži DevControls
const Layout = () => {
  const isDev = import.meta.env.DEV;
  
  return (
    <>
      {isDev && <DevControls />}
      <div className="pt-20"> {/* Padding za DevControls */}
        <Outlet />
      </div>
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Player Routes
      {
        path: '/player',
        element: <JoinPage />,
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
      
      // Admin Routes (rezervisano za kasnije)
      {
        path: '/admin',
        element: <AdminHome />,
      },
      
      // Fallback i legacy rute (za kompatibilnost sa već napisanim kodom)
      {
        path: '/',
        element: <JoinPage />,
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
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
