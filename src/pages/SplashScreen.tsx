import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainButton from '../components/MainButton';
import AnimatedBackground from '../components/AnimatedBackground';
import { createGame, getAllQuestions } from '../lib/firebase';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      // Generate a new game code
      const newGameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('adminGameCode', newGameCode);
      localStorage.setItem('gameCode', newGameCode);
      localStorage.setItem('isAdmin', 'true');

      // Prepare initial game data (fetch questions if needed, or use defaults)
      const allQuestions = await getAllQuestions();
      if (!allQuestions || allQuestions.length === 0) {
        throw new Error("No questions found in the database. Seed questions first.");
      }
      // Shuffle all question IDs
      const allQuestionIds = allQuestions.map(q => q.id).sort(() => Math.random() - 0.5);
      // Use ALL shuffled questions for the game
      const questionOrder = allQuestionIds;

      if (questionOrder.length === 0) {
        throw new Error("Cannot start game with 0 questions.");
      }

      const initialData = {
        currentQuestionIndex: 0,
        questionOrder: questionOrder,
        timerEnd: null,
        currentRound: 1
      };

      console.log(`Creating game with code: ${newGameCode}`);
      await createGame(newGameCode, initialData);
      console.log(`Game ${newGameCode} created successfully.`);

      // Navigate to QR code page
      navigate('/admin/qrcode', { state: { fromSplash: true, gameCode: newGameCode } });

    } catch (err: any) {
      console.error("Error creating game:", err);
      setError(`Failed to create game: ${err.message}`);
      localStorage.removeItem('adminGameCode');
      localStorage.removeItem('gameCode');
      localStorage.removeItem('isAdmin');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      className={`min-h-screen overflow-hidden relative flex flex-col items-center justify-center bg-primary`} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <AnimatedBackground density="high" />
      
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
          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-md mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
          <MainButton
            onClick={handleCreateGame}
            disabled={isCreating}
            className="bg-secondary hover:bg-secondary/90 text-white py-4 text-lg"
          >
            {isCreating ? 'Creating Game...' : 'Kreiraj novu igru'}
          </MainButton>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
