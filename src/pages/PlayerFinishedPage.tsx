import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Game, Team } from '../lib/firebase'; // Only need Game, Team types
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState'; // Import hook
import { Button } from '../components/ui/button';

interface TeamScore extends Team {
  rank: number;
  totalTeams: number;
}

const PlayerFinishedPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Keep local loading for rank calculation
  const [teamScore, setTeamScore] = useState<TeamScore | null>(null);
  
  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  const gameCode = localStorage.getItem('gameCode');
  
  // Use the real-time hook
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  useEffect(() => {
    if (!gameCode || !teamId) {
      setError("Missing game code or team ID. Redirecting...");
      setTimeout(() => navigate('/player'), 1500);
      return;
    }

    if (gameLoading || gameError || !game) {
      setLoading(true); // Set loading true while waiting for game data
      return;
    }

    // Check if game status indicates it has ended
    if (game.status !== 'game_end' && game.status !== 'finished') {
      console.log('PlayerFinishedPage: Game not finished yet. Status:', game.status);
      // Optional: Navigate back to appropriate screen if somehow landed here early
      // navigate('/player/score'); // Or based on actual status
      // For now, just prevent score calculation if game isn't over
      setLoading(false);
      return;
    }

    // Calculate final score and rank
    try {
      // Get all teams and sort by points
      if (!game.teams) {
        setError("Team data not found in game.");
        setLoading(false);
        return;
      }
      const teamsArray = Object.entries(game.teams)
        .map(([id, team]) => ({ ...team, id }))
        .sort((a, b) => b.points - a.points);

      // Find current team's index
      const teamIndex = teamsArray.findIndex(t => t.id === teamId);
      if (teamIndex === -1) {
        setError("Your team was not found in the final game data.");
        setLoading(false);
        return;
      }

      const team = teamsArray[teamIndex];

      // Calculate rank (handle ties - same logic as PlayerScorePage)
      let rank = 1;
      if (teamIndex > 0) {
        for (let i = 0; i < teamIndex; i++) {
          if (teamsArray[i].points > team.points) {
            rank = i + 2;
          } else if (teamsArray[i].points === team.points) {
            rank = teamsArray.findIndex(t => t.points === team.points) + 1;
            break;
          }
        }
      }

      setTeamScore({
        ...team,
        rank,
        totalTeams: teamsArray.length
      });
      setError(null);
    } catch (err: any) {
      console.error("Error calculating final score/rank:", err);
      setError(`Error calculating final score: ${err.message}`);
    } finally {
      setLoading(false);
    }

  }, [game, gameLoading, gameError, gameCode, teamId, navigate]);

  const handlePlayAgain = () => {
    localStorage.removeItem('teamId');
    localStorage.removeItem('teamName');
    localStorage.removeItem('gameCode');
    navigate('/');
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
          onClick={() => navigate('/')}
          className="mt-4 text-accent underline"
        >
          Return to Home
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
      
      {/* Team Name Display */}
      <motion.div
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Team: {teamName}
      </motion.div>
      
      {/* Final Score Display */}
      <div className="h-full flex flex-col items-center justify-center">
        {loading || gameLoading ? (
          <motion.div
            className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ) : teamScore && (
          <motion.div
            className="text-center z-30 bg-secondary/20 p-8 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center"
            >
              <span className="text-6xl font-bold text-accent">
                {teamScore.rank}
              </span>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-accent mb-2">
              Vaša finalna pozicija
            </h2>
            
            <p className="text-accent/80 mb-6">
              od ukupno {teamScore.totalTeams} {teamScore.totalTeams === 1 ? 'tima' : 'timova'}
            </p>
            
            <div className="text-4xl font-bold text-accent mb-4">
              {teamScore.points}
              <span className="text-xl ml-2">poena</span>
            </div>
            
            {/* Play Again Button */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handlePlayAgain}
                className="bg-accent hover:bg-accent/80 text-white px-8 py-4 text-lg"
              >
                Igraj Ponovo
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlayerFinishedPage; 