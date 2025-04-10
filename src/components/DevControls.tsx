import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizAdmin } from '../lib/useQuizAdmin';

const DevControls = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { resetGameState, createNewGame, teams, gameState } = useQuizAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  const adminRoutes = [
    { name: 'Admin Home', path: '/admin' },
    { name: 'QR Code', path: '/admin/qrcode' },
    { name: 'Lobby', path: '/admin/lobby' },
    { name: 'Category', path: '/admin/category' },
    { name: 'Question', path: '/admin/question' },
    { name: 'Answers', path: '/admin/answers' },
    { name: 'Team Points', path: '/admin/points' },
    { name: 'Winners', path: '/admin/winners' }
  ];
  
  const playerRoutes = [
    { name: 'Join Page', path: '/player' },
    { name: 'Mascot Selection', path: '/player/mascot' },
    { name: 'Waiting', path: '/player/waiting' },
    { name: 'Quiz Starting', path: '/player/quiz-starting' },
    { name: 'Category', path: '/player/category' },
    { name: 'Answers', path: '/player/answers' },
    { name: 'Waiting Answer', path: '/player/waiting-answer' },
    { name: 'How Many Points', path: '/player/points' },
    { name: 'Team Points', path: '/player/team-points' },
    { name: 'Final Points', path: '/player/final-team-points' },
    { name: 'Winners', path: '/player/winners' }
  ];
  
  const getCurrentRouteName = () => {
    const currentPath = location.pathname;
    const allRoutes = [...adminRoutes, ...playerRoutes];
    const route = allRoutes.find(r => r.path === currentPath);
    return route ? route.name : 'Unknown';
  };
  
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the game state?')) {
      await resetGameState();
      navigate('/admin');
    }
  };
  
  const handleNewGame = async () => {
    if (window.confirm('Create a new game? This will reset all data.')) {
      await createNewGame();
    }
  };
  
  const toggleDevPanel = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggleDevPanel}
        className="fixed bottom-4 right-4 z-50 p-2 bg-secondary rounded-full shadow-lg hover:bg-secondary/90 transition-colors"
        title="Toggle Developer Controls"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Developer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-y-0 right-0 z-40 w-64 bg-white/95 shadow-lg overflow-y-auto"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-primary">Dev Controls</h2>
                <button
                  onClick={toggleDevPanel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Current state info */}
              <div className="mb-4 p-2 bg-primary/10 rounded">
                <p className="text-xs font-medium text-primary mb-1">Current: {getCurrentRouteName()}</p>
                <p className="text-xs text-primary mb-1">Game Code: {gameState?.gameCode || 'None'}</p>
                <p className="text-xs text-primary mb-1">Teams: {teams.length}</p>
                <p className="text-xs text-primary mb-1">Status: {gameState?.status || 'Unknown'}</p>
              </div>
              
              {/* Admin actions */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-primary">Game Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleNewGame}
                    className="p-2 bg-secondary text-white text-xs rounded hover:bg-secondary/90"
                  >
                    New Game
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Reset Game
                  </button>
                </div>
              </div>
              
              {/* Admin routes */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-primary">Admin Routes</h3>
                <div className="space-y-1">
                  {adminRoutes.map((route) => (
                    <button
                      key={route.path}
                      onClick={() => {
                        navigate(route.path);
                        setIsOpen(false);
                      }}
                      className={`block w-full text-left p-2 text-xs rounded ${
                        location.pathname === route.path
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary/10 text-primary'
                      }`}
                    >
                      {route.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Player routes */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-primary">Player Routes</h3>
                <div className="space-y-1">
                  {playerRoutes.map((route) => (
                    <button
                      key={route.path}
                      onClick={() => {
                        navigate(route.path);
                        setIsOpen(false);
                      }}
                      className={`block w-full text-left p-2 text-xs rounded ${
                        location.pathname === route.path
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary/10 text-primary'
                      }`}
                    >
                      {route.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Version info */}
              <div className="mt-auto pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  FONIS Kviz Dev Panel v1.0.2
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DevControls; 