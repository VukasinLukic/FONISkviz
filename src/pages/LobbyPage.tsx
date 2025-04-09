import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../lib/firebase';
import { useQuizAdmin } from '../lib/useQuizAdmin';
import Logo from '../components/Logo';
import MainButton from '../components/MainButton';

const LobbyPage = () => {
  const navigate = useNavigate();
  const { gameState, teams, startNewGame, loading } = useQuizAdmin();
  const [showStartButton, setShowStartButton] = useState(false);
  
  // Get the gameCode from the game state
  const gameCode = gameState?.gameCode || '';
  
  // No need to filter teams again - they're already filtered in useQuizAdmin
  // We'll use the teams array directly from the hook
  
  // Show start button after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartButton(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleStartGame = async () => {
    try {
      await startNewGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };
  
  const maskotImages = Array.from({ length: 8 }, (_, i) => `/assets/mascots/mascot-${i + 1}.svg`);
  
  return (
    <div className="min-h-screen bg-accent p-4 relative">
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" onClick={() => navigate('/admin')} />
      </motion.div>
      
      {/* Game Code Display */}
      <motion.div
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Game Code: {gameCode}
      </motion.div>
      
      {/* Header */}
      <div className="text-center pt-20 pb-8">
        <motion.h1 
          className="text-4xl text-primary font-bold font-mainstay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          LOBBY
        </motion.h1>
        <motion.p
          className="text-primary opacity-80 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {teams.length === 0 
            ? "Waiting for teams to join..." 
            : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'} in the lobby`}
        </motion.p>
      </div>
      
      {/* Teams Grid */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                layout
              >
                <div className="w-20 h-20 mb-2 overflow-hidden">
                  <img
                    src={team.mascotId ? `/assets/maskota${team.mascotId}.svg` : maskotImages[0]}
                    alt={`Team Mascot ${team.mascotId}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback if mascot image fails to load
                      const target = e.currentTarget;
                      target.src = "/assets/mascots/mascot-1.svg"; // Default mascot
                    }}
                  />
                </div>
                <h2 className="text-primary font-bold text-center">
                  {team.name}
                </h2>
                <div className="flex items-center mt-2">
                  <div className="w-3 h-3 bg-highlight rounded-full mr-2"></div>
                  <span className="text-sm text-primary opacity-80">Ready</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Start Game button - conditionally shown */}
      <AnimatePresence>
        {showStartButton && (
          <motion.div 
            className="flex justify-center mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <MainButton
              onClick={handleStartGame}
              disabled={loading || teams.length === 0}
              className={`
                py-3 px-10 text-lg
                ${teams.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </MainButton>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Connected teams indicator */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 text-center text-primary opacity-80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-sm">
          Share the game code or QR code with players to join
        </p>
      </motion.div>
    </div>
  );
};

export default LobbyPage; 