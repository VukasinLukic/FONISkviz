import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  getQuestion, 
  submitAnswer,
  Question,
  Game
} from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

// Define colors for answer options based on Tailwind config
const answerColors = [
  { bg: 'bg-highlight/80', hover: 'hover:bg-highlight/90', border: 'border-highlight' }, // A - highlight (yellowish)
  { bg: 'bg-secondary/80', hover: 'hover:bg-secondary/90', border: 'border-secondary' }, // B - secondary (orange)
  { bg: 'bg-accent/80', hover: 'hover:bg-accent/90', border: 'border-accent' }, // C - accent (light beige)
  { bg: 'bg-special/80', hover: 'hover:bg-special/90', border: 'border-special' } // D - special (purple) instead of primary
];

const PlayerQuestionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null); // Still needed for question ID
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');

  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  // Listen to game status changes and navigate accordingly
  useEffect(() => {
    if (!gameCode || !teamId) {
      setError("Nema koda igre ili ID tima. Preusmeravanje...");
      setTimeout(() => navigate('/player'), 1500); // Redirect to join page
      return;
    }
    if (gameLoading || !game || gameError) {
      return; // Wait for game data
    }

    console.log('PlayerQuestionPage: Game status updated to:', game.status);

    // Handle navigation based on game status
    if (game.status !== 'question_display') {
      console.log('PlayerQuestionPage: Game status is not question_display, navigating accordingly');
      switch (game.status) {
        case 'waiting':
          navigate('/player/waiting');
          break;
        case 'answer_collection':
          // Only navigate if an answer has been submitted
          if (selectedAnswer !== null) {
             navigate('/player/waiting-answer');
          }
          break;
        case 'answer_reveal':
          navigate('/player/answer-result');
          break;
        case 'leaderboard':
          // Assuming we don't have a specific player leaderboard page for MVP
          // Maybe navigate to waiting if needed, or just let it stay (depends on desired flow)
          // navigate('/player/waiting'); // Example
          break;
        case 'game_end':
        case 'finished':
          navigate('/player/finished');
          break;
        default:
          // Stay on current page if status is unknown or question_display
          break;
      }
    }
  }, [game, gameLoading, gameError, gameCode, teamId, navigate, selectedAnswer]);

  // Fetch the question ID when game data is available/changes
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (gameLoading || !game || gameError || game.currentQuestionIndex === undefined) {
        setCurrentQuestion(null);
        return;
      }

      try {
        setError(null); // Clear local errors
        const questionId = game.questionOrder[game.currentQuestionIndex];
        if (!questionId) {
          setError("Nevažeći ID pitanja.");
          return;
        }
        console.log('PlayerQuestionPage: Fetching question data for ID:', questionId);
        // Fetch the minimal question data needed (just the ID for submitting)
        const question = await getQuestion(questionId);
        if (question) {
          setCurrentQuestion(question); // We need the full question for options/ID
          setSelectedAnswer(null); // Reset selected answer for new question
          setSubmitting(false); // Reset submitting state
        } else {
          setError(`Pitanje ${questionId} nije pronađeno`);
        }
      } catch (err) {
        console.error("Error fetching question data:", err);
        setError("Greška pri učitavanju podataka pitanja");
      }
    };

    if (game?.status === 'question_display') {
       fetchQuestionData();
    }
  }, [game, gameLoading, gameError]); // Depend on game data

  // Handle answer submission
  const handleSubmitAnswer = async (answerIndex: number) => {
    if (!gameCode || !teamId || !currentQuestion || submitting || selectedAnswer !== null) return;
    
    try {
      setSubmitting(true);
      setSelectedAnswer(answerIndex);
      console.log('PlayerQuestionPage: Submitting answer:', answerIndex);
      
      // Submit answer to Firebase
      await submitAnswer(gameCode, currentQuestion.id, teamId, {
        selectedAnswer: currentQuestion.options[answerIndex], // Still submit the text
        answerIndex
      });
      
      console.log('PlayerQuestionPage: Answer submitted successfully, navigating to waiting-answer');
      // Navigate to waiting page AFTER submission is confirmed
      navigate('/player/waiting-answer');
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Greška pri slanju odgovora");
      setSubmitting(false);
      setSelectedAnswer(null); // Allow retry on error
    }
  };
  
  if (gameLoading || !currentQuestion) { // Show loading until question is loaded
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-accent text-xl">Učitavanje pitanja...</div>
      </div>
    );
  }
  
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
          Nazad na Prijavu
        </button>
      </div>
    );
  }
  
  return (
    // Full screen container for the 4 buttons
    <div className="min-h-screen h-screen bg-primary flex flex-col relative overflow-hidden">
      {/* Small logo at top */}
      
      
      {/* Timer Progress Bar */}
      <motion.div 
        className="w-full bg-white/20 rounded-full h-2 overflow-hidden mx-auto mt-16 z-10 px-4 max-w-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-secondary rounded-full"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ 
            duration: 30, 
            ease: "linear"
          }}
        />
      </motion.div>
      
      {/* 4 Big Buttons Grid - taking most of screen */}
      <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-2 p-2 mt-4">
        {currentQuestion?.options.map((_, index) => {
          const color = answerColors[index % answerColors.length];
          const isSelected = selectedAnswer === index;
          const isDisabled = submitting || selectedAnswer !== null;

          return (
            <motion.button
              key={index}
              onClick={() => handleSubmitAnswer(index)}
              disabled={isDisabled}
              className={`flex items-center justify-center w-full h-full rounded-lg text-white font-bold text-6xl md:text-8xl 
                         border-4 ${color.border} ${color.bg} 
                         transition-all duration-300 ease-in-out 
                         ${isDisabled ? 'opacity-50 cursor-not-allowed' : `${color.hover} hover:border-white/50`} 
                         ${isSelected ? 'ring-4 ring-white ring-offset-4 ring-offset-primary' : ''}`
              }
              whileTap={isDisabled ? {} : { scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {String.fromCharCode(65 + index)} 
            </motion.button>
          );
        })}
      </div>

      {/* Error display at bottom */} 
      {error && (
           <motion.div 
             className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-md text-center z-20"
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }}
           >
             {error}
           </motion.div>
      )}
    </div>
  );
};

export default PlayerQuestionPage; 