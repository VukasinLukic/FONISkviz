import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';
import { motion } from 'framer-motion';
import TextReveal from '../components/TextReveal';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';

const JoinPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { registerTeam, resetGame } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check for device type and redirect if necessary
  useEffect(() => {
    // Reliable mobile device detection
    const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      navigator.userAgent
    );
    
    const isMobileByScreenSize = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = isMobileByUserAgent || (isMobileByScreenSize && isPortrait);
    
    console.log("JoinPage detection:", { isMobileByUserAgent, isMobileByScreenSize, isPortrait, isMobile });
    
    // If mobile device but not on player route, redirect
    if (isMobile && location.pathname !== '/player') {
      console.log("Mobile device on wrong route, redirecting to /player...");
      resetGame();
      localStorage.removeItem('teamId');
      localStorage.removeItem('gameCode');
      window.location.href = '/player';
      return;
    }
    
    // If desktop on player route, redirect to admin
    if (!isMobile && location.pathname === '/player') {
      console.log("Desktop device on player route, redirecting to /admin...");
      window.location.href = '/admin';
      return;
    }
  }, [location.pathname, resetGame]);
  
  // Reset game state when component loads
  useEffect(() => {
    resetGame();
    setGameCode('');
    setTeamName('');
    setError(null);
    
    // Clean old localStorage data
    const clearOldData = () => {
      const lastUpdated = localStorage.getItem('lastUpdated');
      if (lastUpdated) {
        const timestamp = parseInt(lastUpdated, 10);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24h
        
        if (isNaN(timestamp) || now - timestamp > maxAge) {
          localStorage.removeItem('teamId');
          localStorage.removeItem('gameCode');
          localStorage.removeItem('teamName');
          localStorage.removeItem('lastUpdated');
          localStorage.removeItem('gameVersion');
          localStorage.removeItem('latestGameCode');
        }
      }
    };
    
    clearOldData();
  }, [resetGame]);
  
  // Check for game code in URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl);
      localStorage.setItem('latestGameCode', codeFromUrl);
    } else {
      // Check if we have a saved code in localStorage
      const savedCode = localStorage.getItem('latestGameCode');
      if (savedCode) {
        setGameCode(savedCode);
      }
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!teamName.trim()) {
      setError("Please enter your team name");
      return;
    }
    
    if (!gameCode.trim()) {
      setError("Please enter the game code");
      return;
    }
    
    setIsLoading(true);
    try {
        console.log(`Registering team "${teamName}" with game code: ${gameCode}`);
      await registerTeam(teamName.trim(), 1, gameCode.trim().toUpperCase());
        
        console.log("Team registered successfully, navigating to mascot selection");
        navigate('/player/mascot');
      } catch (error) {
        console.error('Error registering team:', error);
        setError(error instanceof Error ? error.message : "Failed to register team. Please try again.");
      } finally {
        setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatedBackground />
      
      <div className="z-10 w-full max-w-md">
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Logo size="medium" />
        </motion.div>
        
        <motion.div 
          className="bg-accent rounded-lg p-6 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-primary mb-4 font-mainstay text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <TextReveal text="Join the Quiz" duration={0.5} delay={0.5} />
          </motion.h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gameCode" className="block text-primary font-semibold mb-1">
                Game Code
              </label>
              <input
                id="gameCode"
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                className="w-full bg-white border border-secondary/30 rounded-md px-4 py-2 text-primary placeholder-primary/50 focus:outline-none focus:ring-2 focus:ring-secondary"
                required
                maxLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="teamName" className="block text-primary font-semibold mb-1">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full bg-white border border-secondary/30 rounded-md px-4 py-2 text-primary placeholder-primary/50 focus:outline-none focus:ring-2 focus:ring-secondary"
                required
                maxLength={20}
              />
            </div>

            {error && (
              <motion.div 
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {error}
              </motion.div>
            )}
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MainButton
                type="submit"
                disabled={isLoading}
                className="w-full py-2"
              >
                {isLoading ? 'Joining...' : 'Join Game'}
            </MainButton>
            </motion.div>
          </form>
        </motion.div>
        
        <motion.p 
          className="text-center text-accent/80 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6 }}
        >
          Ask the quiz host for the game code
        </motion.p>
        </div>
    </motion.div>
  );
};

export default JoinPage; 