import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Answer, Question, getTeamAnswerResult } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

interface DisplayResult {
  isCorrect: boolean;
  pointsAwarded: number;
  selectedAnswer: string;
  correctAnswer: string;
  answerIndex: number;
}

const PlayerAnswerResultPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [displayResult, setDisplayResult] = useState<DisplayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameCode] = useState(localStorage.getItem('gameCode'));
  
  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  
  // Use the real-time hook for game data
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  useEffect(() => {
    if (!gameCode || !teamId) {
      setError("Missing game code or team ID. Redirecting...");
      setTimeout(() => navigate('/player'), 1500);
      return;
    }

    if (gameLoading || gameError || !game) {
      setLoading(true);
      return;
    }

    console.log('PlayerAnswerResultPage: Game status:', game.status, 'Results Ready:', game.resultsReady);

    // Fetch and process result only when status is 'answer_reveal' AND resultsReady is true
    if (game.status === 'answer_reveal' && game.resultsReady === true) {
      const fetchResult = async () => {
        setLoading(true);
        try {
          const currentQuestionIndex = game.currentQuestionIndex;
          if (currentQuestionIndex < 0 || currentQuestionIndex >= game.questionOrder.length) {
            throw new Error("Invalid current question index.");
          }
          const currentQuestionId = game.questionOrder[currentQuestionIndex];
          const questionData = game.questions.find(q => q.id === currentQuestionId);

          if (!questionData) {
            throw new Error("Current question data not found in game state.");
          }

          console.log(`PlayerAnswerResultPage: Fetching answer result for team ${teamId}, question ${currentQuestionId}`);
          const answerResult = await getTeamAnswerResult(gameCode, currentQuestionId, teamId);

          if (answerResult) {
            console.log('PlayerAnswerResultPage: Received answer result:', answerResult);
            setDisplayResult({
              isCorrect: answerResult.isCorrect,
              pointsAwarded: answerResult.pointsAwarded,
              selectedAnswer: answerResult.selectedAnswer,
              correctAnswer: questionData.correctAnswer,
              answerIndex: currentQuestionIndex
            });
            setError(null); // Clear previous errors
          } else {
            // This case should technically not be hit anymore as getTeamAnswerResult always returns an object
            console.error('PlayerAnswerResultPage: getTeamAnswerResult returned unexpected nullish value.');
            setError("Greška pri dobijanju rezultata odgovora.");
          }
        } catch (err: any) {
          console.error("Error fetching or processing answer result:", err);
          setError(`Error displaying result: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      fetchResult();
    } else if (game.status === 'answer_reveal' && game.resultsReady !== true) {
      // Status is reveal, but results aren't ready yet - show loading/waiting message
      console.log('PlayerAnswerResultPage: Status is answer_reveal, but resultsReady is not true. Waiting...');
      setLoading(true); // Keep showing loading indicator
      setDisplayResult(null); // Ensure no stale result is shown
      setError("Waiting for results to be processed..."); // Inform user
    } else if (game.status === 'question_display') {
      console.log('PlayerAnswerResultPage: Navigating to question page');
      navigate('/player/question');
    } else if (game.status === 'game_end' || game.status === 'finished') {
      console.log('PlayerAnswerResultPage: Navigating to finished page');
      navigate('/player/finished');
    } else {
       console.log(`PlayerAnswerResultPage: Status (${game.status}) not handled for navigation, staying or waiting.`);
       // Keep loading false if we aren't actively fetching results
       if (game.status !== 'answer_reveal') setLoading(false);
    }

  }, [game, gameLoading, gameError, gameCode, teamId, navigate]);
  
  // Combine local and hook errors
  const displayError = error || gameError?.message;

  // Keep the loading state until the result is fetched or an error occurs
  const isPageLoading = loading || gameLoading;

  if (displayError && !isPageLoading) { // Only show error if not loading
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
      
      {/* Centered logo at top */}
      <div className="w-full flex justify-center pt-2 sm:pt-10 pb-2 z-40">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="responsive-logo"
        >
          <Logo size="large" className="w-32 h-32 sm:w-44 sm:h-44" />
        </motion.div>
      </div>
      
      {/* Team Name Display */}
      <motion.div
        className="text-accent text-xl sm:text-2xl font-bold font-basteleur mb-2 sm:mb-4 z-40 bg-accent/10 px-4 sm:px-6 py-1 sm:py-2 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Tim: {teamName}
      </motion.div>

      {/* Result Display */}
      <div className="flex flex-col items-center justify-center flex-grow max-w-xl w-full px-2 sm:px-0">
        {isPageLoading ? (
          <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-accent rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ) : displayResult && (
          <motion.div
            className="text-center z-30 bg-secondary/30 p-4 sm:p-8 rounded-2xl backdrop-blur-sm w-full shadow-lg border border-accent/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center
                ${displayResult.isCorrect ? 'bg-highlight/80' : 'bg-red-500/80'} shadow-lg`}
            >
              {displayResult.isCorrect ? (
                <span className="text-4xl sm:text-7xl text-white">✓</span>
              ) : (
                <span className="text-4xl sm:text-7xl text-white">X</span>
              )}
            </motion.div>
            
            <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 font-basteleur text-accent">
              {displayResult.answerIndex === -1 
                ? 'Niste odgovorili' 
                : displayResult.isCorrect 
                  ? 'Tačan odgovor!' 
                  : 'Netačan odgovor'}
            </h1>
            
            {/* Always show both answers for clarity */}
            <div className="space-y-4 sm:space-y-6">
              {/* Your answer box */}
              {displayResult.answerIndex !== -1 && (
                <div className={`p-3 sm:p-5 rounded-lg border-2 ${displayResult.isCorrect ? 'bg-green-700/20 border-highlight/40' : 'bg-red-500/20 border-red-500/40'}`}>
                  <p className={`text-base sm:text-lg mb-1 ${displayResult.isCorrect ? 'text-highlight' : 'text-red-200'}`}>
                    Vaš odgovor:
                  </p>
                  <p className="font-bold text-xl sm:text-2xl text-white">
                    {displayResult.selectedAnswer}
                  </p>
                </div>
              )}
            </div>
            
            <motion.div
              className="mt-6 sm:mt-10 bg-accent/30 p-4 sm:p-6 rounded-xl border border-accent/40 shadow-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-2xl sm:text-4xl font-bold text-white">
                +{displayResult.pointsAwarded} poena
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Debug Info - hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-accent/30 z-40">
          Status: {game?.status || (gameLoading ? 'loading...' : 'unknown')}
        </div>
      )}
    </div>
  );
};

export default PlayerAnswerResultPage; 