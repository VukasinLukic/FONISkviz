import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';

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
  const cardControls = useAnimationControls();
  const spotlightRef = useRef<HTMLDivElement>(null);
  
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
  const handleNavigate = () => {
    setIsExiting(true);
  };

  // Auto-navigate trigger after a delay
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        handleNavigate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const finalNavigation = () => {
    if (isPlayerRoute) {
      navigate('/player/answers');
    } else {
      navigate('/admin/question');
    }
  };

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
                <div className="flex flex-col items-center justify-center text-center backface-hidden">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 mb-4"
                    initial={{ rotateZ: 0 }}
                    animate={{ rotateZ: 360 }}
                    transition={{ 
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                        fill="#D35322" />
                    </svg>
                  </motion.div>
                  
                  <motion.h2
                    className="text-primary text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-caviar"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Sledeća kategorija
                  </motion.h2>
                  
                  <motion.div 
                    className="h-1 w-24 bg-secondary rounded-full mb-6"
                    initial={{ width: 0 }}
                    animate={{ width: 96 }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                  />
                </div>
              </motion.div>
            </motion.div>
            
            {/* Category Name with 3D Theater Effect */}
            <div className="relative w-full max-w-lg">
              {/* Category Name 3D Container */}
              <div className="flex justify-center items-center perspective-1000 py-6 md:py-10 px-4">
                {/* Spotlight Base */}
                <motion.div 
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 sm:h-36 bg-secondary bg-opacity-20 rounded-full blur-xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  transition={{ delay: 0.3 }}
                />
                
                {/* Main Stage */}
                <div className="flex flex-wrap justify-center items-baseline relative z-10">
                  {categoryLetters.map((letter, index) => (
                    <motion.div
                      key={index}
                      className="relative mx-1 sm:mx-2 preserve-3d" 
                      variants={letterVariants}
                      custom={index}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                    >
                      <span className={`
                        text-4xl sm:text-6xl md:text-7xl font-bold font-basteleur inline-block
                        ${index % 2 === 0 ? 'text-accent' : 'text-secondary'}
                      `}>
                        {letter === ' ' ? '\u00A0' : letter}
                      </span>
                      
                      {/* Letter Shadow */}
                      <span className="absolute top-[0.25em] left-[0.25em] opacity-20 text-primary text-4xl sm:text-6xl md:text-7xl font-bold font-basteleur -z-10">
                        {letter === ' ' ? '\u00A0' : letter}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Navigation Badge */}
            <motion.div
              className="mt-8 sm:mt-12"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              exit={{ y: 50, opacity: 0, transition: { duration: 0.3 } }}
            >
              <div className="relative">
                {/* Badge Glow Effect */}
                <div className="absolute -inset-1 bg-highlight rounded-full opacity-70 blur-md"></div>
                
                {/* Main Badge */}
                <motion.div 
                  className="relative bg-accent py-3 px-6 sm:py-4 sm:px-8 rounded-full border-2 border-secondary shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-primary text-xl sm:text-2xl font-bold font-basteleur tracking-wider">
                    NOVA KATEGORIJA
                  </span>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Mobile Progress Indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-accent opacity-40"
                  animate={{ opacity: i === 0 ? 1 : 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryName; 