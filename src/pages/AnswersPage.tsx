import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../context/GameContext';
import AnimatedBackground from '../components/AnimatedBackground';

interface AnswersPageProps {}

interface TeamAnswer {
  id: string;
  name: string;
  mascotId: number;
  answer: string;
  isCorrect: boolean;
  points: number;
  responseTime: number; // in milliseconds
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
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

const itemVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};

const cardVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5, type: "spring", damping: 12 }
  },
  exit: { 
    scale: 0.9, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const AnswersPage: React.FC<AnswersPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  
  // Detect if we're on player/* route
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(isPlayerRoute ? 20 : 10); // 20s for players to answer, 10s for admin results
  const [progress, setProgress] = useState(100);
  
  // Set of possible questions to show if no real question is available
  const defaultQuestions = [
    {
      id: '1',
      text: 'Koji je glavni grad Srbije?',
      category: 'Geografija',
      options: {
        A: 'Zagreb',
        B: 'Beograd', 
        C: 'Skopje',
        D: 'Sarajevo'
      },
      correctAnswer: 'B'
    },
    {
      id: '2',
      text: 'Ko je napisao roman "Na Drini ćuprija"?',
      category: 'Književnost',
      options: {
        A: 'Mesa Selimović',
        B: 'Branislav Nušić',
        C: 'Ivo Andrić',
        D: 'Dobrica Ćosić'
      },
      correctAnswer: 'C'
    },
    {
      id: '3',
      text: 'Koji element ima hemijski simbol "O"?',
      category: 'Nauka',
      options: {
        A: 'Zlato',
        B: 'Kiseonik',
        C: 'Olovo',
        D: 'Vodonik'
      },
      correctAnswer: 'B'
    }
  ];
  
  // Get a random question from default questions if no real question is available
  const randomIndex = Math.floor(Math.random() * defaultQuestions.length);
  const currentQuestion = gameState.currentQuestion || defaultQuestions[randomIndex];
  
  // Mock team answers for admin view (would come from Firebase in real app)
  const teamAnswers: TeamAnswer[] = [
    { id: '1', name: 'Team Fox', mascotId: 1, answer: 'B', isCorrect: true, points: 100, responseTime: 2300 },
    { id: '2', name: 'Team Lion', mascotId: 2, answer: 'A', isCorrect: false, points: 0, responseTime: 3100 },
    { id: '3', name: 'Team Panda', mascotId: 3, answer: 'B', isCorrect: true, points: 100, responseTime: 4200 },
    { id: '4', name: 'Team Koala', mascotId: 4, answer: 'D', isCorrect: false, points: 0, responseTime: 3800 }
  ];
  
  // Group teams by correct/incorrect answers
  const correctTeams = teamAnswers.filter(team => team.isCorrect);
  const incorrectTeams = teamAnswers.filter(team => !team.isCorrect);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0 && !isExiting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        // Update progress bar
        setProgress((timeLeft - 1) * 100 / (isPlayerRoute ? 20 : 10));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isExiting) {
      handleTimeExpired();
    }
  }, [timeLeft, isExiting, isPlayerRoute]);
  
  // Handle answer selection for player route
  const handleAnswerSelect = (answer: string) => {
    if (isPlayerRoute) {
    setSelectedAnswer(answer);
      setIsExiting(true);
      
      // Add a delay before navigation to allow exit animations
      setTimeout(() => {
        navigate('/player/waiting-answer', { state: { selectedAnswer: answer } });
      }, 500);
    }
  };
  
  // Handle timer expiration
  const handleTimeExpired = () => {
    setIsExiting(true);
    
    // Add a delay before navigation to allow exit animations
    setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/waiting-answer');
      } else {
        navigate('/admin/points');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-primary to-[#3a1106]">
      {/* Animated background decorations */}
      <AnimatedBackground density="medium" color="primary" />
      
      <AnimatePresence mode="wait">
        {!isExiting && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Progress Bar */}
            <motion.div 
              className="w-full mb-8"
              variants={itemVariants}
            >
              <div className="w-full h-3 bg-accent bg-opacity-20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-secondary"
                  initial={{ width: "100%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
            </motion.div>
            
            {/* Category */}
            <motion.div 
              className="mb-2 text-center"
              variants={itemVariants}
            >
              <span className="bg-accent text-primary px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
                {currentQuestion.category}
              </span>
            </motion.div>
            
            {isPlayerRoute ? (
              // Player Route - Answer Selection
              <>
                {/* Question */}
                <motion.div 
                  className="mb-8 text-center max-w-2xl"
                  variants={itemVariants}
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-accent font-basteleur">
                    {currentQuestion.text}
                  </h1>
                </motion.div>
                
                {/* Answers Grid for Player */}
                <motion.div 
                  className="grid grid-cols-2 gap-4 w-full max-w-md"
                  variants={itemVariants}
                >
                  {Object.entries(currentQuestion.options).map(([id, text]) => (
                    <motion.button
                      key={id}
                      className={`p-6 rounded-xl text-white font-bold text-xl flex items-center justify-center shadow-lg transition-all
                        ${selectedAnswer === id ? 'ring-4 ring-white' : ''}
                        ${id === 'A' ? 'bg-highlight hover:bg-opacity-90' : 
                          id === 'B' ? 'bg-secondary hover:bg-opacity-90' : 
                          id === 'C' ? 'bg-special hover:bg-opacity-90' : 
                          'bg-accent hover:bg-opacity-90'}
                      `}
                      onClick={() => handleAnswerSelect(id)}
                      variants={cardVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mr-3 bg-white bg-opacity-20 w-9 h-9 flex items-center justify-center rounded-full">
                        {id}
                      </span>
                      <span className="font-caviar">{text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            ) : (
              // Admin Route - Results Display
              <>
                {/* Question */}
                <motion.div 
                  className="mb-6 text-center max-w-2xl"
                  variants={itemVariants}
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-2 font-basteleur">
                    {currentQuestion.text}
                  </h1>
                </motion.div>
                
                {/* Points animation */}
                <motion.div
                  className="text-highlight text-6xl font-bold mb-6"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ 
                    scale: [0.5, 1.2, 1],
                    opacity: [0, 1, 1]
                  }}
                  transition={{ 
                    duration: 0.8,
                    times: [0, 0.6, 1],
                    ease: "easeOut"
                  }}
                >
                  +100
                </motion.div>
                
                {/* Correct Answer */}
                <motion.div 
                  className="mb-10 text-center"
                  variants={itemVariants}
                >
                  <h2 className="text-2xl font-bold text-accent mb-2 font-caviar">
                    Tačan odgovor: <span className="text-highlight">
                      {currentQuestion.options[currentQuestion.correctAnswer as keyof typeof currentQuestion.options]}
                    </span>
                  </h2>
                  
                  {/* Decorative divider */}
                  <div className="w-32 h-1 bg-secondary mx-auto rounded-full mt-2"></div>
                </motion.div>
                
                {/* Team Results */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Correct Teams */}
                  <motion.div 
                    className="bg-highlight bg-opacity-20 p-6 rounded-xl"
                    variants={cardVariants}
                  >
                    <h3 className="text-xl font-bold text-highlight mb-4 font-caviar text-center">
                      Tačni odgovori
                    </h3>
                    <div className="space-y-3">
                      {correctTeams.map((team) => (
                        <motion.div 
                          key={team.id}
                          className="bg-highlight bg-opacity-40 rounded-lg p-3 flex items-center"
                          whileHover={{ x: 5 }}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <img 
                              src={`/assets/maskota${team.mascotId} 1.svg`}
                              alt={`Team ${team.name} Mascot`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/maskota1 1.svg';
                              }}
                            />
                          </div>
                          <span className="font-caviar font-medium text-white flex-1">
                            {team.name}
                          </span>
                          <span className="font-bold text-white">
                            +{team.points}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Incorrect Teams */}
                  <motion.div 
                    className="bg-special bg-opacity-20 p-6 rounded-xl"
                    variants={cardVariants}
                  >
                    <h3 className="text-xl font-bold text-special mb-4 font-caviar text-center">
                      Netačni odgovori
                    </h3>
                    <div className="space-y-3">
                      {incorrectTeams.map((team) => (
                        <motion.div 
                          key={team.id}
                          className="bg-special bg-opacity-40 rounded-lg p-3 flex items-center"
                          whileHover={{ x: 5 }}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <img 
                              src={`/assets/maskota${team.mascotId} 1.svg`}
                              alt={`Team ${team.name} Mascot`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/maskota1 1.svg';
                              }}
                            />
                          </div>
                          <span className="font-caviar font-medium text-white flex-1">
                            {team.name}
                          </span>
                          <span className="font-bold text-white opacity-50">
                            {team.answer}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnswersPage; 