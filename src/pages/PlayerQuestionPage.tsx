import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getQuestion, 
  submitAnswer,
  Question,
  Game
} from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

const PlayerQuestionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
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
      setError("Missing game code or team ID. Redirecting...");
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
          navigate('/player/waiting-answer');
          break;
        case 'answer_reveal':
          navigate('/player/answer-result');
          break;
        case 'leaderboard':
          navigate('/player/score');
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
  }, [game, gameLoading, gameError, gameCode, teamId, navigate]);

  // Fetch the specific question details when game data is available/changes
  useEffect(() => {
    const fetchQuestion = async () => {
      if (gameLoading || !game || gameError || game.currentQuestionIndex === undefined) {
        setCurrentQuestion(null);
        return;
      }

      try {
        setError(null); // Clear local errors
        const questionId = game.questionOrder[game.currentQuestionIndex];
        if (!questionId) {
          setError("Invalid question ID.");
          return;
        }
        console.log('PlayerQuestionPage: Fetching question with ID:', questionId);
        const question = await getQuestion(questionId);
        if (question) {
          setCurrentQuestion(question);
          setSelectedAnswer(null); // Reset selected answer for new question
          setSubmitting(false); // Reset submitting state
        } else {
          setError(`Question ${questionId} not found`);
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Failed to load question details");
      }
    };

    if (game?.status === 'question_display') {
       fetchQuestion();
    }
  }, [game, gameLoading, gameError]); // Depend on game data

  // Handle answer submission
  const handleSubmitAnswer = async (answerIndex: number) => {
    if (!gameCode || !teamId || !currentQuestion || submitting) return;
    
    try {
      setSubmitting(true);
      setSelectedAnswer(answerIndex);
      console.log('PlayerQuestionPage: Submitting answer:', answerIndex);
      
      // Submit answer to Firebase
      await submitAnswer(gameCode, currentQuestion.id, teamId, {
        selectedAnswer: currentQuestion.options[answerIndex],
        answerIndex
      });
      
      console.log('PlayerQuestionPage: Answer submitted successfully, navigating to waiting-answer');
      // Navigate to waiting page
      navigate('/player/waiting-answer');
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to submit answer");
      setSubmitting(false);
    }
  };
  
  if (gameLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-accent text-xl">Loading question...</div>
      </div>
    );
  }
  
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
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
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
        Status: {game?.status || 'unknown'} | Question: {game?.currentQuestionIndex ?? 'unknown'}
      </div>
      
      {/* Question Display */}
      <div className="max-w-4xl mx-auto pt-24 z-30 relative">
        <motion.div
          className="bg-accent/10 backdrop-blur-sm p-8 rounded-lg border border-accent/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Question Number */}
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
          
          {/* Question Text */}
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
          
          {/* Answer Buttons */}
          <motion.div
            className="grid grid-cols-1 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {currentQuestion?.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleSubmitAnswer(index)}
                disabled={submitting || selectedAnswer !== null}
                className={`w-full p-6 rounded-lg text-lg font-bold transition-all
                  ${selectedAnswer === index 
                    ? 'bg-highlight text-white' 
                    : 'bg-accent/5 hover:bg-accent/10 text-accent'}
                  ${submitting || selectedAnswer !== null ? 'opacity-50 cursor-not-allowed' : ''}
                  border border-accent/20`}
                whileHover={submitting || selectedAnswer !== null ? {} : { scale: 1.02 }}
                whileTap={submitting || selectedAnswer !== null ? {} : { scale: 0.98 }}
              >
                <span className="font-bold mr-4">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerQuestionPage; 