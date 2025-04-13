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

  // Helper function to get rank text
  const getRankText = (rank: number, total: number) => {
    if (rank === 1) return `Osvojili ste prvo mesto od ${total} timova!`;
    if (rank === 2) return `Osvojili ste drugo mesto od ${total} timova!`;
    if (rank === 3) return `Osvojili ste treće mesto od ${total} timova!`;
    
    return `Osvojili ste ${rank}. mesto od ${total} timova.`;
  };

  useEffect(() => {
    if (!gameCode || !teamId) {
      setError("Nedostaje kod igre ili ID tima. Preusmeravanje...");
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
        setError(`Greška pri učitavanju finalnih rezultata: ${err.message}`);
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
          <p className="text-lg font-bold mb-2">Greška</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-accent underline"
        >
          Nazad na Početnu
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex flex-col items-center">
      <AnimatedBackground density="low" />
      
      {/* Logo at top center - BIGGER */}
      <div className="w-full flex justify-center pt-6 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="large" className="w-44 h-44 md:w-52 md:h-52 mb-4 ml-10" />
        </motion.div>
      </div>
      
      {/* Team Name Display - improved layout */}
      
      
      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center w-full flex-grow max-w-xl">
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
            className="text-center z-30 bg-secondary/30 p-8 rounded-2xl backdrop-blur-sm shadow-lg border border-accent/20 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mascot & Trophy/Rank */} 
            <motion.div
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }} 
              className="relative mx-auto mb-8 w-40 h-40"
            >
              {/* Trophy or Rank Badge */}
              {teamScore.rank === 1 ? (
                <div className="absolute -top-4 -right-4 z-10">
                  <svg 
                    className="w-20 h-20 text-yellow-400 filter drop-shadow-lg" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fillRule="evenodd" d="M10 1l2.928 6.378 6.538.95-4.733 4.908 1.12 6.765L10 16.844l-5.853 3.157 1.12-6.765L.533 8.328l6.538-.95L10 1z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className={`absolute -top-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 shadow-md z-10
                    ${teamScore.rank === 2 ? 'bg-gray-300 border-gray-200 text-gray-800' : 
                      teamScore.rank === 3 ? 'bg-amber-600 border-amber-500 text-amber-100' : 
                      'bg-accent/80 border-accent/50 text-primary'}
                `}>
                  {teamScore.rank}
                </div>
              )}
              
              {/* Mascot Image */}
              <img 
                src={getMascotImageUrl(teamScore.mascotId)} 
                alt={`${teamScore.name} mascot`} 
                className="w-full h-full rounded-full object-cover bg-accent/20 border-6 border-secondary/50 shadow-lg"
              />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-6 font-serif text-accent">
              Rezultati kviza
            </h1>
            
            <div className="bg-secondary/20 rounded-xl p-6 mb-8 border border-accent/30 shadow-inner">
              <p className="text-2xl text-accent/90 mb-4 font-serif">
                {getRankText(teamScore.rank, teamScore.totalTeams)}
              </p>
              
              {teamScore.rank === 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="text-6xl mb-2"
                >
                  🏆
                </motion.div>
              )}
            </div>
            
            <motion.div
              className="mt-4 bg-accent/20 p-5 rounded-xl border border-accent/30 shadow-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-accent text-xl mb-2">Ukupan rezultat</div>
              <div className="text-4xl font-bold text-accent">
                {teamScore.totalScore} poena
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAgain}
              className="mt-10 bg-accent/90 hover:bg-accent text-primary font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Igraj ponovo
            </motion.button>
          </motion.div>
        )}
      </div>
      
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 text-xs text-accent/30 z-40">
        Status: {game?.status || (gameLoading ? 'učitavanje...' : 'nepoznato')}
      </div>
    </div>
  );
};

export default PlayerFinishedPage; 