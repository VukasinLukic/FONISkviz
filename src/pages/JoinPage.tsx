import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainButton from '../components/MainButton';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { createTeam, getTeam, getGameData, getDb } from '../lib/firebase'; // Updated imports
import { Database } from 'firebase/database'; // Import Database type
import { ref, get } from 'firebase/database';

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
      setError("Unesite ime tima");
      return;
    }
    
    if (!gameCode.trim()) {
      setError("Unesite kod igre");
      return;
    }
    
    if (!dbInstance) {
      setError('Povezivanje sa bazom nije uspelo. Pokušajte ponovo.');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Registering team "${teamName}" with game code: ${gameCode}`);
      
      // Check if game exists before creating team
      const formattedGameCode = gameCode.trim().toUpperCase();
      const gameRef = ref(dbInstance, `game/${formattedGameCode}`);
      const gameSnapshot = await get(gameRef);
      
      if (!gameSnapshot.exists()) {
        setError(`Igra sa kodom "${formattedGameCode}" nije pronađena.`);
        setIsLoading(false);
        return;
      }
      
      // Create the team in Firebase
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
      setError(error instanceof Error ? error.message : "Neuspešna registracija tima. Pokušajte ponovo.");
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
    <div className="min-h-screen bg-[#fdebc4] p-4 relative overflow-hidden flex flex-col items-center">
      <AnimatedBackground density="low" />
      
      {/* Logo and title section - adjusted positioning */}
      <div className="w-full flex justify-center mt-10 mb-8 z-40">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6">
            <Logo size="large" className="w-44 h-44" />
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl md:text-4xl font-serif text-[#7d2a05] font-bold mb-3"
          >
            pridružite se kvizu!
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div
        className="w-full max-w-md z-40 mt-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form 
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          {/* Team name input */}
          <div className="flex flex-col gap-1">
            <label className="text-[#7d2a05] font-medium text-left">
              ime tima:
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="unesite ime ekipe..."
              className="p-3 bg-transparent border border-[#db7e57] rounded-md text-[#7d2a05] focus:outline-none focus:ring-2 focus:ring-[#db7e57]"
            />
          </div>
          
          {/* Game code input */}
          <div className="flex flex-col gap-1">
            <label className="text-[#7d2a05] font-medium text-left">
              kod igre:
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => handleGameCodeChange(e.target.value)}
              placeholder="unesite kod igre..."
              className="p-3 bg-transparent border border-[#db7e57] rounded-md text-[#7d2a05] focus:outline-none focus:ring-2 focus:ring-[#db7e57]"
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-800 p-2 rounded-md text-center">
              {error}
            </div>
          )}
          
          {/* Join button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-[#E67E50] hover:bg-[#d17347] text-white font-medium py-3 rounded-md transition-colors shadow-md"
          >
            {isLoading ? 'Učitavanje...' : 'uđi u partiju'}
          </button>
          
          {/* Saved code section */}
          {usingSavedCode && (
            <div className="text-center mt-2">
              <p className="text-[#7d2a05] text-sm">
                Koristi se sačuvani kod od {savedCodeTimestamp}
                {savedCodeIsOld && ' (star više od 12h)'}
              </p>
              <button
                type="button"
                onClick={handleClearSavedCode}
                className="text-[#E67E50] underline text-sm mt-1"
              >
                Obriši sačuvani kod
              </button>
            </div>
          )}
        </form>
      </motion.div>
      
      {/* Settings button in corner */}
      <div className="absolute bottom-4 right-4">
        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="text-[#E67E50] rounded-full w-10 h-10 flex items-center justify-center border border-[#E67E50]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default JoinPage; 