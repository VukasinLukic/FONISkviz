import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainButton from '../components/MainButton';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { createTeam, getTeam, getGameData, getDb } from '../lib/firebase'; // Updated imports
import { Database } from 'firebase/database'; // Import Database type

const JoinPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSavedCode, setUsingSavedCode] = useState(false);
  const [savedCodeIsOld, setSavedCodeIsOld] = useState(false);
  const [savedCodeTimestamp, setSavedCodeTimestamp] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [dbInstance, setDbInstance] = useState<Database | null>(null); // State for DB instance
  
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
  }, [location.pathname]);
  
  // Check for saved game code, teamId and handle cleanup
  useEffect(() => {
    // Clear previous state
    setGameCode('');
    setTeamName('');
    setError(null);
    setUsingSavedCode(false);
    setSavedCodeIsOld(false);
    
    // Check saved game code and its timestamp
    const checkSavedData = async () => {
      const savedTeamId = localStorage.getItem('teamId');
      const savedCode = localStorage.getItem('latestGameCode');
      const savedTimestamp = localStorage.getItem('gameCodeSavedAt');
      const savedTeamName = localStorage.getItem('teamName');
      
      // Check if team exists and is active
      if (savedTeamId && savedCode && savedTeamName) {
        try {
          const team = await getTeam(savedTeamId);
          
          if (team && team.isActive && team.gameCode === savedCode) {
            // Valid active team, redirect to waiting page
            console.log(`Active team found: ${savedTeamName} in game: ${savedCode}`);
            navigate('/player/waiting');
            return;
          } else {
            console.log('Saved team found but not active or game code mismatch');
          }
        } catch (err) {
          console.error('Error checking team:', err);
        }
      }
      
      // If no valid team, proceed with normal saved code check
      if (savedCode && savedTimestamp) {
        const timestamp = parseInt(savedTimestamp, 10);
        const now = Date.now();
        const hoursPassed = (now - timestamp) / (1000 * 60 * 60);
        
        if (!isNaN(timestamp)) {
          const date = new Date(timestamp);
          const formattedDate = date.toLocaleDateString() + ' ' + 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setSavedCodeTimestamp(formattedDate);
          if (hoursPassed > 12) setSavedCodeIsOld(true);
          // Set the game code input field if using saved code
          setGameCode(savedCode);
          setUsingSavedCode(true);
        } else {
          // Invalid timestamp, clear saved code
          handleClearSavedCode();
        }
      } else {
          // No saved code, clear timestamp etc.
          setSavedCodeTimestamp(null);
          setSavedCodeIsOld(false);
          setUsingSavedCode(false);
      }
    };
    
    // Clean up old localStorage data
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
          localStorage.removeItem('gameCodeSavedAt');
        }
      }
    };
    
    clearOldData();
    checkSavedData();
  }, []); // Rerun only on mount
  
  // Check for game code in URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl);
      localStorage.setItem('latestGameCode', codeFromUrl);
      localStorage.setItem('gameCodeSavedAt', Date.now().toString());
      setUsingSavedCode(false); // URL overrides saved code indicator
    }
  }, [searchParams]);
  
  // Handle game code change
  const handleGameCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setGameCode(upperValue);
    
    // If user manually changes the code, we're no longer using saved code
    if (usingSavedCode && upperValue !== localStorage.getItem('latestGameCode')) {
      setUsingSavedCode(false);
    }
  };
  
  // Handle clear saved code button
  const handleClearSavedCode = () => { 
    localStorage.removeItem('latestGameCode');
    localStorage.removeItem('gameCodeSavedAt');
    localStorage.removeItem('teamId');
    localStorage.removeItem('teamName');
    localStorage.removeItem('mascotId');
    setGameCode('');
    setUsingSavedCode(false);
    setSavedCodeIsOld(false);
    setSavedCodeTimestamp(null);
  };
  
  // Handle NEW team registration
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
    
    if (!dbInstance) {
      setError('Povezivanje sa bazom nije uspelo. Pokušajte ponovo.');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Registering team "${teamName}" with game code: ${gameCode}`);
      
      // Create the team in Firebase
      const formattedGameCode = gameCode.trim().toUpperCase();
      const teamId = await createTeam({
        name: teamName.trim(),
        mascotId: 1, // Default mascot, will be updated in MascotSelection
        joinedAt: Date.now(),
        isActive: true,
        gameCode: formattedGameCode,
        points: 0 // Initialize points to 0
      });
      
      // Save team data to localStorage
      localStorage.setItem('teamId', teamId);
      localStorage.setItem('teamName', teamName.trim());
      localStorage.setItem('gameCode', formattedGameCode);
      localStorage.setItem('latestGameCode', formattedGameCode);
      localStorage.setItem('gameCodeSavedAt', Date.now().toString());
      localStorage.setItem('lastUpdated', Date.now().toString());
      
      console.log("Team registered successfully, navigating to mascot selection");
      navigate('/player/mascot');
    } catch (error) {
      console.error('Error registering team:', error);
      setError(error instanceof Error ? error.message : "Failed to register team. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch DB instance
  useEffect(() => {
    const fetchDb = async () => {
      const db = await getDb();
      setDbInstance(db);
    };
    fetchDb();
  }, []);
  
  return (
    <div className="min-h-screen bg-primary p-4 flex flex-col overflow-hidden relative">
      <AnimatedBackground />
      
      {/* Logo at top */}
      <div className="flex justify-center mt-6 mb-8">
        <Logo size="medium" />
      </div>
      
      <div className="max-w-md mx-auto w-full z-20 mt-6 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-accent/10 backdrop-blur-sm p-8 rounded-lg border border-accent/20 shadow-lg"
        >
          <h1 className="text-3xl text-accent font-bold mb-6 text-center font-serif">
            Join Game
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Code Input */}
            <div>
              <label htmlFor="gameCode" className="block text-accent mb-2 font-medium">
                Game Code
              </label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => handleGameCodeChange(e.target.value)}
                placeholder="Enter game code"
                className="w-full px-4 py-2 rounded-md bg-black/30 text-accent border border-accent/50 focus:outline-none focus:ring-2 focus:ring-highlight placeholder-accent/50"
                disabled={isLoading}
                autoComplete="off"
                maxLength={6}
              />
              
              {/* Saved code indicator */}
              {usingSavedCode && (
                <div className="mt-2 text-xs text-accent/80 flex items-center justify-between">
                  <span>
                    {savedCodeIsOld 
                      ? '⚠️ Using saved code from ' 
                      : '✓ Using last used code from '
                    }
                    {savedCodeTimestamp}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSavedCode}
                    className="text-accent underline hover:text-highlight ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            
            {/* Team Name Input */}
            <div>
              <label htmlFor="teamName" className="block text-accent mb-2 font-medium">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="w-full px-4 py-2 rounded-md bg-black/30 text-accent border border-accent/50 focus:outline-none focus:ring-2 focus:ring-highlight placeholder-accent/50"
                disabled={isLoading}
                autoComplete="off"
                maxLength={30}
              />
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <MainButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3"
              >
                {isLoading ? 'Joining...' : 'Join Game'}
              </MainButton>
            </div>
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-md text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinPage; 