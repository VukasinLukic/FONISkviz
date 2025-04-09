import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import TextReveal from '../components/TextReveal';
import Logo from '../components/Logo';

interface QRCodePageProps {}

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: (fromSplash: boolean) => ({
    opacity: 1,
    transition: {
      duration: fromSplash ? 0.1 : 0.8, // Faster entry if from splash
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }),
  exit: {
    opacity: 0,
    transition: { 
      duration: 0.5, 
      ease: "easeInOut",
      when: "afterChildren",
      staggerChildren: 0.05, // Stagger out
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};

const qrVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: "backOut", delay: 0.1 }
  },
  exit: itemVariants.exit // Use same exit as other items
};

const buttonVariants = {
  ...itemVariants, // Inherit base hidden/visible/exit
  visible: {
    ...itemVariants.visible, // Inherit base visible
    transition: { ...itemVariants.visible.transition, delay: 0.2 } // Slightly delay button
  }
};

const QRCodePage: React.FC<QRCodePageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Check if we're coming from the splash screen
  const fromSplash = location.state?.fromSplash || false;
  
  // Game code for the current session
  const [gameCode] = useState('FONIS123');
  
  // Full URL for joining the game
  const joinUrl = `${window.location.origin}/player?code=${gameCode}`;

  // Use loaded state to trigger initial animation
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), fromSplash ? 50 : 100); // Faster load trigger
    return () => clearTimeout(timer);
  }, [fromSplash]);
  
  const handleGoToLobby = () => {
    setIsExiting(true);
    // Navigation will happen after the exit animation completes (using onExitComplete)
  };
  
  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Logo size="medium" onClick={() => navigate('/admin')} />
      </motion.div>
      
      {/* Use AnimatePresence to handle the exit animation before navigation */}
      <AnimatePresence 
        mode="wait"
        onExitComplete={() => navigate('/admin/lobby', { state: { fromPrevious: true } })}
      >
        {loaded && !isExiting && (
          <motion.div
            key="qr-content" // Key is needed for AnimatePresence
            className="flex flex-col items-center justify-center w-full h-full pt-20 pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={fromSplash} // Pass fromSplash to variants if needed
          >
            {/* Heading */}
            <motion.div className="mb-6 z-30 text-reveal-container" variants={itemVariants}>
              <TextReveal
                text="Join FONIS Quiz"
                className="text-4xl md:text-5xl font-bold text-accent font-mainstay"
                duration={0.8} // TextReveal handles its own animation, just animate container
                delay={0} // Delay handled by stagger
              />
            </motion.div>
            
            {/* QR Code Container with Frame */}
            <motion.div
              className="qr-frame relative bg-accent p-4 rounded-lg mb-6 shadow-lg shadow-secondary/20 z-30"
              variants={qrVariants} // Specific variant for QR entrance
            >
              {/* Pulsing highlight effect - Framer Motion */}
              <motion.div 
                className="absolute inset-0 bg-secondary rounded-lg -z-10"
                initial={{ opacity: 0 }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0, 0.4, 0],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
              
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-secondary rounded-tl-md"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-secondary rounded-tr-md"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-md"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-secondary rounded-br-md"></div>
              
              {/* QR Code */}
              <div className="bg-white p-3 rounded-md shadow-inner">
                <QRCode 
                  value={joinUrl}
                  size={200}
                  level="H"
                  fgColor="#5A1B09"
                  bgColor="#FFFFFF"
                />
              </div>
            </motion.div>
            
            {/* Game Code */}
            <motion.div 
              className="game-code-container mb-6 text-center z-30"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-accent mb-1">
                Game Code
              </h2>
              <div className="game-code bg-secondary px-6 py-2 rounded-md text-2xl font-bold tracking-wider font-caviar text-white shadow-md">
                {gameCode}
              </div>
            </motion.div>
            
            {/* Instructions */}
            <motion.div className="mb-6 max-w-sm text-center z-30 text-reveal-container" variants={itemVariants}>
              <TextReveal
                text="Skenirajte QR kod svojim mobilnim uređajem"
                className="text-center text-accent mb-1 text-sm"
                duration={0.6} 
                delay={0} // Delay handled by stagger
              />
              <TextReveal
                text="da biste se pridružili kvizu"
                className="text-center text-accent mb-1 opacity-90 text-sm"
                duration={0.6}
                delay={0.1} // Slight delay for second line
              />
            </motion.div>
            
            {/* Button - Styled with higher prominence */}
            <motion.button 
              className="lobby-button bg-secondary hover:bg-secondary/90 text-white font-bold py-3 px-10 rounded-md transition-colors 
                duration-300 flex items-center justify-center shadow-lg text-base mb-4 z-30 relative opacity-100 visible"
              onClick={handleGoToLobby}
              variants={buttonVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                // Add pulsing effect for attention
                scale: [1, 1.02, 1],
                boxShadow: [
                  "0 0 8px 2px rgba(211, 83, 34, 0.4)", 
                  "0 0 15px 5px rgba(211, 83, 34, 0.7)", 
                  "0 0 8px 2px rgba(211, 83, 34, 0.4)"
                ],
                transition: {
                  scale: { duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                  boxShadow: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }
                }
              }}
            >
              {/* Button glow effect - CSS now handles the base glow */}
              <div className="absolute inset-0 bg-secondary rounded-md blur-md opacity-30 animate-pulse -z-10"></div>
              
              {/* Button content */}
              <div className="flex items-center justify-center relative z-10">
                <span className="mr-2">GO TO LOBBY</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </motion.button>
            
            {/* Connected players indicator */}
            <motion.div className="mt-1 flex items-center text-accent z-30" variants={itemVariants}>
              <div className="h-2 w-2 rounded-full bg-highlight animate-pulse mr-2"></div>
              <span className="text-xs opacity-80">4 teams connected</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QRCodePage; 