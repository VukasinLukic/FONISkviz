import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { getGame } from '../lib/firebase';

const WaitingForPlayers: React.FC = () => {
  const [dots, setDots] = useState('');
  const [imageError, setImageError] = useState(false);
  const { gameState } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const isPlayerRoute = location.pathname.startsWith('/player');

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // If no team info, redirect to the join page
  useEffect(() => {
    if (!gameState.teamId || !gameState.isRegistered) {
      navigate(isPlayerRoute ? '/player' : '/');
    }
  }, [gameState.teamId, gameState.isRegistered, navigate, isPlayerRoute]);

  // Actively check for game status to ensure immediate transition when the game starts
  useEffect(() => {
    // Skip if game is already started according to our state
    if (gameState.isGameStarted) {
      console.log('Game already started, navigating to category');
      navigate(isPlayerRoute ? '/player/category' : '/category');
      return;
    }

    // Set up polling for game start status
    const checkGameStatus = async () => {
      if (checkingStatus) return; // Prevent concurrent checks
      
      try {
        setCheckingStatus(true);
        const game = await getGame();
        
        if (game && game.isActive) {
          console.log('Game started, detected in WaitingForPlayers component, navigating to category');
          navigate(isPlayerRoute ? '/player/category' : '/category');
        }
      } catch (error) {
        console.error('Error checking game status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Check immediately once
    checkGameStatus();
    
    // Then set up regular polling
    const pollInterval = setInterval(checkGameStatus, 2000);
    
    return () => clearInterval(pollInterval);
  }, [gameState.isGameStarted, isPlayerRoute, navigate, checkingStatus]);

  const getMascotPath = (mascotId: number) => {
    return `/assets/maskota${mascotId} 1.svg`;
  };

  return (
    <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatedBackground density="medium" />
      
      <motion.div
        className="z-30 absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" />
      </motion.div>
      
      {/* Game code display */}
      {gameState.gameCode && (
        <motion.div
          className="z-30 absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Game Code: {gameState.gameCode}
        </motion.div>
      )}
      
      <motion.div 
        className="z-20 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-accent mb-6 font-mainstay text-center"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {gameState.teamName}
        </motion.h1>
        
        <motion.div 
          className="relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Pulse effect behind mascot */}
          <motion.div
            className="absolute inset-0 bg-highlight rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ 
              width: "100%", 
              height: "100%",
              zIndex: -1
            }}
          />
          
          {gameState.mascotId > 0 && !imageError ? (
            <motion.div
              className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{
                y: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                rotate: { duration: 5, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <img 
                src={getMascotPath(gameState.mascotId)}
                alt={`Team mascot`}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            </motion.div>
          ) : (
            <motion.div 
              className="w-48 h-48 md:w-64 md:h-64 bg-accent rounded-full flex items-center justify-center"
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <p className="text-primary text-4xl font-mainstay">?</p>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-accent text-xl font-caviar">
            Waiting for the game to start{dots}
          </p>
          <p className="text-accent/70 text-sm mt-2">
            The host will start the game when all teams are ready
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WaitingForPlayers; 