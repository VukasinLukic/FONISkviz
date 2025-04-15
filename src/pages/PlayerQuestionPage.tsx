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
import { Timer } from '../components/Timer';
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/button";
import ImagePopup from '../components/ui/ImagePopup';

// Define colors for answer options based on Tailwind config
const answerColors = [
  { bg: 'bg-highlight/80', hover: 'hover:bg-highlight/90', border: 'border-highlight' }, // A - highlight (yellowish)
  { bg: 'bg-secondary/80', hover: 'hover:bg-secondary/90', border: 'border-secondary' }, // B - secondary (orange)
  { bg: 'bg-accent/80', hover: 'hover:bg-accent/90', border: 'border-accent' }, // C - accent (light beige)
  { bg: 'bg-special/80', hover: 'hover:bg-special/90', border: 'border-special' } // D - special (purple) instead of primary
];

// Define colors for true/false answers
const trueFalseColors = [
  { bg: 'bg-highlight/80', hover: 'hover:bg-highlight/90', border: 'border-highlight' }, // True/Tačno - green
  { bg: 'bg-special/80', hover: 'hover:bg-special/90', border: 'border-special' }, // False/Netačno - red
];

const PlayerQuestionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null); // Still needed for question ID
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false); // Added state for time up
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

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
          setIsTimeUp(false); // Reset time up state for new question
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
  
  // Handle timer completion
  const handleTimeUp = () => {
    console.log("PlayerQuestionPage: Time's up!");
    setIsTimeUp(true);
  };

  // Handle typed answer submission
  const handleSubmitTypedAnswer = async () => {
    console.log('[handleSubmitTypedAnswer] Triggered. Current typedAnswer:', typedAnswer);
    console.log('[handleSubmitTypedAnswer] Checking conditions:', { 
        gameCodeExists: !!gameCode, 
        teamIdExists: !!teamId, 
        currentQuestionExists: !!currentQuestion, 
        submitting, 
        answerSubmitted 
    });
    if (!gameCode || !teamId || !currentQuestion || submitting || answerSubmitted) { 
      console.warn('[handleSubmitTypedAnswer] Submission prevented by condition check.');
      return;
    }

    const normalizedAnswer = typedAnswer.trim().toLowerCase();
    console.log('[handleSubmitTypedAnswer] Normalized answer to submit:', normalizedAnswer); // Log normalized value
    if (!normalizedAnswer) {
      setError("Molimo unesite odgovor.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      console.log('PlayerQuestionPage: Submitting typed answer:', normalizedAnswer);

      // Submit typed answer to Firebase
      // We use selectedAnswer to store the text, answerIndex is irrelevant (-1)
      await submitAnswer(gameCode, currentQuestion.id, teamId, {
        selectedAnswer: normalizedAnswer,
        answerIndex: -1 
      });
      
      setAnswerSubmitted(true); // Mark as submitted
      console.log('PlayerQuestionPage: Typed answer submitted successfully, navigating to waiting-answer');
      navigate('/player/waiting-answer');
    } catch (err) {
      console.error("Error submitting typed answer:", err);
      setError("Greška pri slanju odgovora");
      setSubmitting(false);
      setAnswerSubmitted(false);
    } finally {
        // setSubmitting(false); // Keep submitting true to prevent resubmission
    }
  };

  // Reset typed answer and submission state when question changes
  useEffect(() => {
    if (currentQuestion) {
      console.log('[useEffect - currentQuestion change] Resetting typedAnswer and submission state for question:', currentQuestion.id);
      setTypedAnswer("");
      setAnswerSubmitted(false);
      setSubmitting(false); // Also reset submitting flag
    }
  }, [currentQuestion]);

  // Helper function to render the correct answer input/buttons
  const renderAnswerArea = () => {
    if (!currentQuestion) {
        return <div className="flex-grow flex items-center justify-center"><p className="text-accent/70 italic">Učitavanje pitanja...</p></div>;
    }

    const isTextCategory = currentQuestion.category === "Pogodite crtani" || currentQuestion.category === "Pogodite fonisovca";

    if (isTextCategory) {
      // Render Input field for text categories
      return (
        <motion.div 
            className="flex-grow flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto w-full z-10"
            key={`input-${currentQuestion.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Input 
              type="text"
              placeholder={`Unesite ime ${currentQuestion.category === "Pogodite crtani" ? 'crtanog filma' : 'fonisovca'}`}
              value={typedAnswer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  console.log('[Input onChange] New value:', e.target.value);
                  setTypedAnswer(e.target.value);
              }}
              disabled={submitting || answerSubmitted || isTimeUp}
              className="bg-accent/10 border-accent/30 text-white text-center text-xl placeholder:text-accent/50 rounded-lg p-6 w-full h-16 disabled:opacity-70 shadow-md focus:ring-2 focus:ring-accent/60 focus:border-accent/60"
            />
            <Button
              onClick={() => { 
                  console.log('[Button onClick] Clicked! Calling handleSubmitTypedAnswer...'); 
                  handleSubmitTypedAnswer(); 
              }}
              disabled={submitting || answerSubmitted || isTimeUp || !typedAnswer.trim()}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold py-4 px-10 text-xl rounded-full transition-all duration-300 shadow-lg w-full disabled:opacity-50 h-16"
            >
              {submitting || answerSubmitted ? 'Odgovor poslat' : 'Pošalji odgovor'}
            </Button>
            {isTimeUp && !answerSubmitted && (
                <p className='text-red-500 mt-2'>Vreme je isteklo!</p>
            )}
          </motion.div>
      );
    } else if (currentQuestion.options) {
      // Render Buttons for categories with options
      if (currentQuestion.options.length === 2) {
          // True/False format
          return (
               <div className="flex-grow flex flex-col gap-4 p-6 max-w-3xl mx-auto w-full" key={`tf-${currentQuestion.id}`}>
                {currentQuestion.options.map((option, index) => {
                    const color = trueFalseColors[index % trueFalseColors.length];
                    const isSelected = selectedAnswer === index;
                    const isDisabled = submitting || selectedAnswer !== null || isTimeUp;
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleSubmitAnswer(index)}
                        disabled={isDisabled}
                        className={`flex items-center justify-center h-1/2 rounded-lg text-white font-bold text-4xl md:text-5xl
                                  border-4 ${color.border} ${color.bg}
                                  transition-all duration-300 ease-in-out
                                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : `${color.hover} hover:border-white/50`}
                                  ${isSelected ? 'ring-4 ring-white ring-offset-4 ring-offset-primary' : ''}`
                        }
                        whileTap={isDisabled ? {} : { scale: 0.95 }}
                        initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.15 }}
                      >
                        {option} 
                      </motion.button>
                    );
                })}
              </div>
          );
      } else {
          // Regular 4-option format
          return (
              <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-2 p-2" key={`abcd-${currentQuestion.id}`}>
                {currentQuestion.options.map((_, index) => {
                    const color = answerColors[index % answerColors.length];
                    const isSelected = selectedAnswer === index;
                    const isDisabled = submitting || selectedAnswer !== null || isTimeUp; 
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
          );
      }
    } else {
       // Fallback if options are missing unexpectedly for a non-text category
       return (
           <div className="flex-grow flex items-center justify-center">
                <p className="text-accent/70 italic">Greška: Nedostaju opcije za ovo pitanje.</p>
            </div>
       );
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
      
      
      {/* Timer Component at the top */}
      <motion.div 
        className="w-full flex justify-center mx-auto mt-16 mb-4 z-10 px-4 max-w-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Timer 
           duration={30} 
           color="secondary" 
           size="md" 
           onComplete={handleTimeUp} // Added onComplete handler
         />
      </motion.div>
      
      {/* Display question text */}
      <motion.div
        className="text-center text-white text-2xl md:text-3xl font-medium px-6 mb-4 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {currentQuestion?.text}
      </motion.div>
      
      {/* Display image for categories that use it */}
      {(currentQuestion?.category === "Ko živi ovde?" || currentQuestion?.category === "Koji film/serija je u pitanju?" || currentQuestion?.category === "Pogodite crtani" || currentQuestion?.category === "Pogodite fonisovca") && currentQuestion?.imageUrl && (
        <motion.div 
          className="flex justify-center z-10 mb-4 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img 
            src={currentQuestion.imageUrl} 
            alt="Question image" 
            className="w-auto max-h-[180px] rounded-xl shadow-lg border-4 border-accent/30 object-contain mx-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsImagePopupOpen(true)}
            onError={(e) => {
              console.error("Failed to load question image:", currentQuestion.imageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>
      )}
      
      {/* --- Debugging Category --- */}
      {/* {currentQuestion && ( ... Debug div removed ... )} */}
      {/* --- End Debugging --- */}

      {/* Render answer area based on question type */}
      {renderAnswerArea()}
      
      {/* Time Up Message */} 
      {isTimeUp && selectedAnswer === null && (
        <motion.div
           className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-secondary/80 border border-secondary text-white px-6 py-3 rounded-lg text-center z-20 shadow-lg"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
           Vreme je isteklo!
        </motion.div>
      )}

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
      
      {/* Image Popup */}
      {currentQuestion?.imageUrl && (
        <ImagePopup
          imageUrl={currentQuestion.imageUrl}
          isOpen={isImagePopupOpen}
          onClose={() => setIsImagePopupOpen(false)}
          alt={`Question image for: ${currentQuestion.text}`}
        />
      )}
    </div>
  );
};

export default PlayerQuestionPage; 