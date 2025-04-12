import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, get } from 'firebase/database';
import { getDb, GameStatus } from './lib/firebase';
import Logo from './components/Logo';
import AnimatedBackground from './components/AnimatedBackground';
import { motion } from 'framer-motion';
import { Database } from 'firebase/database';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  
  // Get data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');

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

  useEffect(() => {
    if (!gameCode || !teamId) {
      navigate('/');
      return;
    }

    addLog(`PlayerWaitingPage: Listening for game updates with gameCode: ${gameCode}`);
    
    let unsubscribe: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        const db = await getDb();
        const gameRef = ref(db, `game/${gameCode}`);
        
        unsubscribe = onValue(gameRef, (snapshot) => {
          if (!snapshot.exists()) {
            setError("Game not found");
            return;
          }
  
          const gameData = snapshot.val() as GameData;
          setGameStatus(gameData.status);
          setLastUpdated(new Date().toLocaleTimeString());
          addLog(`PlayerWaitingPage: Game status updated to: ${gameData.status} at ${new Date().toLocaleTimeString()}`);
          
          // Handle different game states
          switch (gameData.status) {
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
            case 'game_end':
              addLog(`PlayerWaitingPage: Navigating to finished page`);
              navigate('/player/finished');
              break;
            case 'waiting':
            default:
              // Stay on waiting page
              addLog(`PlayerWaitingPage: Staying on waiting page`);
              break;
          }
          
          setLoading(false);
        });
      } catch (err) {
        addLog(`Error setting up listener: ${err}`);
        setError(`Failed to connect to Firebase: ${err}`);
      }
    };
    
    setupListener();

    return () => {
      addLog(`PlayerWaitingPage: Unsubscribing from game updates`);
      if (unsubscribe) unsubscribe();
    };
  }, [gameCode, navigate, teamId]);

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

  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
      <AnimatedBackground density="low" />
      
      {/* Logo */}
      <div className="absolute top-6 left-6 z-40">
        <Logo size="small" />
      </div>
      
      {/* Game Code Display */}
      <div className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40">
        Game Code: {gameCode}
      </div>

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-accent/80 z-40 bg-primary/50 p-2 rounded">
        <div>Status: {gameStatus || 'unknown'}</div>
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
      </div>

      {/* Content */}
      <div className="h-full flex flex-col items-center justify-center pt-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Team Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-accent mb-2">{teamName}</h2>
          </div>

          <h1 className="text-3xl font-bold text-accent mb-4">
            Waiting for the game to start...
          </h1>
          <p className="text-accent/80">
            The host will start the game when all teams are ready
          </p>

          {error && (
            <div className="mt-4 text-red-500 bg-red-500/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 