import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// import AnimatedBackground from '../components/AnimatedBackground'; // Removed

const SplashScreen = () => {
  const navigate = useNavigate();
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  // const [bgColor, setBgColor] = useState("bg-accent"); // Removed - Layout handles bg
  
  // Navigation effect - Simplified
  useEffect(() => {
    if (logoAnimationComplete) {
      const timer = setTimeout(() => {
        setIsExiting(true); // Trigger exit animation
        
        // Navigate after a delay for the animation
        setTimeout(() => {
          navigate('/admin/qrcode', { state: { fromSplash: true } });
        }, 800); // Delay for exit animation
      }, 1500); // Shorter wait before exiting
      
      return () => clearTimeout(timer);
    }
  }, [logoAnimationComplete, navigate]);

  return (
    <motion.div
      // Removed background color class - Layout handles bg
      className={`min-h-screen overflow-hidden relative flex items-center justify-center`} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} // Simple fade out for the whole page container
      transition={{ duration: 0.7 }}
    >
      {/* Logo */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-20"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.8 : 1
        }}
        transition={{ 
          opacity: { duration: 0.7 },
          scale: { duration: 0.7 } 
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: logoAnimationComplete ? 1.05 : 1,
            opacity: isExiting ? 0 : 1 // Fade out logo on exit
          }}
          transition={{ 
            scale: { 
              duration: 1.2, 
              ease: "easeOut",
              repeat: logoAnimationComplete ? 1 : 0,
              repeatType: "reverse" 
            },
            opacity: { duration: 0.7 }
          }}
          onAnimationComplete={() => {
            if (!logoAnimationComplete) {
              setLogoAnimationComplete(true);
            }
          }}
        >
          <img
            src="/assets/logo.svg"
            alt="FONIS Quiz Logo"
            className="w-64 h-64 md:w-80 md:h-80 object-contain"
            onError={(e) => {
              // If image fails to load, show a fallback
              const target = e.currentTarget;
              target.style.display = 'none';
              
              // Create a fallback container
              const container = document.createElement('div');
              container.style.backgroundColor = '#D35322';
              container.style.width = '280px';
              container.style.height = '280px';
              container.style.display = 'flex';
              container.style.alignItems = 'center';
              container.style.justifyContent = 'center';
              container.style.borderRadius = '20px';
              container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              
              // Add text
              const text = document.createElement('div');
              text.innerText = 'FONIS QUIZ';
              text.style.color = 'white';
              text.style.fontSize = '36px';
              text.style.fontWeight = 'bold';
              text.style.fontFamily = 'Mainstay, serif';
              
              container.appendChild(text);
              target.parentElement?.appendChild(container);
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Background elements - REMOVED - Layout handles background */}
      {/* {logoAnimationComplete && (
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <AnimatedBackground 
            density="medium" 
            color={bgColor === "bg-accent" ? "accent" : "primary"}
            animated={true}
          />
        </motion.div>
      )} */}
    </motion.div>
  );
};

export default SplashScreen;
