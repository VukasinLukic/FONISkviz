import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, updateTeam, setGameStatus as setFirebaseGameStatus, GameStatus, getDb } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { onValue, ref, remove, query, orderByChild, equalTo, Database } from 'firebase/database';
import MainButton from '../components/MainButton';
import DevTools from '../components/DevTools';

const LobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
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
  
  // Extract gameCode from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const gameCode = searchParams.get('gameCode');
  
  // If no gameCode in URL, redirect (maybe to admin splash?)
  useEffect(() => {
    if (!gameCode) {
      setError('Game code missing from URL.');
      // Consider navigating back to admin splash screen
      // navigate('/admin');
    } else {
      localStorage.setItem('gameCode', gameCode);
      localStorage.setItem('adminGameCode', gameCode);
      localStorage.setItem('isAdmin', 'true');
    }
  }, [gameCode, navigate]);
  
  // Fetch teams data from Firebase
  useEffect(() => {
    if (!gameCode || !dbInstance) {
      // Don't set error here if already set by previous effect
      setLoading(false); // Stop loading if no code or db
      return;
    }

    setLoading(true); // Start loading when code and db are available

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
      setLoading(false); // Stop loading after fetching
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
    if (!gameCode || !dbInstance) return;
    if (teams.length < 1) { // Keep check for min teams
      setError('Potreban je bar jedan tim da bi igra počela.');
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  // Get the correct path for mascot images
  const getMascotPath = (mascotId: number) => {
    return `/assets/maskota${mascotId || 1} 1.svg`; // Default to 1 if null/undefined
  };
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
      <AnimatedBackground density="high" />
      
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" onClick={() => navigate('/admin')} />
      </motion.div>
      
      {/* Game Code Display */}
      {gameCode && (
        <motion.div
          className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Game Code: {gameCode}
        </motion.div>
      )}
      
      {/* Header */}
      <div className="text-center pt-20 pb-8 relative z-30">
        <motion.h1 
          className="text-4xl text-accent font-bold font-serif"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          LOBBY
        </motion.h1>
        <motion.p
          className="text-accent opacity-80 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? "Loading teams..." :
            teams.length === 0
              ? "Waiting for teams to join..."
              : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'} in the lobby`}
        </motion.p>
      </div>
      
      {/* Teams Grid */}
      <div className="max-w-4xl mx-auto mb-24 relative z-30">
        {loading && teams.length === 0 ? (
          <motion.div className="text-center text-accent">
            Loading...
          </motion.div>
        ) : !loading && teams.length === 0 ? (
          <motion.div
            className="bg-accent/20 p-8 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-accent text-xl">Nijedan tim se još nije priključio</p>
            <p className="text-accent/70 mt-2">Podelite kod igre sa igračima</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  className={`bg-accent p-4 rounded-lg shadow-md flex flex-col items-center relative group
                    ${newTeamIndex === index ? 'ring-4 ring-highlight ring-opacity-70' : ''}`}
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
                  {/* Remove Button (Visible on hover) */}
                  <motion.button 
                    onClick={() => handleRemoveTeam(team.id, team.name)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={`Izbaci ${team.name}`}
                  >
                    ×
                  </motion.button>
                  
                  <div className="w-20 h-20 mb-2 overflow-hidden">
                    <img
                      src={getMascotPath(team.mascotId)}
                      alt={`Team Mascot`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = "/assets/maskota1 1.svg";
                      }}
                    />
                  </div>
                  <h3 className="text-center font-bold text-primary truncate max-w-full px-2">
                    {team.name}
                  </h3>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Start Game Button */}
      <motion.div 
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-md mb-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        <MainButton
          onClick={handleStartGame}
          disabled={loading || teams.length === 0}
          className={`w-full py-4 text-lg ${(loading || teams.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Starting Game...' : 'Start Game'}
        </MainButton>
      </motion.div>

      {/* Add DevTools only if gameCode exists */}
      {gameCode && localStorage.getItem('isAdmin') === 'true' && (
        <DevTools gameCode={gameCode} />
      )}
    </div>
  );
};

export default LobbyPage;