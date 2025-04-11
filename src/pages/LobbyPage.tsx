import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../lib/firebase';
import { useQuizAdmin } from '../lib/useQuizAdmin';
import Logo from '../components/Logo';
import MainButton from '../components/MainButton';
import AnimatedBackground from '../components/AnimatedBackground';

const LobbyPage = () => {
  const navigate = useNavigate();
  const { gameState, teams, startNewGame, loading } = useQuizAdmin();
  const [showStartButton, setShowStartButton] = useState(false);
  const [previousTeamsCount, setPreviousTeamsCount] = useState(0);
  const [newTeamIndex, setNewTeamIndex] = useState<number | null>(null);
  
  // Get the gameCode from the game state
  const gameCode = gameState?.gameCode || '';
  
  // Show start button after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartButton(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if the game is already active and redirect if needed
  useEffect(() => {
    if (gameState?.isActive) {
      console.log('Game is already active, redirecting to category');
      navigate('/admin/category');
    }
  }, [gameState?.isActive, navigate]);
  
  // Track when new teams join to trigger animations
  useEffect(() => {
    if (teams.length > previousTeamsCount) {
      // New team joined
      setNewTeamIndex(teams.length - 1);
      
      // Reset the new team indicator after animation
      const timer = setTimeout(() => {
        setNewTeamIndex(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    setPreviousTeamsCount(teams.length);
  }, [teams.length, previousTeamsCount]);
  
  const handleStartGame = async () => {
    try {
      await startNewGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };
  
  // Get the correct path for mascot images
  const getMascotPath = (mascotId: number) => {
    try {
      return `/assets/maskota${mascotId} 1.svg`;
    } catch (error) {
      return `/assets/maskota1 1.svg`; // Default mascot
    }
  };
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
      <AnimatedBackground density="high" />
      
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" onClick={() => navigate('/admin')} />
      </motion.div>
      
      {/* Game Code Display */}
      <motion.div
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Game Code: {gameCode}
      </motion.div>
      
      {/* Header */}
      <div className="text-center pt-20 pb-8 relative z-30">
        <motion.h1 
          className="text-4xl text-accent font-bold font-mainstay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          LOBBY
        </motion.h1>
        <motion.p
          className="text-accent opacity-80 mt-2"
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
      <div className="max-w-4xl mx-auto mb-8 relative z-30">
        {teams.length === 0 ? (
          <motion.div
            className="bg-accent/20 p-8 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-accent text-xl">No teams have joined yet</p>
            <p className="text-accent/70 mt-2">Share the game code with players to join</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  className={`bg-accent p-4 rounded-lg shadow-md flex flex-col items-center
                    ${newTeamIndex === index ? 'ring-4 ring-highlight ring-opacity-70' : ''}`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: newTeamIndex === index ? [1, 1.05, 1] : 1, 
                    y: 0,
                    transition: {
                      scale: newTeamIndex === index ? { 
                        duration: 0.8, 
                        repeat: 2, 
                        repeatType: "reverse" 
                      } : undefined
                    }
                  }}
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
                      src={getMascotPath(team.mascotId || 1)}
                      alt={`Team Mascot`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback if mascot image fails to load
                        const target = e.currentTarget;
                        target.src = "/assets/maskota1 1.svg"; // Default mascot
                      }}
                    />
                  </div>
                  <h2 className="text-primary font-bold text-center">
                    {team.name}
                  </h2>
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 bg-highlight rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-primary opacity-80">Ready</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Start Game button - conditionally shown */}
      <AnimatePresence>
        {showStartButton && (
          <motion.div 
            className="flex justify-center mt-4 relative z-30"
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
        className="absolute bottom-8 left-0 right-0 text-center text-accent opacity-80 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-sm">
          Share the game code with players to join
        </p>
      </motion.div>
    </div>
  );
};

export default LobbyPage; 