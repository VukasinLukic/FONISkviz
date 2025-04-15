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
      
      // Organize questions by category - Ko zna Zna? (q1-q8) first, then Istina ili Laž (q9-q16), then Ko živi ovde? (q17-q24)
      const koZnaZnaQuestions = allQuestions
        .filter(q => q.category === "Ko zna Zna?")
        .sort((a, b) => {
          // Extract the numeric part from the ID (e.g., 'q1' -> 1)
          const aNum = parseInt(a.id.substring(1));
          const bNum = parseInt(b.id.substring(1));
          return aNum - bNum; // Numeric sort to ensure proper order
        })
        .map(q => q.id);
      
      const istinaLazQuestions = allQuestions
        .filter(q => q.category === "Istina ili Laž")
        .sort((a, b) => {
          // Extract the numeric part from the ID (e.g., 'q9' -> 9)
          const aNum = parseInt(a.id.substring(1));
          const bNum = parseInt(b.id.substring(1));
          return aNum - bNum; // Numeric sort to ensure proper order
        })
        .map(q => q.id);
      
      const koZiviOvdeQuestions = allQuestions
        .filter(q => q.category === "Ko živi ovde?")
        .sort((a, b) => {
          // Extract the numeric part from the ID (e.g., 'q17' -> 17)
          const aNum = parseInt(a.id.substring(1));
          const bNum = parseInt(b.id.substring(1));
          return aNum - bNum; // Numeric sort to ensure proper order
        })
        .map(q => q.id);
      
      const kojiFilmSerijaQuestions = allQuestions
        .filter(q => q.category === "Koji film/serija je u pitanju?")
        .sort((a, b) => {
          // Extract the numeric part from the ID (e.g., 'q25' -> 25)
          const aNum = parseInt(a.id.substring(1));
          const bNum = parseInt(b.id.substring(1));
          return aNum - bNum; // Numeric sort to ensure proper order
        })
        .map(q => q.id);  
        
        // Filter, sort, and map questions for "Pogodite crtani"
      const pogoditeCrtaniQuestions = allQuestions
        .filter(q => q.category === "Pogodite crtani")
        .sort((a, b) => {
          // Assuming IDs like q33, q34...
          const aNum = parseInt(a.id.substring(1));
          const bNum = parseInt(b.id.substring(1));
          return aNum - bNum;
        })
        .map(q => q.id);

          // Filter, sort, and map questions for "Pogodite fonisovca"
      const pogoditeFonisovcaQuestions = allQuestions
      .filter(q => q.category === "Pogodite fonisovca")
      .sort((a, b) => {
        // Assuming IDs like q33, q34...
        const aNum = parseInt(a.id.substring(1));
        const bNum = parseInt(b.id.substring(1));
        return aNum - bNum;
      })
      .map(q => q.id);

      // Filter, sort, and map questions for "Pogodi Pesmu na osnovu Emoji-a"
      const pogodiPesmuQuestions = allQuestions
      .filter(q => q.category === "Pogodi Pesmu na osnovu Emoji-a")
      .sort((a, b) => {
        const aNum = parseInt(a.id.substring(1));
        const bNum = parseInt(b.id.substring(1));
        return aNum - bNum;
      })
      .map(q => q.id);
      
      // Filter, sort, and map questions for "FON FON FONIS"
      const fonFonFonisQuestions = allQuestions
      .filter(q => q.category === "FON FON FONIS")
      .sort((a, b) => {
        const aNum = parseInt(a.id.substring(1));
        const bNum = parseInt(b.id.substring(1));
        return aNum - bNum;
      })
      .map(q => q.id);
          
      // Verify the sorted question order
      console.log('Ko zna Zna? questions order:', koZnaZnaQuestions);
      console.log('Istina ili Laž questions order:', istinaLazQuestions);
      console.log('Ko živi ovde? questions order:', koZiviOvdeQuestions);
      console.log('Koji film/serija je u pitanju? questions order:', kojiFilmSerijaQuestions);
      console.log('Pogodite crtani questions order:', pogoditeCrtaniQuestions);
      console.log('Pogodite Fonisovca questions order:', pogoditeFonisovcaQuestions);
      console.log('Pogodi Pesmu na osnovu Emoji-a questions order:', pogodiPesmuQuestions);
      console.log('FON FON FONIS questions order:', fonFonFonisQuestions);

      // Combine categories in the correct order
      const questionOrder = [
        ...koZnaZnaQuestions, 
        ...istinaLazQuestions, 
        ...koZiviOvdeQuestions, 
        ...kojiFilmSerijaQuestions, 
        ...pogoditeCrtaniQuestions, 
        ...pogoditeFonisovcaQuestions, 
        ...pogodiPesmuQuestions,
        ...fonFonFonisQuestions
      ];
      console.log('Final question order:', questionOrder);

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
        className="flex items-center justify-center z-20"
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
          onClick={handleCreateGame}
          className={`cursor-pointer transform transition-transform hover:scale-105 ${isCreating ? 'pointer-events-none' : ''}`}
        >
          <img
            src="/assets/logo.svg"
            alt="FONIS Quiz Logo"
            className="w-80 h-80 md:w-96 md:h-96 object-contain"
            onError={(e) => {
              // If image fails to load, show a fallback
              const target = e.currentTarget;
              target.style.display = 'none';
              
              // Create a fallback container
              const container = document.createElement('div');
              container.style.backgroundColor = '#D35322';
              container.style.width = '350px';
              container.style.height = '350px';
              container.style.display = 'flex';
              container.style.alignItems = 'center';
              container.style.justifyContent = 'center';
              container.style.borderRadius = '20px';
              container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              
              // Add text
              const text = document.createElement('div');
              text.innerText = 'FONIS QUIZ';
              text.style.color = 'white';
              text.style.fontSize = '48px';
              text.style.fontWeight = 'bold';
              text.style.fontFamily = 'Mainstay, serif';
              
              container.appendChild(text);
              target.parentElement?.appendChild(container);
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Error message */}
      {logoAnimationComplete && error && (
        <motion.div
          className="flex flex-col gap-4 w-full max-w-md px-4 z-20 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-md text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        </motion.div>
      )}
      
      {/* Loading indicator when creating game */}
      {isCreating && (
        <motion.div 
          className="mt-6 text-white text-xl z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Kreiram igru...
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
