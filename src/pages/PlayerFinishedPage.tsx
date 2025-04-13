import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Team, getTeam, getAllScoresForGame, getTeamsForGame } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Button } from '../components/ui/button';
import { getMascotImageUrl } from '../lib/utils';

// Interface for display
interface FinalTeamScore extends Team {
  rank: number;
  totalScore: number;
  totalTeams: number;
}

const PlayerFinishedPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamScore, setTeamScore] = useState<FinalTeamScore | null>(null);
  
  // Get team data from localStorage
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName'); // Keep for display while loading
  const gameCode = localStorage.getItem('gameCode');
  
  // Use the real-time hook (still useful for status check)
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);

  useEffect(() => {
    if (!gameCode || !teamId) {
      setError("Missing game code or team ID. Redirecting...");
      setTimeout(() => navigate('/player'), 1500);
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

    // Check if game status is appropriate
    if (game && game.status !== 'game_end' && game.status !== 'finished') {
      console.log('PlayerFinishedPage: Game not finished yet. Status:', game.status);
      setError("Kviz još nije završen.");
      setLoading(false);
      return;
    }

    // Fetch final results independently
    const fetchFinalResults = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('PlayerFinishedPage: Fetching final scores and team data...');
        const [allScores, allTeamsDetails, thisTeamDetails] = await Promise.all([
          getAllScoresForGame(gameCode),
          getTeamsForGame(gameCode), // Get all teams for ranking
          getTeam(teamId)            // Get this specific team details
        ]);

        console.log('PlayerFinishedPage: Fetched Scores:', allScores);
        console.log('PlayerFinishedPage: Fetched All Teams:', allTeamsDetails);
        console.log('PlayerFinishedPage: Fetched This Team:', thisTeamDetails);

        if (!thisTeamDetails) {
           setError("Vaš tim nije pronađen u podacima igre.");
           setLoading(false);
           return;
        }

        if (!allTeamsDetails || allTeamsDetails.length === 0) {
           setError("Nema podataka o timovima za rangiranje.");
           setLoading(false);
           return;
        }
        
        // Filter active teams and combine with scores for ranking
        const activeTeamsWithScores = allTeamsDetails
           .filter(team => team.isActive !== false)
           .map(team => ({
               ...team,
               totalScore: allScores[team.id]?.totalScore || 0
           }))
           .sort((a, b) => b.totalScore - a.totalScore);

        // Find rank of the current team
        let rank = 1;
        const teamIndex = activeTeamsWithScores.findIndex(t => t.id === teamId);
        
        if (teamIndex === -1) {
             // Should not happen if thisTeamDetails was found, but handle anyway
            setError("Vaš tim nije pronađen u rang listi aktivnih timova.");
            setLoading(false);
            return;
        }
        
        const currentTeamScore = activeTeamsWithScores[teamIndex].totalScore;
        // More precise rank calculation (handles ties)
        rank = activeTeamsWithScores.filter(t => t.totalScore > currentTeamScore).length + 1;

        setTeamScore({
          ...thisTeamDetails, // Use directly fetched details
          rank,
          totalScore: currentTeamScore,
          totalTeams: activeTeamsWithScores.length
        });

      } catch (err: any) {
        console.error("Error fetching/calculating final player result:", err);
        setError(`Error fetching final result: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Trigger fetch only when appropriate status is confirmed
    if (game && (game.status === 'game_end' || game.status === 'finished')) {
      fetchFinalResults();
    } else if (!game && !gameLoading) { // Check gameLoading here
      setError("Učitavanje podataka o igri nije uspelo.");
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
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex flex-col items-center justify-center">
      <AnimatedBackground density="low" />
      
      {/* Logo */}
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
        className="absolute top-6 right-6 bg-secondary text-white px-4 py-2 rounded-lg font-bold z-40 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Tim: {teamName || '...'} {/* Show name from localStorage while loading */}
      </motion.div>
      
      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center w-full flex-grow">
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
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center mx-auto">
            <p className="text-lg font-bold mb-2">Greška</p>
            <p>{displayError}</p>
             <button 
              onClick={() => navigate('/')}
              className="mt-4 text-accent underline"
            >
              Nazad na Početnu
            </button>
          </div>
        )}
        
        {/* Final Score Display */}
        {!loading && !displayError && teamScore && (
          <motion.div
            className="text-center z-30 bg-secondary/10 p-8 rounded-2xl backdrop-blur-sm shadow-lg border border-accent/20 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mascot & Rank */} 
            <motion.div
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }} 
              className="relative mx-auto mb-6 w-36 h-36"
            >
              {/* Rank Badge */}
              <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 shadow-md
                  ${teamScore.rank === 1 ? 'bg-yellow-400 border-yellow-300 text-yellow-900' : 
                    teamScore.rank === 2 ? 'bg-gray-300 border-gray-200 text-gray-800' : 
                    teamScore.rank === 3 ? 'bg-amber-600 border-amber-500 text-amber-100' : 
                    'bg-accent/80 border-accent/50 text-primary'}
              `}>
                {teamScore.rank}
              </div>
              {/* Mascot Image */}
              <img 
                src={getMascotImageUrl(teamScore.mascotId)} 
                alt={`${teamScore.name} mascot`} 
                className="w-full h-full rounded-full object-cover bg-accent/20 border-4 border-secondary/50 shadow-lg"
              />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-accent mb-2 font-serif">
              Vaša finalna pozicija
            </h2>
            
            <p className="text-accent/80 mb-6">
              {teamScore.rank}. mesto od ukupno {teamScore.totalTeams} {teamScore.totalTeams === 1 ? 'tima' : 'timova'}
            </p>
            
            <div className="text-4xl font-bold text-accent mb-8">
              {teamScore.totalScore}
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
                className="w-full bg-accent hover:bg-accent/90 text-primary px-8 py-4 text-lg font-bold shadow-lg"
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