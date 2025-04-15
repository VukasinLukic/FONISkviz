import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { Game, GameStatus, updateGameData } from '../lib/firebase'; // Adjust path if necessary
import { Button } from '../components/ui/button';

// Update category names - now using four categories
const CATEGORY_NAMES = [
  "Ko zna Zna?", 
  "Istina ili Laž",
  "Ko živi ovde?",
  "Koji film/serija je u pitanju?",
  "Pogodite crtani",
  "Pogodite fonisovca"
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
    <div className="min-h-screen bg-primary text-accent relative overflow-hidden flex flex-col items-center justify-center">
      <AnimatedBackground />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center p-6 bg-secondary/10 backdrop-blur-md rounded-2xl shadow-xl max-w-2xl w-full mx-4"
      >
        <Logo className="medium mx-auto mb-6 w-32 h-32 md:w-40 md:h-40" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2 font-serif text-accent/90">
          Sledeća Kategorija:
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold mb-8 font-basteleur text-white">
           {gameLoading ? "Učitavanje..." : nextCategoryName}
        </h2>
        
        {displayError && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg mb-4 max-w-md mx-auto">
            <p>{displayError}</p>
          </div>
        )}

        <Button 
          onClick={handleContinueQuiz} // Directly call the handler
          className="bg-accent hover:bg-accent/90 text-primary font-bold py-3 px-10 text-xl rounded-full transition-all duration-300 shadow-lg transform hover:scale-105"
          disabled={isContinuing || gameLoading || !gameData} 
        >
          {isContinuing ? 'Nastavljam...' : 'Nastavi Kviz'}
        </Button>
      </motion.div>
    </div>
  );
};

export default BreakPage; 