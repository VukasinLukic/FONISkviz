import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, get } from 'firebase/database';
import { GameStatus, getDb } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { motion } from 'framer-motion';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Database } from 'firebase/database';
import { getMascotImageUrl } from '../lib/utils';

interface GameData {
  currentQuestionIndex: number;
  questionOrder: string[];
  questions: Question[];
  status: GameStatus;
  timerEnd: number | null;
  currentRound: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
}

export default function PlayerWaitingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  const [imageError, setImageError] = useState(false);

  // Get data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');
  const mascotId = parseInt(localStorage.getItem('mascotId') || '1');

  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  // Funkcija za dodavanje log poruka
  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [message, ...prev].slice(0, 10));
  };

  // Provera statusa igre odmah pri učitavanju
  useEffect(() => {
    const checkGameStatus = async () => {
      if (!gameCode) return;
      
      try {
        addLog(`Manual check - Getting game status for ${gameCode}`);
        const db = await getDb();
        const gameRef = ref(db, `game/${gameCode}`);
        const snapshot = await get(gameRef);
        
        if (snapshot.exists()) {
          const gameData = snapshot.val() as GameData;
          addLog(`Manual check - Game status: ${gameData.status}`);
          
          // Ako je status question_display, odmah navigiraj
          if (gameData.status === 'question_display') {
            addLog(`Manual check - Navigating to question page`);
            navigate('/player/question');
          }
        } else {
          addLog(`Manual check - Game not found`);
        }
      } catch (err) {
        addLog(`Manual check - Error: ${err}`);
      }
    };
    
    checkGameStatus();
  }, [gameCode, navigate]);

  // Handle navigation based on game status from hook
  useEffect(() => {
    if (!gameCode || !teamId) {
      // Already handled by initial redirect if needed
      return;
    }

    if (gameLoading || !game || gameError) {
      return; // Wait for game data
    }

    addLog(`PlayerWaitingPage: Game status updated to: ${game.status} at ${new Date().toLocaleTimeString()}`);
    setLastUpdated(new Date().toLocaleTimeString());

    // Handle different game states
    switch (game.status) {
      case 'question_display':
        addLog(`PlayerWaitingPage: Navigating to question page`);
        navigate('/player/question');
        break;
      case 'answer_collection':
        addLog(`PlayerWaitingPage: Navigating to waiting-answer page`);
        navigate('/player/waiting-answer');
        break;
      case 'answer_reveal':
        addLog(`PlayerWaitingPage: Navigating to answer-result page`);
        navigate('/player/answer-result');
        break;
      case 'leaderboard':
        addLog(`PlayerWaitingPage: Navigating to score page`);
        navigate('/player/score');
        break;
      case 'game_end':
      case 'finished':
        addLog(`PlayerWaitingPage: Navigating to finished page`);
        navigate('/player/finished');
        break;
      case 'waiting':
      default:
        // Stay on waiting page
        addLog(`PlayerWaitingPage: Staying on waiting page (status: ${game.status})`);
        break;
    }
  }, [game, gameLoading, gameError, gameCode, teamId, navigate]);

  // Klik za manuelnu proveru Firebase-a
  const checkFirebaseAgain = async () => {
    if (!gameCode) return;
    
    try {
      addLog(`Manual button check - Getting game status for ${gameCode}`);
      const db = await getDb();
      const gameRef = ref(db, `game/${gameCode}`);
      const snapshot = await get(gameRef);
      
      if (snapshot.exists()) {
        const gameData = snapshot.val() as GameData;
        addLog(`Manual button check - Game status: ${gameData.status}`);
        
        // Ako je status question_display, odmah navigiraj
        if (gameData.status === 'question_display') {
          addLog(`Manual button check - Navigating to question page`);
          navigate('/player/question');
        }
      } else {
        addLog(`Manual button check - Game not found`);
      }
    } catch (err) {
      addLog(`Manual button check - Error: ${err}`);
    }
  };

  // Combine local and hook errors
  const displayError = error || gameError?.message;

  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex flex-col items-center">
      <AnimatedBackground density="low" />
      
      {/* Balanced header container */}
      <div className="w-full flex justify-between items-center px-6 pt-6 z-40">
        {/* Logo on the left */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="medium" className="w-20 h-20" />
        </motion.div>
        
        {/* Game code on the right */}
        <motion.div
          className="bg-secondary text-white px-4 py-2 rounded-lg shadow-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-sm">Kod Igre</p>
          <p className="text-lg font-bold tracking-wider">{gameCode}</p>
        </motion.div>
      </div>
      
      {/* Team Name Display centered */}
      <motion.div
        className="text-accent text-xl font-bold font-serif mt-8 mb-8 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Tim: {teamName}
      </motion.div>

      {/* Debug Info - Hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-16 left-4 right-4 text-xs text-accent/80 z-40 bg-primary/50 p-2 rounded">
          <div>Status: {game?.status || (gameLoading ? 'loading...' : 'unknown')}</div>
          <div>Last updated: {lastUpdated}</div>
          <button 
            onClick={checkFirebaseAgain}
            className="mt-1 px-2 py-1 bg-accent/20 rounded text-accent"
          >
            Check Firebase Now
          </button>
          <div className="mt-2 max-h-32 overflow-auto">
            {debugLogs.map((log, i) => (
              <div key={i} className="text-xs text-accent/60 border-t border-accent/10 py-1">
                {log}
              </div>
            ))}
          </div>
          {displayError && (
            <div className="mt-4 text-red-500 bg-red-500/10 p-3 rounded-lg">
              {displayError}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="text-center z-30 mb-8">
          <h1 className="text-4xl text-accent font-bold mb-6 font-serif">
            Čekamo da igra uskoro počne...
          </h1>
        </div>
        
        {/* Mascot Display - Larger with more padding */}
        {mascotId > 0 && !imageError ? (
          <motion.div
            className="w-52 h-52 md:w-64 md:h-64 flex items-center justify-center p-4 bg-accent/10 rounded-full shadow-inner"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
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
            className="w-40 h-40 bg-accent/30 rounded-full flex items-center justify-center"
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
            <span className="text-accent text-4xl">?</span>
          </motion.div>
        )}
      </div>
    </div>
  );
} 