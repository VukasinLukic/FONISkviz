import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getGameData, 
  getQuestion, 
  updateGameStatus, 
  setGameStatus,
  processQuestionResults,
  updateGameData,
  Question,
  Game,
  getDb
} from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import MainButton from '../components/MainButton';
import DevTools from '../components/DevTools';
import { onValue, ref, getDatabase, Database } from 'firebase/database';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

const AdminQuestionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [revealingAnswer, setRevealingAnswer] = useState(false);
  const initialStatusSet = useRef(false);

  // Extract gameCode from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const gameCode = searchParams.get('gameCode') || localStorage.getItem('gameCode') || '';

  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  // Set initial game status ONLY ONCE when component mounts (if needed)
  useEffect(() => {
    const setInitialStatus = async () => {
      if (!gameCode || gameLoading || gameError || !game || initialStatusSet.current) {
        return;
      }

      initialStatusSet.current = true; 

      if (game.status !== 'question_display') {
        try {
          console.log('[AdminQuestionPage] Setting initial game status to question_display on mount');
          await setGameStatus(gameCode, 'question_display');
        } catch (err) {
          console.error('Error setting initial game status:', err);
          setError('Failed to set initial game status');
          initialStatusSet.current = false;
        }
      } else {
         console.log('[AdminQuestionPage] Initial status already question_display, no action needed.');
      }
    };
    setInitialStatus();
  }, [gameCode, gameLoading, gameError, game]);

  // Fetch the specific question details when game data is available/changes
  useEffect(() => {
    const fetchQuestion = async () => {
      if (gameLoading || !game || gameError || game.currentQuestionIndex === undefined) {
        setCurrentQuestion(null);
        return;
      }

      try {
        setError(null);
        const questionId = game.questionOrder[game.currentQuestionIndex];
        if (!questionId) {
          setError("Invalid question ID in game data.");
          return;
        }
        const question = await getQuestion(questionId);
        if (question) {
          setCurrentQuestion(question);
        } else {
          setError(`Question with ID ${questionId} not found`);
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Failed to load question details");
      }
    };

    fetchQuestion();
  }, [game, gameLoading, gameError]);

  // Handle revealing the answer
  const handleRevealAnswer = async () => {
    if (!gameCode || !game || revealingAnswer || gameError) {
      console.warn('[handleRevealAnswer] Prevented execution. Conditions:', {
        gameCode: !!gameCode,
        game: !!game,
        revealingAnswer,
        gameError: !!gameError
      });
      return;
    }
    
    try {
      setRevealingAnswer(true);
      setError(null);
      
      // 1. Reset resultsReady flag before processing
      console.log(`[AdminQuestionPage] Resetting resultsReady for game ${gameCode}`);
      await updateGameData(gameCode, { resultsReady: false }); 
      
      // 2. Process question results (calculate scores) - MUST complete first
      if (currentQuestion?.id) {
        console.log(`[AdminQuestionPage] Processing results for question: ${currentQuestion.id}`);
        await processQuestionResults(gameCode, currentQuestion.id); // Wait for this to finish
        console.log(`[AdminQuestionPage] Results processed for question: ${currentQuestion.id}`);
      } else {
        console.error('[AdminQuestionPage] Cannot process results: currentQuestion or its ID is missing.');
        setError('Cannot process results: Missing question data.');
        setRevealingAnswer(false);
        return; 
      }

      // 3. NOW set game status to answer_reveal (resultsReady is set to true inside processQuestionResults)
      console.log('[AdminQuestionPage] Setting game status to answer_reveal');
      await setGameStatus(gameCode, 'answer_reveal');
            
      // 4. Navigate to answer page (AdminAnswerRevealPage)
      console.log('[AdminQuestionPage] Navigating to admin answer reveal page.');
      navigate(`/admin/answer?gameCode=${gameCode}`);

    } catch (err) {
      console.error("[AdminQuestionPage] Error revealing answer:", err);
      setError("Failed to reveal answer or process results");
      setRevealingAnswer(false); 
    }
    // Don't set revealingAnswer back to false on success because we navigate away
  };
  
  if (gameLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-accent text-xl">Loading game state...</div>
      </div>
    );
  }
  
  const displayError = error || gameError?.message;

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Error</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 text-accent underline"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
      <AnimatedBackground density="high" />
      
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" onClick={() => navigate('/admin')} />
      </motion.div>
      
      <motion.div
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Game Code: {gameCode}
      </motion.div>
      
      <motion.div
        className="absolute bottom-4 left-4 text-xs text-accent/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Status: {game?.status || 'unknown'} | Question: {game?.currentQuestionIndex ?? 'unknown'}
      </motion.div>
      
      <div className="max-w-4xl mx-auto pt-24 z-30 relative">
        <motion.div
          className="bg-accent/10 backdrop-blur-sm p-8 rounded-lg border border-accent/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl text-accent font-bold">
              Question {(game?.currentQuestionIndex || 0) + 1}
            </h2>
          </motion.div>
          
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl text-accent font-bold font-serif">
              {currentQuestion?.text || 'Loading question...'}
            </h1>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {currentQuestion?.options.map((option, index) => (
              <div
                key={index}
                className="bg-accent/5 border border-accent/20 p-4 rounded-lg text-accent text-lg"
              >
                <span className="font-bold mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </div>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <MainButton
            onClick={handleRevealAnswer}
            disabled={revealingAnswer}
            className="w-full py-4 text-lg"
          >
            {revealingAnswer ? 'Revealing Answer...' : 'Reveal Answer'}
          </MainButton>
        </motion.div>
      </div>

      {localStorage.getItem('isAdmin') === 'true' && (
        <DevTools gameCode={gameCode} />
      )}
    </div>
  );
};

export default AdminQuestionPage; 