import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizAdmin } from '../lib/useQuizAdmin';
import MainButton from '../components/MainButton';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const { createNewGame, loading } = useQuizAdmin();
  
  const handleCreateGame = async () => {
    await createNewGame();
  };

  return (
    <motion.div
      className={`min-h-screen overflow-hidden relative flex flex-col items-center justify-center bg-accent`} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Logo */}
      <motion.div 
        className="flex items-center justify-center mb-12 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            scale: { duration: 1.2, ease: "easeOut" },
            opacity: { duration: 0.7 }
          }}
          onAnimationComplete={() => {
            setLogoAnimationComplete(true);
          }}
        >
          <img
            src="/assets/logo.svg"
            alt="FONIS Quiz Logo"
            className="w-64 h-64 md:w-72 md:h-72 object-contain"
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
      
      {/* Admin Controls */}
      {logoAnimationComplete && (
        <motion.div
          className="flex flex-col gap-4 w-full max-w-md px-4 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MainButton 
            onClick={handleCreateGame}
            disabled={loading}
            className="bg-secondary hover:bg-secondary/90 text-white py-4 text-lg"
          >
            {loading ? 'Kreiranje igre...' : 'Kreiraj novu igru'}
          </MainButton>
          
          <MainButton 
            onClick={() => navigate('/admin/lobby')}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white py-4 text-lg"
          >
            Nastavi postojeću igru
          </MainButton>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
