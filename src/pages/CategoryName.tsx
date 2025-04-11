import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { getGame } from '../lib/firebase';

interface CategoryNameProps {}

// Animation variants for page transitions
const pageVariants = {
  initial: { 
    opacity: 0,
  },
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

// Letter animation for spotlight reveal
const letterVariants = {
  initial: { 
    y: 100, 
    opacity: 0,
    rotateX: -90
  },
  animate: (custom: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: custom * 0.06,
      type: "spring",
      damping: 12
    }
  }),
  exit: (custom: number) => ({
    y: -50,
    opacity: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.03
    }
  }),
  hover: {
    y: -15,
    scale: 1.1,
    color: "#D35322",
    transition: { duration: 0.2 }
  }
};

// Sparkle animation for decorative elements
const sparkleVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: (custom: number) => ({
    scale: [0, 1.2, 1],
    opacity: [0, 1, 0.7],
    transition: {
      duration: 1.5,
      delay: 0.5 + custom * 0.1,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  })
};

// Card flip animation
const cardVariants = {
  initial: { 
    rotateY: 180, 
    opacity: 0.5,
    scale: 0.8
  },
  animate: { 
    rotateY: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      type: "spring",
      damping: 15
    }
  },
  exit: { 
    rotateY: -180, 
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.5
    }
  }
};

const CategoryName: React.FC<CategoryNameProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  const [isExiting, setIsExiting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const cardControls = useAnimationControls();
  const spotlightRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect if we're on player/* route
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Get category name from game context
  const categoryName = gameState.currentCategory || "Informatika";
  const categoryLetters = categoryName.split('');

  // Mouse move spotlight effect (desktop only)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || isExiting) return;
      
      const rect = spotlightRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      spotlightRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(252, 228, 188, 0.4) 0%, rgba(211, 83, 34, 0.1) 30%, transparent 70%)`;
    };
    
    // Add listener for desktop, not needed for mobile
    if (window.innerWidth > 768 && !isPlayerRoute) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isExiting, isPlayerRoute]);

  // Trigger load animation
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Card flip animation for interaction
  const handleCardHover = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      cardControls.start({
        rotateY: [0, 15, 0],
        transition: { duration: 1.5, ease: "easeInOut" }
      });
    }
  };

  // Navigate after exit animation
  const handleNavigate = useCallback(() => {
    if (isExiting) return; // Prevent multiple calls
    setIsExiting(true);
  }, [isExiting]);

  // Finalize navigation after exit animation completes
  const finalNavigation = useCallback(() => {
    if (isPlayerRoute) {
      // Navigate to the question display page instead of answers page
      console.log('Player finalNavigation: navigating to question display page');
      navigate('/player/question');
    } else {
      navigate('/admin/question');
    }
  }, [isPlayerRoute, navigate]);

  // Active monitoring of game state to ensure synchronization
  useEffect(() => {
    // Check if we should already be on the question page based on game state
    if (gameState.status === 'question') {
      console.log('Game status is question, navigating to question page');
      handleNavigate();
      return;
    }

    // Set up polling for game status changes
    const checkGameStatus = async () => {
      if (checkingStatus) return; // Prevent concurrent checks
      
      try {
        setCheckingStatus(true);
        const game = await getGame();
        
        if (game && game.status === 'question') {
          console.log('Game status changed to question, navigating from category');
          handleNavigate();
        }
      } catch (error) {
        console.error('Error checking game status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Check status every 1.5 seconds
    statusIntervalRef.current = setInterval(checkGameStatus, 1500);
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [gameState.status, handleNavigate]);

  // Auto-navigate trigger after a set delay
  useEffect(() => {
    if (loaded && !isExiting) {
      exitTimerRef.current = setTimeout(() => {
        handleNavigate();
      }, 4000); // 4 seconds display time
    }
    
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [loaded, isExiting, handleNavigate]);

  // Generate background sparkles
  const renderSparkles = () => {
    return Array.from({ length: 12 }).map((_, i) => {
      const size = Math.floor(Math.random() * 30) + 10; // 10-40px
      const top = `${Math.random() * 100}%`;
      const left = `${Math.random() * 100}%`;
      const colors = ["#FCE4BC", "#D35322", "#BFC330", "#5A1B09"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return (
        <motion.div 
          key={i}
          className="absolute rounded-full z-0"
          style={{
            top,
            left,
            width: size,
            height: size,
            backgroundColor: color,
            opacity: 0
          }}
          variants={sparkleVariants}
          custom={i}
          initial="initial"
          animate="animate"
        />
      );
    });
  };

  return (
    <div 
      className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-primary to-[#3a1106]"
      ref={spotlightRef}
    >
      {/* Dynamic spotlight effect container */}
      <div className="absolute inset-0 z-0 opacity-80"></div>
      
      {/* Background sparkles */}
      {renderSparkles()}
      
      <AnimatePresence mode="wait" onExitComplete={finalNavigation}>
        {loaded && !isExiting && (
          <motion.div
            className="relative z-10 w-full max-w-screen-md flex flex-col items-center justify-center"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* 3D Category Card */}
            <motion.div
              className="perspective-1000 mb-10 sm:mb-12 md:mb-16 w-full max-w-lg"
              onHoverStart={handleCardHover}
              animate={cardControls}
            >
              <motion.div
                className="relative bg-accent rounded-2xl shadow-[0_20px_50px_rgba(90,27,9,0.5)] border-4 border-secondary px-6 py-8 sm:px-10 sm:py-12 preserve-3d w-full"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Card Front Content */}
                <div className="text-center">
                  <h2 className="text-primary text-sm sm:text-base uppercase tracking-widest mb-4 font-bold">Kategorija</h2>
                  <div className="flex flex-wrap justify-center">
                    {categoryLetters.map((letter, index) => (
                      <motion.span
                        key={index}
                        className="text-3xl sm:text-5xl md:text-6xl font-bold text-primary font-basteleur inline-block mx-1"
                        variants={letterVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        custom={index}
                        whileHover="hover"
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                {/* Card decorations */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-highlight rounded-full flex items-center justify-center shadow-md z-10">
                  <span className="text-white text-xl font-bold">!</span>
                </div>
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-md z-10">
                  <span className="text-white text-xl font-bold">?</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Bottom hint text */}
            <motion.p
              className="text-accent text-sm sm:text-base opacity-80 text-center font-caviar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8, transition: { delay: 1 } }}
              exit={{ opacity: 0 }}
            >
              Spremite se za pitanja iz ove kategorije...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryName; 