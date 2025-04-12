import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

// Component to display tiebreaking rules
const TiebreakingRules: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative z-40">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-accent underline text-sm flex items-center"
      >
        {isOpen ? 'Sakrij pravila' : 'Kako se određuje pobednik?'}
        <span className="ml-1">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-accent/10 rounded-lg p-4 mt-2 text-accent text-sm overflow-hidden"
          >
            <h3 className="font-bold mb-2">Pravila za određivanje pobednika:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <span className="font-semibold">Ukupni poeni:</span> Tim sa najviše ukupnih poena je pobednik
              </li>
              <li>
                <span className="font-semibold">Brzina odgovora:</span> Ako dva tima imaju isti broj poena, 
                pobednik je onaj koji je više puta bio prvi sa tačnim odgovorom 
              </li>
              <li>
                <span className="font-semibold">Vreme priključenja:</span> Ako je i dalje nerešeno, 
                tim koji se prvi priključio kvizu ima prednost
              </li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  }, [gameData, navigate]);

  const getMascotPath = (mascotId: number) => {
    return `/assets/maskota${mascotId} 1.svg`;
  };

  // Handle loading and error states for game data
  if (gameLoading) {
    return (
      <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <p className="text-accent text-xl font-caviar z-10">Loading game data...</p>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <p className="text-red-500 text-xl font-caviar z-10">Error loading game: {gameError.message}</p>
      </div>
    );
  }

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
      {teamData.gameCode && (
        <motion.div
          className="z-30 absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Game Code: {teamData.gameCode}
        </motion.div>
      )}
      
      <motion.div 
        className="z-20 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-accent mb-6 font-serif text-center"
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
                src={getMascotPath(teamData.mascotId)}
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
            Waiting for the game to start{dots}
          </p>
          <p className="text-accent/70 text-sm mt-2">
            The host will start the game when all teams are ready
          </p>
          
          {/* Tiebreaking Rules Component */}
          <div className="mt-6 flex justify-center">
            <TiebreakingRules />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WaitingForPlayers; 