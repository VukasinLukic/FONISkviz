import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../context/GameContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { Question, db, answersRef } from '../lib/firebase';
import { useQuizAdmin } from '../lib/useQuizAdmin';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';

interface QuestionDisplayPageProps {}

// Main container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Question animation variants
const questionVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" }
  }
};

// Answer card animation variants
const answerCardVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: "backOut" }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const QuestionDisplayPage: React.FC<QuestionDisplayPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState, submitAnswer } = useGameContext();
  const { teams } = useQuizAdmin();
  
  // Check if we're on player route or admin route
  const isPlayerRoute = location.pathname.startsWith('/player');

  // State
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for question (changed from 30)
  const [progress, setProgress] = useState(100); // Progress percentage for progress bar
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [answeredTeamIds, setAnsweredTeamIds] = useState<string[]>([]); // Track answered teams
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // If there's no current question, use a default one instead of showing loading
  const questionToDisplay = gameState.currentQuestion || {
    id: '1',
    text: 'Koji je glavni grad Srbije?',
    options: {
      A: 'Zagreb',
      B: 'Beograd',
      C: 'Skopje',
      D: 'Sarajevo'
    },
    correctAnswer: 'B',
    category: gameState.currentCategory || 'Geografija',
    timeLimit: 5 // Changed from 30 to 5
  };

  // Initial entrance animation delay
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 300);
    
    return () => clearTimeout(initialTimer);
  }, []);

  // Initialize timer when a new question is loaded
  useEffect(() => {
    if (isInitialLoad) return; // Wait for initial animation to complete
    
    if (gameState.currentQuestion) {
      // Use the timeLimit from the question or default to 5 seconds
      const timeLimit = 5; // Override timeLimit to 5 seconds regardless of question setting
      setTimeLeft(timeLimit);
      startTimeRef.current = Date.now();
    } else {
      // Use the default timeLimit for our hardcoded question
      setTimeLeft(5);
      startTimeRef.current = Date.now();
    }

    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.currentQuestion, isInitialLoad]);

  // Handles navigation after time expires or answer is selected
  const handleTimeExpired = useCallback(() => {
    if (isExiting) return; // Prevent multiple calls
    
    setIsExiting(true);
    
    // Cancel any ongoing animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Add a delay before navigation to allow exit animations
    setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/waiting-answer');
      } else {
        navigate('/admin/answers');
      }
    }, 300);
  }, [isExiting, isPlayerRoute, navigate]);

  // Smoother timer countdown and progress bar using requestAnimationFrame
  useEffect(() => {
    if (isExiting || !startTimeRef.current || isInitialLoad) return;

    const totalDuration = 5000; // 5 seconds in milliseconds
    const startTime = startTimeRef.current;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, totalDuration - elapsed);
      
      // Update seconds remaining (ceiling to give player slight advantage)
      const secondsRemaining = Math.ceil(remaining / 1000);
      
      // Update progress bar (smoother animation)
      const progressPercent = Math.max(0, (remaining / totalDuration) * 100);
      
      setTimeLeft(secondsRemaining);
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        // Time's up
        handleTimeExpired();
        return;
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };
    
    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateTimer);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isExiting, isInitialLoad, handleTimeExpired]);

  // Listener for answers (only for admin view)
  useEffect(() => {
    if (isPlayerRoute || !questionToDisplay?.id) return; // Only run for admin and if question exists

    const currentQuestionId = questionToDisplay.id;
    const answersQuery = query(
        answersRef,
        orderByChild('questionId'),
        equalTo(currentQuestionId)
    );

    console.log(`[Admin Q Display] Setting up listener for answers to question: ${currentQuestionId}`);
    setAnsweredTeamIds([]); // Reset on new question

    const listener = onValue(answersQuery, (snapshot) => {
      if (snapshot.exists()) {
        const answersData = snapshot.val();
        const teamIds = Object.values(answersData).map((answer: any) => answer.teamId);
        console.log("[Admin Q Display] Received answers, teams answered:", teamIds);
        setAnsweredTeamIds(teamIds);
      } else {
        setAnsweredTeamIds([]);
      }
    }, (error) => {
        console.error("[Admin Q Display] Error listening for answers:", error);
    });

    // Cleanup listener
    return () => {
      console.log(`[Admin Q Display] Cleaning up answer listener for question: ${currentQuestionId}`);
      off(answersQuery, 'value', listener);
    };

  }, [questionToDisplay?.id, isPlayerRoute]);

  // Handle answer selection
  const handleAnswerSelect = async (answerId: string) => {
    if (isPlayerRoute && !isExiting) {
      setSelectedAnswer(answerId);
      setIsExiting(true);
      
      // Cancel any ongoing timer
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      try {
        // Submit the answer to Firebase if we have a real question
        if (gameState.currentQuestion && gameState.currentQuestion.id) {
          await submitAnswer(gameState.currentQuestion.id, answerId);
        }
        
        // Add a delay before navigation to allow exit animations
        setTimeout(() => {
          navigate('/player/waiting-answer', { state: { selectedAnswer: answerId } });
        }, 300);
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Still navigate even if error occurs
        setTimeout(() => {
          navigate('/player/waiting-answer', { state: { selectedAnswer: answerId } });
        }, 300);
      }
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;
  };

  // Convert the options object to an array for mapping
  const answerOptions = Object.entries(questionToDisplay.options).map(([key, value]) => ({
    id: key,
    text: value
  }));

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-primary to-[#3a1106]">
      {/* Animated background decorations */}
      <AnimatedBackground density="medium" color="primary" />
      
      <AnimatePresence mode="wait">
        {!isExiting && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Top Section: Timer/Progress and Category */}
            <div className="w-full flex justify-between items-center mb-8">
                 {/* Timer/Progress Bar (Adjust layout slightly) */}
                <div className="w-3/4">
                    <div className="w-full h-3 bg-accent bg-opacity-20 rounded-full overflow-hidden">
                        <motion.div 
                        className="h-full bg-secondary"
                        style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-right mt-1 text-accent text-sm">
                        {formatTime(timeLeft)}
                    </div>
                </div>
                 {/* Category (Move beside timer?) */}
                 <motion.div 
                    className="text-center"
                    variants={questionVariants} // Reuse variant
                >
                    <span className="bg-accent text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {questionToDisplay.category}
                    </span>
                </motion.div>
            </div>

            {/* Middle Section: Question */}
            <motion.div 
              className="mb-10 text-center max-w-2xl"
              variants={questionVariants}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent font-basteleur">
                {questionToDisplay.text}
              </h1>
            </motion.div>
            
            {/* Bottom Section: Answers Grid and Admin Stats */}
            <div className="w-full flex flex-col md:flex-row gap-6 max-w-5xl">
                {/* Answers Grid (Takes up more space now) */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-2/3"
                >
                  {answerOptions.map((answer) => (
                    <motion.div
                      key={answer.id}
                      className={`
                        cursor-pointer rounded-xl p-6 shadow-lg
                        ${isPlayerRoute ? 'hover:scale-105 transition-transform' : ''}
                        ${answer.id === 'A' ? 'bg-highlight bg-opacity-90' : 
                          answer.id === 'B' ? 'bg-secondary bg-opacity-90' : 
                          answer.id === 'C' ? 'bg-special bg-opacity-90' : 
                          'bg-accent bg-opacity-90'}
                        ${selectedAnswer === answer.id ? 'ring-4 ring-white' : ''}
                        ${!isPlayerRoute ? 'pointer-events-none' : ''}
                      `}
                      variants={answerCardVariants}
                      onClick={() => handleAnswerSelect(answer.id)}
                      whileHover={isPlayerRoute ? { scale: 1.05 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <div className="mr-4 bg-white bg-opacity-20 w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-xl font-caviar">
                          {answer.id}
                        </div>
                        <div className="text-white text-lg sm:text-xl font-medium font-caviar">
                          {answer.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Admin Stats Panel (Only for Admin) */}
                {!isPlayerRoute && (
                    <motion.div 
                        className="w-full md:w-1/3 bg-accent/10 p-4 rounded-lg"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-accent font-bold mb-3 text-center">Odgovori ({answeredTeamIds.length}/{teams.length})</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {teams.map(team => (
                                <motion.div 
                                    key={team.id} 
                                    className={`flex items-center justify-between p-2 rounded transition-opacity duration-300 
                                        ${answeredTeamIds.includes(team.id) ? 'bg-highlight/30 opacity-100' : 'bg-primary/30 opacity-60'}`}
                                    initial={{ opacity: 0}}
                                    animate={{ opacity: answeredTeamIds.includes(team.id) ? 1 : 0.6 }}
                                >
                                    <span className="text-accent text-sm font-caviar">{team.name}</span>
                                    {answeredTeamIds.includes(team.id) && (
                                        <svg className="w-4 h-4 text-highlight" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Mobile countdown visible only for players */}
            {isPlayerRoute && (
              <motion.div 
                className="mt-8 text-center text-accent text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionDisplayPage; 