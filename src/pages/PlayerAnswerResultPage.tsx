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
      
      {/* Result Display */}
      <div className="h-full flex flex-col items-center justify-center">
        {isPageLoading ? (
          <motion.div
            className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ) : displayResult && (
          <motion.div
            className="text-center z-30 bg-secondary/20 p-8 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
                ${displayResult.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {displayResult.isCorrect ? (
                <span className="text-5xl">✓</span>
              ) : (
                <span className="text-5xl">✗</span>
              )}
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-4 font-serif text-accent">
              {displayResult.answerIndex === -1 
                ? 'Niste odgovorili' 
                : displayResult.isCorrect 
                  ? 'Tačan odgovor!' 
                  : 'Netačan odgovor'}
            </h1>
            
            <div className="space-y-4 text-accent/80">
              {displayResult.answerIndex !== -1 && (
                  <p>
                    Vaš odgovor: <span className="font-bold">{displayResult.selectedAnswer}</span>
                  </p>
              )}
              {(!displayResult.isCorrect || displayResult.answerIndex === -1) && (
                <p>
                  Tačan odgovor: <span className="font-bold">{displayResult.correctAnswer}</span>
                </p>
              )}
              <p className="text-2xl font-bold text-accent mt-6">
                +{displayResult.pointsAwarded} poena
              </p>
            </div>
            
            <p className="text-accent/60 mt-8">
              Sačekajte sledeće pitanje...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlayerAnswerResultPage; 