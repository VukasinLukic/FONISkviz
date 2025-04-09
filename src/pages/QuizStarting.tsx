import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, Variant, Variants } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

interface QuizStartingProps {}

const QuizStarting: React.FC<QuizStartingProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  
  // Check if we're on player/* route
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigation after a short time with smooth transition
  useEffect(() => {
    const preExitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3500);
    
    const navigationTimer = setTimeout(() => {
      // Navigate to the appropriate route depending on where we are
      if (isPlayerRoute) {
        navigate('/player/category', { state: { fromPrevious: true } });
      } else {
        navigate('/category', { state: { fromPrevious: true } });
      }
    }, 4200); // Additional delay for exit animation
    
    return () => {
      clearTimeout(preExitTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigate, isPlayerRoute]);

  // Animation variants
  const circleVariants: Variants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    exit: {
      scale: 1.5,
      opacity: 0,
      transition: { 
        duration: 0.7,
        ease: "easeInOut"
      }
    }
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.7, 
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-tertiarypink overflow-hidden flex flex-col items-center justify-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatedBackground density="medium" color="accent" />
      
      <motion.h1 
        className="text-primary text-4xl font-bold mb-8 text-center font-basteleur z-10"
        initial="hidden"
        animate="visible"
        exit={isExiting ? "exit" : "visible"}
        variants={contentVariants}
      >
        Kviz počinje!
      </motion.h1>
      
      <motion.div 
        className="relative w-80 h-80 mb-8 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={isExiting ? { scale: 1.5, opacity: 0 } : { scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: isExiting ? 0.7 : undefined
        }}
      >
        {/* Outer ripple */}
        <motion.div 
          className="absolute w-72 h-72 bg-secondary bg-opacity-20 rounded-full"
          animate={isExiting ? "exit" : "pulse"}
          variants={circleVariants}
        />
        
        {/* Inner ripple */}
        <motion.div 
          className="absolute w-56 h-56 bg-secondary bg-opacity-30 rounded-full"
          initial={{ scale: 0.9 }}
          animate={isExiting ? "exit" : { scale: [0.9, 1, 0.9], transition: { duration: 2.5, repeat: Infinity } }}
        />
        
        {/* Center content */}
        <motion.div 
          className="relative z-10 bg-highlight w-40 h-40 rounded-full flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05 }}
          animate={isExiting ? { scale: 1.2, opacity: 0 } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.p 
            className="text-white text-5xl font-bold font-basteleur"
            animate={{ 
              scale: isExiting ? [1, 1.5, 0] : [1, 1.1, 1],
              transition: { 
                duration: isExiting ? 0.7 : 1.5, 
                repeat: isExiting ? 0 : Infinity,
                repeatType: "reverse" as const
              }
            }}
          >
            FON
          </motion.p>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="flex flex-col items-center z-10"
        initial="hidden"
        animate="visible"
        exit={isExiting ? "exit" : "visible"}
        variants={contentVariants}
      >
        <p className="text-primary text-xl font-caviar mb-6">
          Pripremite se...
        </p>
        
        {/* Countdown indicators */}
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.3 * i,
                duration: 0.4,
                type: "spring"
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizStarting; 