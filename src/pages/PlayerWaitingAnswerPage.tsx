import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

const PlayerWaitingAnswerPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState('');

  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');

  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Listen to game status changes and navigate
  useEffect(() => {
    if (!gameCode || !teamId) {
      // Redirect if essential info is missing
      setError("Missing game code or team ID. Redirecting...");
      setTimeout(() => navigate('/player'), 1500);
      return;
    }

    if (gameLoading || gameError || !game) {
      return; // Wait for valid game data
    }

    console.log('PlayerWaitingAnswerPage: Game status updated to:', game.status);

    // Handle game status changes
    switch (game.status) {
      case 'waiting':
        console.log('PlayerWaitingAnswerPage: Navigating to waiting page (unexpected state change)');
        navigate('/player/waiting');
        break;
      case 'answer_reveal':
        console.log('PlayerWaitingAnswerPage: Navigating to answer result page');
        navigate('/player/answer-result');
        break;
      case 'game_end':
      case 'finished':
        console.log('PlayerWaitingAnswerPage: Navigating to finished page');
        navigate('/player/finished');
        break;
      default:
        // Includes 'question_display' and 'answer_collection' - stay on this page
        console.log(`PlayerWaitingAnswerPage: Staying on page for status: ${game.status}`);
        break;
    }
  }, [game, gameLoading, gameError, gameCode, teamId, navigate]);

  // Combine local and hook errors
  const displayError = error || gameError?.message;

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Error</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/player')}
          className="mt-4 text-accent underline"
        >
          Return to Join Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex items-center justify-center">
      <AnimatedBackground density="low" />
      
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" />
      </motion.div>
      
      {/* Team Name Display */}
      <motion.div
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Team: {teamName}
      </motion.div>
      
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 text-xs text-accent/50 z-40">
        Status: {game?.status || (gameLoading ? 'loading...' : 'unknown')}
      </div>
      
      {/* Waiting Message */}
      <div className="flex flex-col items-center justify-center">
        <motion.div
          className="text-center z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl text-accent font-bold mb-4 font-serif">
            Čekanje rezultata{dots}
          </h1>
          <p className="text-accent/70">
            Sačekajte da admin otkrije tačan odgovor
          </p>
        </motion.div>
        
        {/* Animated Waiting Indicator */}
        <motion.div
          className="mt-8 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerWaitingAnswerPage; 