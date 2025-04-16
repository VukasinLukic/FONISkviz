import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { getMascotImageUrl } from '../lib/utils';

const PlayerWaitingAnswerPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');
  const mascotId = parseInt(localStorage.getItem('mascotId') || '1');

  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);
  
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
          <p className="text-lg font-bold mb-2">Greška</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/player')}
          className="mt-4 text-accent underline"
        >
          Nazad na prijavu
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-2 sm:p-4 relative overflow-hidden flex flex-col items-center">
      <AnimatedBackground density="low" />
      
      {/* Centered Larger Logo at top */}
      <div className="w-full flex justify-center pt-2 sm:pt-10 pb-0 sm:pb-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="responsive-logo"
        >
          <Logo size="large" className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64" />
        </motion.div>
      </div>
      
      {/* Team Name Display */}
      <motion.h1 
          className="text-5xl sm:text-4xl md:text-5xl mt-16 font-bold text-accent mb-4 sm:mb-6 font-basteleur"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {teamName}
        </motion.h1>
      
      {/* Waiting Message - No animation */}
      <div className="flex flex-col items-center justify-center flex-grow max-h-[60vh]">
        <div className="text-center z-30 mb-2 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl text-accent font-bold mb-2 sm:mb-4 font-basteleur">
            čekanje rezultata...
          </h1>
          <p className="text-accent/70 mb-4 sm:mb-12 text-base sm:text-xl">
            sačekajte da svi timovi odgovore!
          </p>
        </div>
        
        {/* Team Mascot Animation */}
        {mascotId > 0 && !imageError ? (
          <motion.div
            className="w-52 h-52 sm:w-56 sm:h-56 md:w-72 md:h-72 flex items-center justify-center p-4 sm:p-6 bg-accent/10 rounded-full shadow-inner responsive-mascot"
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -10, 0]
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              y: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
            }}
          >
            <img 
              src={getMascotImageUrl(mascotId)}
              alt="Team mascot"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            className="w-28 h-28 sm:w-40 sm:h-40 bg-accent/30 rounded-full flex items-center justify-center responsive-mascot"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <span className="text-accent text-3xl sm:text-4xl">?</span>
          </motion.div>
        )}
      </div>
      
      {/* Debug Info - Hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-accent/30 z-40">
          Status: {game?.status || (gameLoading ? 'loading...' : 'unknown')}
        </div>
      )}
    </div>
  );
};

export default PlayerWaitingAnswerPage; 