import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { Game, GameStatus, updateGameData } from '../lib/firebase'; // Adjust path if necessary
import { Button } from '../components/ui/button';

// Update category names - now using all categories
const CATEGORY_NAMES = [
  "Ko zna Zna?", 
  "Istina ili Laž",
  "Ko živi ovde?",
  "Koji film/serija je u pitanju?",
  "Pogodite crtani",
  "Pogodite fonisovca",
  "Pogodi Pesmu na osnovu Emoji-a",
  "FON FON FONIS"
];
const QUESTIONS_PER_CATEGORY = 8;

const BreakPage: React.FC = () => {
  console.log('[BreakPage] Component Mounting...'); // Log mount
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameCode = searchParams.get('gameCode') || '';
  console.log(`[BreakPage] Game code from URL: ${gameCode}`); // Log gameCode

  const { gameData, loading: gameLoading, error: gameError } = useGameRealtimeState(gameCode);
  const [error, setError] = useState<string | null>(null); // Local error state
  const [isContinuing, setIsContinuing] = useState(false); // State for button loading
  const [nextCategoryName, setNextCategoryName] = useState<string>("Sledeća runda");

  // Effect to determine the next category name
  useEffect(() => {
    console.log(`[BreakPage] Category useEffect triggered. gameData exists: ${!!gameData}`);
    if (gameData && typeof gameData.currentQuestionIndex === 'number') {
      const nextQuestionIndex = gameData.currentQuestionIndex + 1;
      // Calculate category index based on the question index (8 questions per category)
      const categoryIndex = Math.floor(nextQuestionIndex / QUESTIONS_PER_CATEGORY);
      const calculatedName = CATEGORY_NAMES[categoryIndex] || "Završna runda";
      console.log(`[BreakPage] Calculated next category index: ${categoryIndex}, name: ${calculatedName}`);
      setNextCategoryName(calculatedName);
    } else {
      console.log('[BreakPage] Category useEffect: gameData or index missing.');
    }
  }, [gameData]);

  // Renamed function to handle continuing the quiz (called by button)
  const handleContinueQuiz = async () => {
    console.log('[BreakPage] handleContinueQuiz called'); 
    if (!gameCode || !gameData || !gameData.questionOrder || gameLoading || isContinuing) {
      setError("Podaci igre nedostaju, učitavaju se ili se već nastavlja.");
      console.error('[BreakPage] handleContinueQuiz prevented:', { gameCode, gameDataExists: !!gameData, orderExists: !!gameData?.questionOrder, gameLoading, isContinuing });
      return;
    }

    setIsContinuing(true);
    setError(null);

    const currentQuestionIndex = gameData.currentQuestionIndex;
    const nextQuestionActualIndex = currentQuestionIndex + 1;
    const totalQuestions = gameData.questionOrder.length;

    let nextStatus: GameStatus;
    let nextRoute: string;
    const updates: Partial<Game> = {};

    if (nextQuestionActualIndex >= totalQuestions) { 
      nextStatus = 'game_end';
      nextRoute = `/admin/winners?gameCode=${gameCode}`;
      updates.status = nextStatus;
      console.log(`[BreakPage] handleContinueQuiz: End of questions. Transitioning to ${nextStatus}.`);
    } else {
      nextStatus = 'question_display';
      nextRoute = `/admin/question?gameCode=${gameCode}`;
      updates.status = nextStatus;
      updates.currentQuestionIndex = nextQuestionActualIndex;
      updates.resultsReady = false; 
      console.log(`[BreakPage] handleContinueQuiz: Advancing to question index: ${updates.currentQuestionIndex}.`);
    }

    try {
      console.log('[BreakPage] handleContinueQuiz: Updating game data...', updates);
      await updateGameData(gameCode, updates);
      console.log(`[BreakPage] handleContinueQuiz: Game state updated. Navigating to ${nextRoute}`);
      navigate(nextRoute);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Greška pri ažuriranju stanja igre: ${errorMessage}`);
      console.error("Error updating game state from BreakPage:", err);
      setIsContinuing(false); 
    } 
    // Navigation happens on success, component will unmount
  };
  
  const displayError = error || gameError?.message;

  console.log(`[BreakPage] Rendering component. nextCategoryName: ${nextCategoryName}, isContinuing: ${isContinuing}, gameLoading: ${gameLoading}, displayError: ${displayError}`);

  return (
    <div className="min-h-screen bg-primary text-white relative overflow-hidden flex flex-col items-center justify-between p-6">
      <AnimatedBackground />
      
      {/* Logo (top-left) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-6 left-6 z-20"
      >
        <Logo className="w-48 h-48 md:w-64 md:h-64 mb-15" />
      </motion.div>
      
      {/* Speech bubble and Mascot in center */}
      <div className="flex flex-col items-center justify-center flex-grow z-30">
        {/* Speech bubble */}
        <motion.div 
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-accent rounded-3xl px-10 py-8 shadow-xl border-4 border-accent">
            <div className="text-center">
              <div className="font-bold text-secondary text-3xl tracking-tight font-serif">
                Kvizaši Fonisa spremite se .... sledeća kategorija<br/>kviza je:
              </div>
              <div className="font-bold text-6xl text-special mt-4">
                {gameLoading ? "..." : nextCategoryName}
              </div>
            </div>
          </div>
          {/* Speech bubble pointers - multiple small circles */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-full border-4 border-[#5A1B09]"></div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 ml-4 w-4 h-4 bg-white rounded-full border-2 border-[#5A1B09]"></div>
          <div className="mr-5 absolute -bottom-14 left-1/2 transform -translate-x-1/2 ml-8 w-3 h-3 bg-white rounded-full border-2 border-[#5A1B09]"></div>
        </motion.div>
        
        {/* Mascot */}
        <motion.div
          animate={{ 
            y: [0, -15, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="relative"
        >
          <img 
            src="/assets/maskota original 1.svg" 
            alt="Mascot" 
             className="w-64 h-64 md:w-80 md:h-80 ml-10"
          />
          {/* Eyes that blink */}
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ 
              duration: 0.2,
              times: [0, 0.1, 0.2],
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-full flex justify-center gap-6 pointer-events-none"
          >
            
            
          </motion.div>
        </motion.div>
      </div>
      
      {/* Button at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="z-20 mb-6 mt-8"
      >
        <Button 
          onClick={handleContinueQuiz}
          className="bg-accent hover:bg-accent/90 text-primary font-bold py-6 px-16 text-2xl rounded-full transition-all duration-300 shadow-xl hover:shadow-accent/20 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          disabled={isContinuing || gameLoading || !gameData}
        >
          {isContinuing ? (
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 bg-primary rounded-full animate-bounce"></span>
              <span className="h-3 w-3 bg-primary rounded-full animate-bounce delay-150"></span>
              <span className="h-3 w-3 bg-primary rounded-full animate-bounce delay-300"></span>
              <span className="ml-2">Nastavljam</span>
            </div>
          ) : (
            'Nastavi Kviz'
          )}
        </Button>
      </motion.div>
      
      {/* Error message if needed */}
      {displayError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl max-w-md mx-auto absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30"
        >
          <p>{displayError}</p>
        </motion.div>
      )}
    </div>
  );
};

export default BreakPage;