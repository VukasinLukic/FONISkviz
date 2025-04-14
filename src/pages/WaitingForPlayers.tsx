import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Database } from 'firebase/database';
import { getMascotImageUrl } from '../lib/utils';

// Removing the TiebreakingRules component as requested
// const TiebreakingRules: React.FC = () => { ... };

const WaitingForPlayers: React.FC = () => {
  const [dots, setDots] = useState('');
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get team data from localStorage
  const [teamData, setTeamData] = useState({
    teamId: localStorage.getItem('teamId') || '',
    teamName: localStorage.getItem('teamName') || '',
    mascotId: parseInt(localStorage.getItem('mascotId') || '1'),
    gameCode: localStorage.getItem('gameCode') || ''
  });

  // Use the game state hook
  const { gameData, error: gameError, loading: gameLoading } = useGameRealtimeState(teamData.gameCode);

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
    if (!teamData.teamId || !teamData.teamName) {
      navigate(isPlayerRoute ? '/player' : '/');
    }
  }, [teamData.teamId, teamData.teamName, navigate, isPlayerRoute]);

  // React to game status changes
  useEffect(() => {
    if (gameData?.status === 'question_display') {
      console.log('[WaitingForPlayers] Game status changed to question_display, navigating to question page.');
      navigate('/player/question');
    }
    // Add other status navigations if needed (e.g., if admin resets)
    else if (gameData?.status === 'finished' || gameData?.status === 'game_end') {
       console.log('[WaitingForPlayers] Game ended, navigating to finished page.');
       navigate('/player/finished');
    }
  }, [gameData, navigate]);

  // Handle loading and error states for game data
  if (gameLoading) {
    return (
      <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <p className="text-accent text-xl font-caviar z-10">Učitavanje podataka igre...</p>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <p className="text-red-500 text-xl font-caviar z-10">Greška pri učitavanju igre: {gameError.message}</p>
        <button onClick={() => navigate('/player')} className="mt-4 text-accent underline z-10">Nazad na prijavu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatedBackground density="medium" />
      
      {/* Centered header container */}
      <div className="w-full flex justify-center items-center z-40 absolute top-6 left-0 right-0 pt-6">
        {/* Centered logo with proper padding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="ml-6" // Dodajte marginu levo
        >
          <Logo size="large" className="w-64 h-64 md:w-64 md:h-64" />
        </motion.div>
      </div>
      
      <motion.div 
        className="z-20 flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-accent mb-6 font-serif"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {teamData.teamName}
        </motion.h1>
        
        <motion.div 
          className="relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Pulse effect behind mascot */}
          <motion.div
            className="absolute inset-0 bg-special  rounded-full"
            animate={{
              scale: [1.1, 1.2, 1.1],
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
          
          {teamData.mascotId > 0 && !imageError ? (
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
                src={getMascotImageUrl(teamData.mascotId)}
                alt={`Maskota tima`}
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
              <p className="text-primary text-4xl font-serif">?</p>
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
            Čekamo da igra počne...
          </p>
          <p className="text-accent/70 text-sm mt-2">
            Domaćin će započeti kviz uskoro
          </p>
          
          {/* Tiebreaking Rules Component - REMOVED */}
          {/* 
          <div className="mt-6 flex justify-center">
            <TiebreakingRules />
          </div> 
          */}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WaitingForPlayers; 