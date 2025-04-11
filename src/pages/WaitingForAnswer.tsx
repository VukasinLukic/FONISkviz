import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../context/GameContext';

interface WaitingForAnswerProps {}

// Animation variants
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
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const WaitingForAnswer: React.FC<WaitingForAnswerProps> = () => {
  const [dots, setDots] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect if we're on player/* route
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Use the properties directly from gameState
  const { teamName, mascotId, teamId } = gameState;

  // Get the selected answer from location state
  const selectedAnswer = location.state?.selectedAnswer;
  
  // Log for debugging
  useEffect(() => {
    console.log('WaitingForAnswer - Current game state:', {
      status: gameState.status,
      selectedAnswer,
      teamName: gameState.teamName,
      mascotId: gameState.mascotId
    });
  }, [gameState.status, selectedAnswer, gameState.teamName, gameState.mascotId]);

  // Simulate loading dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-navigation after waiting time
  useEffect(() => {
    // Create timer for auto-navigation
    navigationTimerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (isPlayerRoute) {
          navigate('/player/points');
        } else {
          navigate('/admin/points');
        }
      }, 300); // Short delay for exit animation
    }, 3000); // Wait time in ms (adjust as needed)
    
    // Listen for game status changes to navigate immediately when results are ready
    const checkGameStatusInterval = setInterval(() => {
      if (gameState.status === 'results') {
        console.log('Game status changed to results, navigating to points');
        clearTimeout(navigationTimerRef.current as NodeJS.Timeout);
        setIsExiting(true);
        setTimeout(() => {
          navigate('/player/points');
        }, 300);
      }
    }, 1000);
    
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      clearInterval(checkGameStatusInterval);
    };
  }, [navigate, isPlayerRoute, gameState.status]);

  // If no team ID, redirect to home
  useEffect(() => {
    if (!teamId) {
      navigate(isPlayerRoute ? '/player' : '/');
    }
  }, [teamId, navigate, isPlayerRoute]);

  if (!teamId) return null;

  return (
    <div className="min-h-screen bg-tertiarybrown p-4 flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!isExiting && (
          <motion.div 
            className="flex flex-col items-center justify-center w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h2 
              className="text-primary text-2xl font-bold mb-8 font-basteleur"
              variants={itemVariants}
            >
              odgovor je poslat!
            </motion.h2>
            
            <motion.p 
              className="text-primary text-xl mb-8 font-caviar text-center"
              variants={itemVariants}
            >
              čekamo da svi timovi odgovore{dots}
            </motion.p>
            
            {selectedAnswer && (
              <motion.div
                className="mb-8 bg-primary bg-opacity-20 px-6 py-4 rounded-xl"
                variants={itemVariants}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <p className="text-primary text-center font-caviar">
                  Vaš odgovor: <span className="font-bold">{selectedAnswer}</span>
                </p>
              </motion.div>
            )}
            
            <motion.div
              variants={itemVariants}
              className="relative"
            >
              {mascotId > 0 && !imageError ? (
                <motion.img 
                  src={`/assets/maskota${mascotId} 1.svg`}
                  alt={`Maskota tima ${teamName}`}
                  className="w-64 h-64 object-contain"
                  onError={() => setImageError(true)}
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ 
                    scale: [0.8, 1.05, 1],
                    rotate: [-5, 5, 0],
                    transition: { 
                      duration: 1.2,
                      ease: "easeOut"
                    }
                  }}
                />
              ) : (
                <motion.div 
                  className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-primary text-xl font-caviar">?</p>
                </motion.div>
              )}
            </motion.div>

            {import.meta.env.DEV && (
              <motion.p 
                className="text-sm text-primary mt-4 font-caviar opacity-50"
                variants={itemVariants}
              >
                Debug: Mascot ID = {mascotId}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaitingForAnswer; 