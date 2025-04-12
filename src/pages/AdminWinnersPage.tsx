import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Game, Team } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Button } from '../components/ui/button';

interface TeamScore extends Team {
  rank: number;
}

const AdminWinnersPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamScore[]>([]);

  // Get game code from localStorage
  const gameCode = localStorage.getItem('gameCode');
  
  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);
  
  useEffect(() => {
    if (!gameCode) {
      setError("Missing game code. Redirecting...");
      setTimeout(() => navigate('/admin'), 1500);
      return;
    }

    if (gameLoading || gameError || !game) {
      setLoading(true);
      return;
    }

    // Check if status is appropriate for this page
    if (game.status !== 'game_end' && game.status !== 'finished') {
      console.log('AdminWinnersPage: Game not finished yet. Status:', game.status);
      setLoading(false);
      return;
    }

    console.log('AdminWinnersPage: Calculating final ranks...');
    try {
      // Transform teams into array and sort by points
      if (!game.teams) {
        setError("Team data missing.");
        setLoading(false);
        return;
      }
      const teamsArray = Object.entries(game.teams)
        .map(([id, team]) => ({
          ...team,
          id,
          rank: 0 // Will be calculated below
        }))
        .sort((a, b) => b.points - a.points);

      // Calculate ranks (handle ties - same logic as PlayerScorePage/AdminLeaderboardPage)
      if (teamsArray.length > 0) {
        let currentRank = 1;
        let previousPoints = teamsArray[0].points;

        teamsArray.forEach((team, index) => {
          if (index > 0 && team.points < previousPoints) {
            currentRank = index + 1;
            previousPoints = team.points;
          }
          team.rank = currentRank;
        });
      }

      setTeams(teamsArray);
      setError(null);
    } catch (err: any) {
      console.error("Error calculating final ranks:", err);
      setError(`Error calculating final ranks: ${err.message}`);
    } finally {
      setLoading(false);
    }

  }, [game, gameLoading, gameError, gameCode, navigate]);
  
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
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
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
      <div className="max-w-4xl mx-auto pt-24">
        <motion.h1
          className="text-4xl font-bold text-accent text-center mb-8 font-serif"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Finalni Rezultati
        </motion.h1>
        
        {loading || gameLoading ? (
          <motion.div
            className="w-16 h-16 mx-auto border-4 border-accent rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ) : (
          <motion.div
            className="space-y-4"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                className={`bg-secondary/20 backdrop-blur-sm p-6 rounded-lg flex items-center
                  ${index === 0 ? 'bg-yellow-500/20' : ''}
                  ${index === 1 ? 'bg-gray-400/20' : ''}
                  ${index === 2 ? 'bg-amber-700/20' : ''}`}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 }
                }}
              >
                <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-accent">
                  {team.rank}
                </div>
                <div className="flex-1 ml-4">
                  <h3 className="text-xl font-bold text-accent">{team.name}</h3>
                  <p className="text-accent/80">Tim ID: {team.id}</p>
                </div>
                <div className="text-3xl font-bold text-accent">
                  {team.points}
                </div>
              </motion.div>
            ))}
            
            {/* New Game Button */}
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleNewGame}
                className="bg-accent hover:bg-accent/80 text-white px-8 py-4 text-lg"
              >
                Nova Igra
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminWinnersPage; 