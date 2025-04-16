import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, updateTeam, setGameStatus as setFirebaseGameStatus, GameStatus, getDb } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { onValue, ref, remove, query, orderByChild, equalTo, Database } from 'firebase/database';
import DevTools from '../components/DevTools';
import { getMascotImageUrl } from '../lib/utils'; // Import helper

const LobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false); // Loading state for game start action
  const [loadingTeams, setLoadingTeams] = useState(true); // Separate loading state for fetching teams
  const [previousTeamsCount, setPreviousTeamsCount] = useState(0);
  const [newTeamIndex, setNewTeamIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbInstance, setDbInstance] = useState<Database | null>(null);
  
  // Fetch DB instance
  useEffect(() => {
    const fetchDb = async () => {
      const db = await getDb();
      setDbInstance(db);
    };
    fetchDb();
  }, []);
  
  // Extract gameCode from URL query parameters or localStorage
  const searchParams = new URLSearchParams(location.search);
  const gameCode = searchParams.get('gameCode') || localStorage.getItem('adminGameCode'); // Use adminGameCode as fallback
  
  // If no gameCode, redirect (maybe to admin splash?)
  useEffect(() => {
    if (!gameCode) {
      setError('Game code missing.');
      // Optional: Redirect after a delay
      // setTimeout(() => navigate('/admin'), 1500);
    } else {
      // Ensure codes are set in localStorage if coming from URL
      localStorage.setItem('gameCode', gameCode);
      localStorage.setItem('adminGameCode', gameCode);
      localStorage.setItem('isAdmin', 'true');
    }
  }, [gameCode, navigate]);
  
  // Fetch teams data from Firebase
  useEffect(() => {
    if (!gameCode || !dbInstance) {
      setLoadingTeams(false); // Stop loading if no code or db
      return;
    }

    setLoadingTeams(true); // Start loading teams

    const teamsQuery = query(
      ref(dbInstance, 'teams'),
      orderByChild('gameCode'),
      equalTo(gameCode)
    );

    const unsubscribe = onValue(teamsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.val();
        // Filter teams that are marked as active (if isActive exists)
        const teamsArray = Object.values(teamsData).filter((team: any) => team.isActive !== false) as Team[];
        setTeams(teamsArray);
      } else {
        setTeams([]);
      }
      setLoadingTeams(false); // Stop loading teams after fetching
    });

    return () => unsubscribe();
  }, [gameCode, dbInstance]);
  
  // Track when new teams join to trigger animations
  useEffect(() => {
    if (teams.length > previousTeamsCount) {
      setNewTeamIndex(teams.length - 1);
      const timer = setTimeout(() => {
        setNewTeamIndex(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setPreviousTeamsCount(teams.length);
  }, [teams.length, previousTeamsCount]);
  
  // Handle removing a team (logically - set isActive to false)
  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (!dbInstance || !window.confirm(`Da li ste sigurni da želite da izbacite tim ${teamName}?`)) return;

    try {
      // Instead of removing, mark as inactive
      await updateTeam(teamId, { isActive: false });
      console.log(`Team ${teamName} marked as inactive.`);
      // Listener will update the UI by filtering inactive teams
    } catch (err) {
      console.error(`Error removing team ${teamName}:`, err);
      alert('Failed to remove team. Please check the console.');
    }
  };

  // Handle starting the game
  const handleStartGame = async () => {
    if (!gameCode || !dbInstance || loading) return;
    if (teams.length < 1) { // Keep check for min teams
      setError('Potreban je bar jedan tim da bi igra počela.');
      return;
    }

    setLoading(true); // Start loading indicator for game start action
    setError(null);
    try {
      console.log(`LobbyPage: Starting game with code ${gameCode}`);

      // Set status to 'question_display'
      console.log(`LobbyPage: Setting game status to question_display`);
      await setFirebaseGameStatus(gameCode, 'question_display');

      // Navigate to the question page
      navigate(`/admin/question?gameCode=${gameCode}`);
    } catch (err: any) {
      console.error('Error starting game:', err);
      setError(`Error starting game: ${err.message}`);
    } finally {
       setLoading(false); // Stop loading indicator regardless of outcome
    }
  };
  
  return (
    // Main container using flex column to push button to bottom
    <div className="min-h-screen h-screen bg-primary p-6 md:p-8 flex flex-col relative overflow-hidden">
      <AnimatedBackground density="medium" color="primary" />
      
      {/* Top Bar Container - Balanced spacing */}
      <div className="absolute top-0 w-full flex justify-between items-center px-6 md:px-8 z-40">
        {/* Logo with proper padding */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-2"
        >
          {/* Keep logo size */}
          <Logo size="large" className="w-24 h-24 md:w-48 md:h-48" onClick={() => navigate('/admin')} />
        </motion.div>

        {/* Lobby Title at top-right with balanced spacing */}
        <motion.div
          className="text-right pr-2"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
           <h2 className="text-2xl md:text-4xl font-bold text-accent font-serif"></h2>
        </motion.div>
      </div>
      
      
      {/* Header Section - Inspired by Kahoot - Repositioned and Resized */}
      <motion.div 
        // Adjusted padding (pt, pb) and margin-top (mt)
        className="w-full max-w-3xl mx-auto text-center py-6 md:py-8 z-30 bg-secondary/10 backdrop-blur-sm rounded-lg shadow-lg border border-secondary/30 mt-4 md:mt-6" 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Increased font sizes */}
        <p className="text-lg md:text-xl text-accent/90 mb-2">Posetite <span className="font-bold text-white">fonis-kviz.vercel.app</span></p>
        <p className="text-2xl md:text-3xl text-accent mb-3">Kod igre:</p>
        {/* Increased font size and adjusted padding */}
        <div className="text-6xl md:text-8xl font-bold text-white tracking-widest font-caviar mb-4 bg-secondary py-2 px-4 rounded inline-block shadow-md">
          {gameCode || '...'}
        </div>
        {/* Increased font size */}
        <p className="text-accent/70 text-sm md:text-base">Čekamo ostale timove...</p>
      </motion.div>
      
      {/* "Broj timova" Title - Repositioned */}
      <motion.h1 
        className="text-xl md:text-2xl text-accent font-semibold font-serif text-center my-4 md:my-6 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Broj timova: ({teams.length})
      </motion.h1>
      
      {/* Teams Grid Area - Takes up remaining space, ensures no scroll on main page */}
      <div className="flex-grow max-w-6xl w-full mx-auto mb-4 relative z-30 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-secondary/50 scrollbar-track-primary/50" style={{ minHeight: '150px' }}> {/* Added min-height */}
        {loadingTeams ? (
          <motion.div className="text-center text-accent text-lg mt-10">
            Učitavanje timova...
          </motion.div>
        ) : !loadingTeams && teams.length === 0 ? (
          <motion.div
            className="bg-accent/10 p-6 rounded-lg text-center mt-10 border border-accent/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-accent text-lg">Nijedan tim se još nije priključio.</p>
            <p className="text-accent/70 mt-1 text-sm">Podelite kod igre sa igračima.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
            <AnimatePresence mode="popLayout">
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  className={`bg-accent/90 p-6 rounded-lg shadow-lg flex flex-col items-center relative group border-2 border-transparent cursor-pointer
                    ${newTeamIndex === index ? 'ring-4 ring-highlight ring-opacity-80 border-highlight' : 'hover:border-secondary/50'}`}
                    style={{ minHeight: '180px'}} // Ensure consistent height for cards
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: newTeamIndex === index ? [1, 1.05, 1] : 1, 
                    y: 0,
                    transition: {
                      scale: newTeamIndex === index ? { 
                        duration: 0.8, 
                        repeat: 2, 
                        repeatType: "reverse" 
                      } : undefined
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: -20, 
                    transition: { duration: 0.3, ease: "easeInOut" } 
                  }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  layout="position"
                  layoutId={team.id}
                >
                  {/* Remove Button (Improved Padding) */}
                  <motion.button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveTeam(team.id, team.name); }}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title={`Izbaci ${team.name}`}
                  >
                    ×
                  </motion.button>
                  
                  {/* Increased Mascot Size */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-3 overflow-hidden p-2 bg-white/30 rounded-full shadow-inner">
                    <img
                      src={getMascotImageUrl(team.mascotId)} // Use helper
                      alt={`Team Mascot`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = getMascotImageUrl(undefined); // Use helper for default
                      }}
                    />
                  </div>
                  {/* Ensure text fits */}
                  <h3 className="text-center font-bold text-primary text-base md:text-lg truncate w-full px-1">
                    {team.name}
                  </h3>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Start Game Button - Increased size and centered, uses flex for bottom placement */}
      <motion.div 
        className="w-full flex justify-center items-center mt-auto pt-4 pb-6 z-40 px-4" // Adjusted padding
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-md mb-4 text-center absolute bottom-28 left-1/2 transform -translate-x-1/2 w-11/12 max-w-lg" // Adjusted bottom position
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        <motion.button
          onClick={handleStartGame}
          disabled={loading || loadingTeams || teams.length === 0}
          className={`bg-secondary hover:bg-opacity-90 text-white font-bold 
                     py-5 px-12 md:py-6 md:px-20 text-xl md:text-3xl rounded-lg shadow-xl 
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed font-caviar uppercase tracking-wider border-2 border-transparent hover:border-white/50`}
          whileHover={{ scale: 1.05, transition: {duration: 0.2} }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'STARTUJEM...' : 'Startuj Kviz'}
        </motion.button>
      </motion.div>

      {/* Add DevTools only if gameCode exists */}
      {gameCode && localStorage.getItem('isAdmin') === 'true' && (
        <DevTools gameCode={gameCode} />
      )}
    </div>
  );
};

export default LobbyPage;