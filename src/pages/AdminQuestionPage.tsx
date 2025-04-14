import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { Button } from '../components/ui/button';
import DevTools from '../components/DevTools';
import { onValue, ref, getDatabase, Database } from 'firebase/database';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Timer } from '../components/Timer';

// Define colors for answer options based on Tailwind config
const answerColors = [
  'bg-highlight/80 border-highlight', // A - highlight (yellowish)
  'bg-secondary/80 border-secondary',  // B - secondary (orange)
  'bg-accent/80 border-accent',       // C - accent (light beige)
  'bg-special/80 border-special'      // D - special (purple) instead of primary
];

const AdminQuestionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [processing, setProcessing] = useState(false);
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

  // Handle revealing the answer (now processing) - Wrapped in useCallback
  const handleProcessAndReveal = useCallback(async () => {
    if (!gameCode || !game || processing || gameError || !currentQuestion?.id) {
      console.warn('[handleProcessAndReveal] Prevented execution. Conditions:', {
        gameCode: !!gameCode,
        game: !!game,
        processing,
        gameError: !!gameError,
        currentQuestionId: currentQuestion?.id
      });
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // 1. Reset resultsReady flag before processing
      console.log(`[AdminQuestionPage] Resetting resultsReady for game ${gameCode}`);
      await updateGameData(gameCode, { resultsReady: false }); 
      
      // 2. Process question results (calculate scores) - MUST complete first
      console.log(`[AdminQuestionPage] Processing results for question: ${currentQuestion.id}`);
      await processQuestionResults(gameCode, currentQuestion.id); // Wait for this to finish
      console.log(`[AdminQuestionPage] Results processed for question: ${currentQuestion.id}`);

      // 3. NOW set game status to answer_reveal (resultsReady is set to true inside processQuestionResults)
      console.log('[AdminQuestionPage] Setting game status to answer_reveal');
      await setGameStatus(gameCode, 'answer_reveal');
            
      // 4. Navigate to answer page (AdminAnswerRevealPage)
      console.log('[AdminQuestionPage] Navigating to admin answer reveal page.');
      navigate(`/admin/answer?gameCode=${gameCode}`);

    } catch (err) {
      console.error("[AdminQuestionPage] Error processing and revealing answer:", err);
      setError("Failed to reveal answer or process results");
       // Reset processing state only on error, navigation handles success case normally
       setProcessing(false); 
    } 
    // Removed finally block to avoid setting processing false on successful navigation
  }, [gameCode, game, processing, gameError, currentQuestion, navigate, setError, setProcessing]); // Dependencies for useCallback

  // Added useEffect to automatically process when all players have answered
  useEffect(() => {
    if (game?.status === 'answer_collection' && !processing && gameCode) {
      console.log('[AdminQuestionPage] All players answered (status: answer_collection). Automatically processing and revealing.');
      handleProcessAndReveal();
    }
  }, [game?.status, processing, gameCode, handleProcessAndReveal]);

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-accent text-xl">Učitavanje stanja igre...</div>
      </div>
    );
  }
  
  const displayError = error || gameError?.message;

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Greška</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 text-accent underline"
        >
          Nazad na početnu
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen h-screen bg-primary p-6 md:p-8 relative overflow-hidden flex flex-col">
      <AnimatedBackground density="high" />
      
      {/* Top Bar: Logo Left, Button Right */}
       <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 md:px-8 z-40">
         {/* Enlarged Logo */}
         <motion.div 
           initial={{ opacity: 0, x: -40 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
         >
           <Logo size="large" className="w-28 h-28 md:w-48 md:h-48" onClick={() => navigate('/admin')} />
         </motion.div>

         {/* Process Button - Now just a right arrow icon */}
         <motion.div
           initial={{ opacity: 0, x: 40 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
           className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center"
         >
           <Button
             onClick={handleProcessAndReveal}
             disabled={processing}
             className={`whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-full w-20 h-20 md:w-28 md:h-28 flex items-center justify-center ${processing ? 'bg-secondary/50' : 'bg-secondary hover:bg-secondary/90'}`}
           >
             {processing ? (
               <motion.div 
                 className="w-10 h-10 border-4 border-white rounded-full border-t-transparent"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               />
             ) : (
               <svg 
                 xmlns="http://www.w3.org/2000/svg" 
                 className="h-12 w-12 md:h-16 md:w-16 text-white" 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor"
               >
                 <path 
                   strokeLinecap="round" 
                   strokeLinejoin="round" 
                   strokeWidth={2} 
                   d="M14 5l7 7m0 0l-7 7m7-7H3" 
                 />
               </svg>
             )}
           </Button>
         </motion.div>
       </div>
      
      {/* Question Area - Centered and Enlarged */}
      <div className="flex-grow flex items-center justify-center pt-32 md:pt-40 pb-16 md:pb-20">
        <motion.div
          className="w-full max-w-5xl mx-auto bg-accent/10 backdrop-blur-lg p-8 md:p-12 rounded-xl border border-accent/20 shadow-2xl z-30"
          key={currentQuestion?.id || 'loading'}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div 
            className="text-center mb-4 md:mb-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl md:text-3xl text-accent font-bold font-serif">
              Pitanje {(game?.currentQuestionIndex ?? 0) + 1}
            </h2>
          </motion.div>
          
          <motion.div
            className="text-center mb-8 md:mb-12"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-5xl text-white font-bold font-serif leading-tight">
              {currentQuestion?.text || 'Učitavanje pitanja...'}
            </h1>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            {currentQuestion?.options.map((option, index) => (
              <div
                key={index}
                className={`border-2 text-white p-5 md:p-6 rounded-lg text-lg md:text-xl shadow-md flex items-center ${answerColors[index % answerColors.length]}`}
              >
                <span className="font-bold mr-3 text-2xl opacity-80">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="flex-1">{option}</span>
              </div>
            ))}
          </motion.div>
          
          {/* Timer Area: Numerical Timer + Progress Bar */}
          <motion.div 
            className="mt-10 w-full flex flex-col items-center" // Use flex-col to stack timer and bar
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
             {/* Numerical Timer */}
             <Timer duration={30} color="secondary" size="lg" /> 
             
             {/* Large Progress Bar */}
             <div className="mt-4 w-full max-w-2xl bg-white/20 rounded-full h-5 overflow-hidden"> 
               <motion.div
                 className="h-full bg-secondary rounded-full"
                 initial={{ width: "100%" }}
                 animate={{ width: "0%" }}
                 transition={{ 
                   duration: 30, // Match timer duration
                   ease: "linear"
                 }}
               />
             </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Bottom Left: Game Code & Status */}
      <motion.div
        className="absolute bottom-4 left-4 md:bottom-6 md:left-6 text-xs md:text-sm text-accent/70 z-40 bg-primary/50 p-2 rounded shadow"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div>Kod: {gameCode}</div>
        <div>Status: {game?.status || 'nepoznat'}</div>
      </motion.div>
      
      {/* DevTools remain */}
      {localStorage.getItem('isAdmin') === 'true' && (
        <DevTools gameCode={gameCode} />
      )}
    </div>
  );
};

export default AdminQuestionPage; 