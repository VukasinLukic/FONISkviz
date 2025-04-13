import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Game, Team, getAllScoresForGame, getTeamsForGame, TeamScore as FirebaseTeamScore } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Button } from '../components/ui/button';
import { getMascotImageUrl } from '../lib/utils';

// Combined interface for display
interface RankedTeam extends Team {
  rank: number;
  totalScore: number;
}

const AdminWinnersPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankedTeams, setRankedTeams] = useState<RankedTeam[]>([]);

  // Get game code from localStorage
  const gameCode = localStorage.getItem('gameCode');
  
  // Use the real-time hook (still useful for status check)
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);
  
  useEffect(() => {
    if (!gameCode) {
      setError("Missing game code. Redirecting...");
      setTimeout(() => navigate('/admin'), 1500);
      return;
    }

    // Wait for the game hook to finish loading
    if (gameLoading) {
      setLoading(true);
      return;
    }

    // Handle error from game hook
    if (gameError) {
      setError(gameError.message);
      setLoading(false);
      return;
    }

    // Check if game status is appropriate, even if game data might be slightly delayed
    if (game && game.status !== 'game_end' && game.status !== 'finished') {
      console.log('AdminWinnersPage: Game not finished yet. Status:', game.status);
      // Possibly redirect or show a waiting message if needed
      setError("Kviz još nije završen.");
      setLoading(false);
      return;
    }

    // Fetch final scores and team data independently
    const fetchFinalResults = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('AdminWinnersPage: Fetching final scores and team data...');
        const [allScores, allTeams] = await Promise.all([
          getAllScoresForGame(gameCode),
          getTeamsForGame(gameCode)
        ]);

        console.log('AdminWinnersPage: Fetched Scores:', allScores);
        console.log('AdminWinnersPage: Fetched Teams:', allTeams);

        if (!allTeams || allTeams.length === 0) {
          // Handle case with no teams (might occur in edge cases)
          setRankedTeams([]);
          setError("Nema timova za prikaz.");
          setLoading(false);
          return;
        }

        // Combine data and calculate ranks
        const teamsWithScores = allTeams
          .filter(team => team.isActive !== false) // Consider only active teams
          .map(team => ({
            ...team,
            totalScore: allScores[team.id]?.totalScore || 0 // Get score, default to 0
          }))
          .sort((a, b) => b.totalScore - a.totalScore); // Sort by final score

        const finalRankedTeams: RankedTeam[] = [];
        if (teamsWithScores.length > 0) {
          let currentRank = 1;
          let previousPoints = teamsWithScores[0].totalScore;
          teamsWithScores.forEach((team, index) => {
            if (index > 0 && team.totalScore < previousPoints) {
              currentRank = index + 1;
              previousPoints = team.totalScore;
            }
            finalRankedTeams.push({ ...team, rank: currentRank });
          });
        }
        
        console.log('AdminWinnersPage: Final Ranked Teams:', finalRankedTeams);
        setRankedTeams(finalRankedTeams);

      } catch (err: any) {
        console.error("Error fetching/calculating final results:", err);
        setError(`Error fetching results: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Trigger fetch only when appropriate status is confirmed
    if (game && (game.status === 'game_end' || game.status === 'finished')) {
      fetchFinalResults();
    } else if (!game && !gameLoading) {
        // If game data is still null after loading, maybe fetch anyway or show specific error
        // For now, let's attempt fetch if status seems right (risky without hook confirmation)
        console.warn("AdminWinnersPage: Game data from hook is null, but attempting fetch based on localStorage code.");
        // fetchFinalResults(); // Or set error: setError("Could not load game data."); setLoading(false);
        setError("Učitavanje podataka o igri nije uspelo.");
        setLoading(false);
    }

  }, [game, gameLoading, gameError, gameCode, navigate]); // Rerun when game hook state changes
  
  const handleNewGame = () => {
    localStorage.removeItem('gameCode');
    navigate('/admin');
  };
  
  // Combine local and hook errors
  const displayError = error || gameError?.message;

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Error</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 text-accent underline"
        >
          Return to Admin Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex flex-col items-center">
      <AnimatedBackground density="low" />
      
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" />
      </motion.div>
      
      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto pt-24 pb-24 flex flex-col items-center flex-grow">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-accent text-center mb-10 font-serif"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Finalni Rezultati
        </motion.h1>
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
        
        {/* Error State */}
        {!loading && displayError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center mx-auto my-10">
              <p className="text-lg font-bold mb-2">Greška</p>
              <p>{displayError}</p>
            </div>
        )}
        
        {/* Results Display */}
        {!loading && !displayError && (
          <motion.div
            className="space-y-4 w-full"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {rankedTeams.length === 0 ? (
              <div className="text-center text-accent/80 py-10 text-lg">
                Nema timova za prikaz rang liste.
              </div>
            ) : (
              rankedTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  className={`bg-secondary/10 backdrop-blur-sm p-4 rounded-lg flex items-center shadow-md border border-transparent
                    ${index === 0 ? 'border-yellow-400/70 bg-yellow-500/10 shadow-yellow-500/10' : ''}
                    ${index === 1 ? 'border-gray-400/70 bg-gray-400/10' : ''}
                    ${index === 2 ? 'border-amber-600/70 bg-amber-700/10' : ''}
                    ${index >= 3 ? 'border-secondary/30' : ''}`
                  }
                  variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                >
                  {/* Rank Number */}
                  <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl font-bold mr-4 rounded-full 
                    ${index === 0 ? 'bg-yellow-500/30 text-yellow-200' : 
                      index === 1 ? 'bg-gray-400/30 text-gray-200' : 
                      index === 2 ? 'bg-amber-700/30 text-amber-200' : 
                      'bg-accent/20 text-accent'}
                  `}>
                    {team.rank}
                  </div>
                  
                  {/* Mascot */}
                  <img 
                    src={getMascotImageUrl(team.mascotId)} 
                    alt={`${team.name} mascot`} 
                    className="w-12 h-12 mr-4 flex-shrink-0 rounded-full object-cover border-2 border-accent/30 shadow-sm"
                  />
                  
                  {/* Team Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-accent truncate" title={team.name}>{team.name}</h3>
                    {/* <p className="text-accent/60 text-xs truncate">ID: {team.id}</p> */}
                  </div>
                  
                  {/* Score */}
                  <div className="text-2xl md:text-3xl font-bold text-accent ml-4 whitespace-nowrap">
                    {team.totalScore} pts
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
      
      {/* New Game Button - Positioned at the bottom */}
      {!loading && (
          <motion.div
              className="w-full max-w-md mt-auto pb-8 z-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
            <Button
              onClick={handleNewGame}
              className="w-full bg-accent hover:bg-accent/90 text-primary px-8 py-4 text-lg font-bold shadow-lg"
            >
              Započni Novu Igru
            </Button>
          </motion.div>
      )}
    </div>
  );
};

export default AdminWinnersPage; 