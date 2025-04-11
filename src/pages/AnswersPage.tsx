import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../context/GameContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { getAllAnswersForQuestion, getQuestionById, Answer, Team, Question } from '../lib/firebase';

interface AnswersPageProps {}

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
  const { gameState } = useGameContext();
  
  const [isExiting, setIsExiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); // Only need admin timer (e.g., 10s)
  const [progress, setProgress] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<Array<Answer & { team: Team }>>([]);
  const [loading, setLoading] = useState(true);
  
  // Default questions to show if no real question is available
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
    }
  ];
  
  // Get the current question and team answers
  useEffect(() => {
    const fetchQuestionAndAnswers = async () => {
      setLoading(true);
      // Ensure we use the ID string from the gameState.currentQuestion object
      const currentQuestionId = gameState.currentQuestion?.id;
      
      if (currentQuestionId) { // Check if the ID exists
        try {
          // Get the current question using its ID
          const question = await getQuestionById(currentQuestionId); // Pass ID string
          
          if (question) {
            setCurrentQuestion(question);
            
            // Get all team answers for this question using its ID
            const answers = await getAllAnswersForQuestion(currentQuestionId); // Pass ID string
            setTeamAnswers(answers);
          } else {
            // Use default question if nothing is available
            const randomIndex = Math.floor(Math.random() * defaultQuestions.length);
            setCurrentQuestion(defaultQuestions[randomIndex]);
            setTeamAnswers([]);
          }
        } catch (error) {
          console.error("Error fetching question data:", error);
          // Use default question on error
          const randomIndex = Math.floor(Math.random() * defaultQuestions.length);
          setCurrentQuestion(defaultQuestions[randomIndex]);
          setTeamAnswers([]);
        }
      } else {
        // Use default question if no current question ID
        const randomIndex = Math.floor(Math.random() * defaultQuestions.length);
        setCurrentQuestion(defaultQuestions[randomIndex]);
        setTeamAnswers([]);
      }
      
      setLoading(false);
    };
    
    fetchQuestionAndAnswers();
  }, [gameState.currentQuestion]); // Dependency remains the same object
  
  // Group teams by correct/incorrect answers 
  const correctTeams = teamAnswers.filter(answer => answer.isCorrect);
  const incorrectTeams = teamAnswers.filter(answer => !answer.isCorrect);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0 && !isExiting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setProgress((timeLeft - 1) * 100 / 10); // Use the admin duration (10s)
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isExiting) {
      handleTimeExpired();
    }
  }, [timeLeft, isExiting]); // Removed isPlayerRoute dependency
  
  // Handle timer expiration
  const handleTimeExpired = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/admin/points'); // Always navigate admin to points/leaderboard
    }, 500);
  };

  // If still loading and on admin page, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
        <p className="text-accent text-xl">Loading question data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-primary to-[#3a1106]">
      {/* Animated background decorations */}
      <AnimatedBackground density="medium" color="primary" />
      
      <AnimatePresence mode="wait">
        {!isExiting && currentQuestion && (
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
            
            {/* Admin Route - Results Display */}
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
                    Tačni odgovori ({correctTeams.length})
                  </h3>
                  
                  {correctTeams.length === 0 ? (
                    <div className="text-white text-center p-4">
                      Nijedan tim nije odgovorio tačno
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {correctTeams.map((answerData) => (
                        <motion.div 
                          key={answerData.team.id}
                          className="bg-highlight bg-opacity-40 rounded-lg p-3 flex items-center"
                          whileHover={{ x: 5 }}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <img 
                              src={`/assets/maskota${answerData.team.mascotId} 1.svg`}
                              alt={`Team ${answerData.team.name} Mascot`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/maskota1 1.svg';
                              }}
                            />
                          </div>
                          <span className="font-caviar font-medium text-white flex-1">
                            {answerData.team.name}
                          </span>
                          <span className="font-bold text-white">
                            +{answerData.pointsEarned || 100}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
                
                {/* Incorrect Teams */}
                <motion.div 
                  className="bg-special bg-opacity-20 p-6 rounded-xl"
                  variants={cardVariants}
                >
                  <h3 className="text-xl font-bold text-special mb-4 font-caviar text-center">
                    Netačni odgovori ({incorrectTeams.length})
                  </h3>
                  
                  {incorrectTeams.length === 0 ? (
                    <div className="text-white text-center p-4">
                      Svi timovi su odgovorili tačno
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {incorrectTeams.map((answerData) => (
                        <motion.div 
                          key={answerData.team.id}
                          className="bg-special bg-opacity-40 rounded-lg p-3 flex items-center"
                          whileHover={{ x: 5 }}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <img 
                              src={`/assets/maskota${answerData.team.mascotId} 1.svg`}
                              alt={`Team ${answerData.team.name} Mascot`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/maskota1 1.svg';
                              }}
                            />
                          </div>
                          <span className="font-caviar font-medium text-white flex-1">
                            {answerData.team.name}
                          </span>
                          <span className="font-bold text-white opacity-50">
                            {answerData.answer}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnswersPage; 