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
    { name: 'Category', path: '/player/category' },
    { name: 'Question', path: '/player/question' },
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
  
  const handleCreateNewGame = async () => {
    if (window.confirm('Create a new game with a fresh game code?')) {
      await createNewGame();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-secondary text-white p-2 rounded-full shadow-lg flex items-center justify-center w-12 h-12"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </motion.button>
      
      {/* Control panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bg-accent p-4 rounded-lg shadow-xl absolute bottom-16 right-0 w-64"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4">
              <h3 className="font-bold text-primary mb-1">Dev Controls</h3>
              <p className="text-xs text-primary/70">Current: {getCurrentRouteName()}</p>
              {gameState && (
                <div className="mt-2 text-xs">
                  <p className="text-primary/70">Game Code: {gameState.gameCode || 'None'}</p>
                  <p className="text-primary/70">Status: {gameState.status}</p>
                  <p className="text-primary/70">Round: {gameState.currentRound}</p>
                  <p className="text-primary/70">Teams: {teams.length}</p>
                </div>
              )}
            </div>
            
            <div className="mb-3">
              <h4 className="text-sm font-bold text-primary mb-1">Admin Routes</h4>
              <div className="grid grid-cols-2 gap-1">
                {adminRoutes.map(route => (
                  <button
                    key={route.path}
                    onClick={() => navigate(route.path)}
                    className={`text-xs p-1 rounded ${location.pathname === route.path 
                      ? 'bg-secondary text-white' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <h4 className="text-sm font-bold text-primary mb-1">Player Routes</h4>
              <div className="grid grid-cols-2 gap-1">
                {playerRoutes.map(route => (
                  <button
                    key={route.path}
                    onClick={() => navigate(route.path)}
                    className={`text-xs p-1 rounded ${location.pathname === route.path 
                      ? 'bg-secondary text-white' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                  >
                    {route.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="bg-primary text-xs text-white px-2 py-1 rounded hover:bg-opacity-90"
              >
                Reset Game
              </button>
              <button
                onClick={handleCreateNewGame}
                className="bg-secondary text-xs text-white px-2 py-1 rounded hover:bg-opacity-90"
              >
                New Game
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevControls; 