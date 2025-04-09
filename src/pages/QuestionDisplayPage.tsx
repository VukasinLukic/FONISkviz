import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../context/GameContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { Question } from '../lib/firebase';

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
  const { gameState } = useGameContext();
  
  // Check if we're on player route or admin route
  const isPlayerRoute = location.pathname.startsWith('/player');

  // State
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for question
  const [progress, setProgress] = useState(100); // Progress percentage for progress bar
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Initialize timer when a new question is loaded
  useEffect(() => {
    if (gameState.currentQuestion) {
      // Use the timeLimit from the question or default to 30 seconds
      const timeLimit = gameState.currentQuestion.timeLimit || 30;
      setTimeLeft(timeLimit);
    }
  }, [gameState.currentQuestion]);

  // Timer countdown and progress bar effect
  useEffect(() => {
    if (timeLeft > 0 && !isExiting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        
        // Calculate progress based on the original time limit
        const timeLimit = gameState.currentQuestion?.timeLimit || 30;
        setProgress((timeLeft - 1) * 100 / timeLimit);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isExiting) {
      handleTimeExpired();
    }
  }, [timeLeft, isExiting, gameState.currentQuestion]);

  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    if (isPlayerRoute) {
      setSelectedAnswer(answerId);
      setIsExiting(true);
      
      // Add a delay before navigation to allow exit animations
      setTimeout(() => {
        navigate('/player/waiting-answer', { state: { selectedAnswer: answerId } });
      }, 500);
    }
  };

  // Handle time expired
  const handleTimeExpired = () => {
    setIsExiting(true);
    
    // Add a delay before navigation to allow exit animations
    setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/waiting-answer');
      } else {
        navigate('/admin/answers');
      }
    }, 500);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;
  };

  // If there's no current question, show a loading state
  if (!gameState.currentQuestion) {
    return (
      <div className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-primary to-[#3a1106]">
        <AnimatedBackground density="medium" color="primary" />
        <div className="text-accent text-2xl font-bold">Učitavanje pitanja...</div>
      </div>
    );
  }

  // Convert the options object to an array for mapping
  const answerOptions = Object.entries(gameState.currentQuestion.options).map(([key, value]) => ({
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
            {/* Timer for admin / Progress Bar */}
            {!isPlayerRoute && (
              <motion.div 
                className="w-full mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-full h-3 bg-accent bg-opacity-20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-secondary"
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </div>
                <div className="text-right mt-1 text-accent text-sm">
                  {formatTime(timeLeft)}
                </div>
              </motion.div>
            )}
            
            {/* Category */}
            <motion.div 
              className="mb-6 text-center"
              variants={questionVariants}
            >
              <span className="bg-accent text-primary px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
                {gameState.currentCategory}
              </span>
            </motion.div>
            
            {/* Question */}
            <motion.div 
              className="mb-12 text-center max-w-2xl"
              variants={questionVariants}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent font-basteleur">
                {gameState.currentQuestion.text}
              </h1>
            </motion.div>
            
            {/* Answers Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl"
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