import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Game, Team, getAllScoresForGame, getTeamsForGame, TeamScore as FirebaseTeamScore, getAllAnswersForGame, getGameData } from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';
import { Button } from '../components/ui/button';
import { getMascotImageUrl } from '../lib/utils';
import JSConfetti from 'js-confetti';

// Extended TeamScore interface to include answers property
interface ExtendedTeamScore extends FirebaseTeamScore {
  answers?: Record<string, { isCorrect: boolean, [key: string]: any }>;
}

// Interface for ranked teams (extended with stats)
interface RankedTeam extends Team {
  rank: number;
  totalScore: number;
  totalQuestions: number; // Total questions in the quiz
  correctAnswers: number; // Number of correct answers by the team
  accuracy: number; // Calculated accuracy percentage
  averageResponseTime?: number; // Optional average time
}

const AdminWinnersPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankedTeams, setRankedTeams] = useState<RankedTeam[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);
  const [statsView, setStatsView] = useState<'podium' | 'table'>('podium');
  const [winningTeam, setWinningTeam] = useState<RankedTeam | null>(null);

  // Get game code from localStorage
  const gameCode = localStorage.getItem('gameCode');
  
  // Use the real-time hook (still useful for status check)
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);
  
  // Confetti effect
  useEffect(() => {
    if (!loading && !displayError && rankedTeams.length > 0 && !showConfetti) {
      const jsConfetti = new JSConfetti();
      
      // First wave of confetti
      jsConfetti.addConfetti({
        emojis: ['🏆', '🎉', '🥇', '🥈', '🥉', '⭐'],
        emojiSize: 30,
        confettiNumber: 80,
      });
      
      // Second wave after a delay
      setTimeout(() => {
        jsConfetti.addConfetti({
          confettiColors: ['#FFD700', '#C0C0C0', '#CD7F32', '#E67E50', '#FFFFFF'],
          confettiNumber: 100,
        });
      }, 1500);
      
      setShowConfetti(true);
    }
  }, [loading, rankedTeams, showConfetti]);

  useEffect(() => {
    if (!gameCode) {
      setError("Missing game code. Redirecting...");
      setTimeout(() => navigate('/admin'), 1500);
      return;
    }

    if (gameLoading) {
      setLoading(true);
      return;
    }

    if (gameError) {
      setError(gameError.message);
      setLoading(false);
      return;
    }

    if (game && (game.status === 'game_end' || game.status === 'finished')) {
      // Game is finished, fetch final results
    } else {
      setError("Kviz još nije završen.");
      setLoading(false);
      return; // Don't fetch results if game isn't finished
    }

    const fetchFinalResults = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('AdminWinnersPage: Fetching final results and all answers...');
        const [allScores, allTeamsDetails, allGameAnswers, gameDataSnapshot] = await Promise.all([
          getAllScoresForGame(gameCode),
          getTeamsForGame(gameCode),
          getAllAnswersForGame(gameCode), // Fetch all answers
          getGameData(gameCode) // Fetch game data for total questions
        ]);

        if (!gameDataSnapshot) {
          throw new Error("Ne mogu se dohvatiti podaci igre za ukupan broj pitanja.");
        }
        const totalQuestions = gameDataSnapshot.questionOrder?.length || 0;
        if (totalQuestions === 0) {
          console.warn("Ukupan broj pitanja je 0.");
        }

        console.log('AdminWinnersPage: Fetched Scores:', allScores);
        console.log('AdminWinnersPage: Fetched All Teams:', allTeamsDetails);
        console.log('AdminWinnersPage: Fetched All Answers:', allGameAnswers);

        if (!allTeamsDetails || allTeamsDetails.length === 0) {
           setError("Nema podataka o timovima za rangiranje.");
           setLoading(false);
           return;
        }

        // Filter active teams and combine with scores
        const activeTeamsWithScores = allTeamsDetails
           .filter(team => team.isActive !== false)
           .map(team => {
             // Calculate correct answers for this team
             let correctAnswers = 0;
             if (allGameAnswers) {
               Object.values(allGameAnswers).forEach((questionAnswers) => {
                 const teamAnswer = questionAnswers[team.id];
                 if (teamAnswer && teamAnswer.isCorrect === true) {
                   correctAnswers++;
                 }
               });
             }
             
             return {
               ...team,
               totalScore: allScores[team.id]?.totalScore || 0,
               correctAnswers, // Add calculated correct answers
               totalQuestions // Add total questions
             };
           })
           .sort((a, b) => b.totalScore - a.totalScore); // Sort by score

        // Assign ranks
        const rankedTeamsData: RankedTeam[] = activeTeamsWithScores.map((team, index, arr) => {
            let rank = 1;
            const currentScore = team.totalScore;
            // Calculate rank based on position in the sorted array (handling ties)
            rank = arr.filter(t => t.totalScore > currentScore).length + 1;
            // Calculate accuracy
            const accuracy = team.totalQuestions > 0 ? 
              Math.round((team.correctAnswers / team.totalQuestions) * 100) 
              : 0;
            
            return { ...team, rank, accuracy };
        });

        setRankedTeams(rankedTeamsData);
        setWinningTeam(rankedTeamsData.find(team => team.rank === 1) || null);

      } catch (err: any) {
        console.error("Error fetching/calculating final admin result:", err);
        setError(`Greška pri učitavanju finalnih rezultata: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalResults();

  }, [game, gameLoading, gameError, gameCode, navigate]); // Dependencies
  
  const handleNewGame = () => {
    localStorage.removeItem('gameCode');
    navigate('/admin');
  };
  
  // Combine local and hook errors
  const displayError = error || gameError?.message;

  // Top 3 teams and remaining teams
  const topThreeTeams = !loading && !displayError ? rankedTeams.filter(team => team.rank <= 3) : [];
  const remainingTeams = !loading && !displayError ? rankedTeams.filter(team => team.rank > 3) : [];

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Greška</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 text-accent underline"
        >
          Nazad na Admin stranu
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden flex flex-col items-center" ref={confettiRef}>
      <AnimatedBackground density="low" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-yellow-500/10 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-accent/10 blur-2xl"></div>
      </div>
      
      {/* Trophy icon at the top */}
      <motion.div
        className="absolute top-20 left-1/2 transform -translate-x-1/2 text-yellow-500 opacity-20 z-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Trophy SVG ikona uklonjena po zahtevu */}
      </motion.div>
      
      {/* Logo at top-left with balanced spacing */}
      <motion.div 
        className="absolute top-0 left-0 z-40 px-6 pt-2 ml-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo size="large" className="w-24 h-24 md:w-48 md:h-48" onClick={() => navigate('/admin')} />
      </motion.div>
      
      {/* Main Content */}
      <div className="max-w-6xl w-full mx-auto pt-28 pb-24 flex flex-col items-center flex-grow">
        <motion.h1
          className="text-5xl md:text-5xl font-bold text-accent text-center mb-4 font-serif"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          🏆 Finalni Rezultati 🏆
        </motion.h1>
        
        {winningTeam && (
          <motion.p
            className="text-xl md:text-6xl text-center text-white/80 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="font-bold text-yellow-400">{winningTeam.name}</span> je pobednik sa {winningTeam.totalScore} poena!
          </motion.p>
        )}
        
        {/* View toggle buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setStatsView('podium')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statsView === 'podium' 
                ? 'bg-accent text-white' 
                : 'bg-accent/20 text-accent hover:bg-accent/30'
            }`}
          >
            Podium
          </button>
          <button
            onClick={() => setStatsView('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statsView === 'table' 
                ? 'bg-accent text-white' 
                : 'bg-accent/20 text-accent hover:bg-accent/30'
            }`}
          >
            Tabela statistike
          </button>
        </div>
        
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
        
        {/* Results Display */}
        {!loading && !displayError && (
          <AnimatePresence mode="wait">
            {rankedTeams.length === 0 ? (
              <div className="text-center text-accent/80 py-10 text-lg">
                Nema timova za prikaz rang liste.
              </div>
            ) : statsView === 'podium' ? (
              <motion.div 
                key="podium"
                className="w-full bg-white/5 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-accent/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                {/* Podium Section */}
                <div className="flex flex-col items-center mb-12">
                  <h2 className="text-3xl font-bold text-accent mb-8 font-serif text-center">Pobednički Podijum</h2>
                  
                  {/* Animated stars */}
                  <div className="absolute inset-0 z-10 pointer-events-none overflow-visible">
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-yellow-500 text-5xl text-opacity-70"
                        initial={{ 
                          x: Math.random() * window.innerWidth, 
                          y: Math.random() * window.innerHeight,
                          scale: 0.5 + Math.random(),
                          opacity: 0.3 + Math.random() * 0.5
                        }}
                        animate={{
                          y: `-=${20 + Math.random() * 10}px`,
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.4, 1]
                        }}
                        transition={{
                          duration: 2 + Math.random() * 3,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: Math.random() * 5
                        }}
                      >
                        ★
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Top 3 Podium with improved animation - make it larger */}
                  <div className="flex justify-center items-end gap-4 md:gap-16 lg:gap-20 w-full max-w-5xl mx-auto mb-8 mt-12 px-2">
                    {/* Second Place */}
                    {topThreeTeams.find(team => team.rank === 2) && (
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        <div className="relative mb-2">
                          <motion.div 
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 border-4 border-gray-300 overflow-hidden"
                            whileHover={{ scale: 1.1, borderColor: '#a0a0a0' }}
                          >
                            <img 
                              src={getMascotImageUrl(topThreeTeams.find(team => team.rank === 2)?.mascotId || 1)} 
                              alt="Second place mascot" 
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                          <motion.div 
                            className="absolute bottom-0 right-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white text-lg font-bold"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 1.3, type: 'spring' }}
                          >
                            2
                          </motion.div>
                        </div>
                        <motion.div 
                          className="bg-gradient-to-b from-gray-100 to-gray-300 h-32 w-24 md:w-32 rounded-t-lg flex items-center justify-center shadow-md"
                          initial={{ height: 0 }}
                          animate={{ height: 128 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <div className="text-center px-2">
                            <p className="font-bold text-lg text-gray-800 truncate max-w-[80px] md:max-w-[100px]">
                              {topThreeTeams.find(team => team.rank === 2)?.name}
                            </p>
                            <div className="flex items-center justify-center gap-1 text-gray-700 font-semibold">
                              <span className="text-xl">{topThreeTeams.find(team => team.rank === 2)?.totalScore}</span>
                              <span className="text-xs">pts</span>
                            </div>
                          
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* First Place - Taller */}
                    {topThreeTeams.find(team => team.rank === 1) && (
                      <motion.div 
                        className="flex flex-col items-center -mb-6"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      >
                        <div className="relative mb-2">
                          <motion.div 
                            className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 border-4 border-yellow-400 overflow-hidden shadow-lg"
                            animate={{ 
                              boxShadow: ['0 0 10px 2px rgba(251, 191, 36, 0.5)', '0 0 20px 5px rgba(251, 191, 36, 0.8)', '0 0 10px 2px rgba(251, 191, 36, 0.5)']
                            }}
                            transition={{ 
                              repeat: Infinity,
                              duration: 2
                            }}
                            whileHover={{ scale: 1.1, borderColor: '#fcd34d' }}
                          >
                            <img 
                              src={getMascotImageUrl(topThreeTeams.find(team => team.rank === 1)?.mascotId || 1)} 
                              alt="First place mascot" 
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                          <motion.div 
                            className="absolute -top-6 -right-2 w-14 h-14"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.0, type: 'spring' }}
                          >
                            {/* Trophy SVG ikona uklonjena po zahtevu */}
                          </motion.div>
                          <motion.div 
                            className="absolute top-0 left-0 w-full h-full"
                            animate={{ 
                              background: ['radial-gradient(circle, rgba(251, 191, 36, 0) 70%, rgba(251, 191, 36, 0.5) 100%)', 
                                          'radial-gradient(circle, rgba(251, 191, 36, 0) 80%, rgba(251, 191, 36, 0.2) 100%)',
                                          'radial-gradient(circle, rgba(251, 191, 36, 0) 70%, rgba(251, 191, 36, 0.5) 100%)']
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        <motion.div 
                          className="bg-gradient-to-b from-yellow-300 to-yellow-400 h-40 w-28 md:w-36 rounded-t-lg flex items-center justify-center shadow-lg"
                          initial={{ height: 0 }}
                          animate={{ height: 160 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <div className="text-center px-2">
                            <p className="font-bold text-xl text-yellow-800 truncate max-w-[100px] md:max-w-[120px]">
                              {topThreeTeams.find(team => team.rank === 1)?.name}
                            </p>
                            <div className="flex items-center justify-center gap-1 text-yellow-800 font-semibold">
                              <span className="text-2xl">{topThreeTeams.find(team => team.rank === 1)?.totalScore}</span>
                              <span className="text-xs">pts</span>
                            </div>
                           
                            <motion.div 
                              className="mt-2 bg-yellow-500/30 rounded px-2 py-0.5 text-xs font-bold text-yellow-900"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.5 }}
                            >
                              ŠAMPION! 👑
                            </motion.div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Third Place */}
                    {topThreeTeams.find(team => team.rank === 3) && (
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      >
                        <div className="relative mb-2">
                          <motion.div 
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-200 border-4 border-amber-300 overflow-hidden"
                            whileHover={{ scale: 1.1, borderColor: '#d97706' }}
                          >
                            <img 
                              src={getMascotImageUrl(topThreeTeams.find(team => team.rank === 3)?.mascotId || 1)} 
                              alt="Third place mascot" 
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                          <motion.div 
                            className="absolute bottom-0 right-0 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-white text-lg font-bold"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 1.3, type: 'spring' }}
                          >
                            3
                          </motion.div>
                        </div>
                        <motion.div 
                          className="bg-gradient-to-b from-amber-600/70 to-amber-700/70 h-28 w-24 md:w-32 rounded-t-lg flex items-center justify-center shadow-md"
                          initial={{ height: 0 }}
                          animate={{ height: 112 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          <div className="text-center px-2">
                            <p className="font-bold text-lg text-amber-100 truncate max-w-[80px] md:max-w-[100px]">
                              {topThreeTeams.find(team => team.rank === 3)?.name}
                            </p>
                            <div className="flex items-center justify-center gap-1 text-amber-100 font-semibold">
                              <span className="text-xl">{topThreeTeams.find(team => team.rank === 3)?.totalScore}</span>
                              <span className="text-xs">pts</span>
                            </div>
                            
                            <div className="text-[10px] text-amber-200/70 mt-1">
                              {Math.round(topThreeTeams.find(team => team.rank === 3)?.accuracy || 0)}% tačnosti
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* Other contestants section - Now hidden in podium view */}
                {rankedTeams.length > 3 && (
                  <motion.div
                    className="mt-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-accent/20 w-full max-w-lg mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    style={{ display: statsView === 'podium' ? 'none' : 'block' }}
                  >
                    <h3 className="text-2xl font-bold text-accent mb-6 font-serif text-center relative">
                      <span className="relative inline-block">
                        Ostali takmičari
                        <motion.span 
                          className="absolute -bottom-2 left-0 w-full h-1 bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 1.2, duration: 0.8 }}
                        />
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {remainingTeams.map((team, index) => (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 + 0.1 * index }}
                          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 border border-accent/10 hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/5"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-accent/50 flex items-center justify-center font-bold text-xl text-white shadow-inner">
                            {team.rank}
                          </div>
                          <div className="relative group">
                            <img 
                              src={getMascotImageUrl(team.mascotId || 1)}
                              alt={`${team.name} mascot`}
                              className="w-11 h-11 rounded-full object-cover border-2 border-white/20 group-hover:border-white/50 transition-all"
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              {index + 4}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-white truncate group-hover:text-accent/90 transition-colors">{team.name}</h4>
                            <div className="flex gap-2 text-xs text-white/70">
                              
                            </div>
                          </div>
                          <div className="text-xl font-bold text-accent">
                            {team.totalScore} 
                            <span className="text-xs ml-1 text-accent/70">pts</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="stats"
                className="w-full bg-white/5 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-accent/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-full">
                  <h2 className="text-3xl font-bold text-accent mb-8 font-serif text-center">Tabela statistike</h2>
                  <table className="w-full text-left text-accent border-collapse text-lg">
                    <thead>
                      <tr className="border-b-2 border-accent/20">
                        <th className="py-4 px-6 font-serif">#</th>
                        <th className="py-4 px-6 font-serif">Tim</th>
                        <th className="py-4 px-6 font-serif text-center">Poeni</th>
                        <th className="py-4 px-6 font-serif text-center">Pitanja</th>
                        <th className="py-4 px-6 font-serif text-center">Tačni</th>
                        <th className="py-4 px-6 font-serif text-center">Tačnost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-accent/10">
                      {rankedTeams.map((team, teamIdx) => (
                        <motion.tr 
                          key={team.id}
                          className={teamIdx % 2 === 0 ? 'bg-transparent' : 'bg-accent/5'}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * teamIdx }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium 
                              ${team.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
                                team.rank === 2 ? 'bg-gray-300 text-gray-800' :
                                team.rank === 3 ? 'bg-amber-300 text-amber-800' :
                                'bg-accent/20 text-white'}`}
                            >
                              {team.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                <img 
                                  className="h-10 w-10 rounded-full border-2 border-accent/20" 
                                  src={getMascotImageUrl(team.mascotId || 1)} 
                                  alt="" 
                                />
                                {team.rank <= 3 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5">
                                    {team.rank === 1 && <span className="text-lg">🏆</span>}
                                    {team.rank === 2 && <span className="text-lg">🥈</span>}
                                    {team.rank === 3 && <span className="text-lg">🥉</span>}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{team.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-lg font-bold text-accent">{team.totalScore}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 text-center">
                            {team.totalQuestions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 text-center">
                            {team.correctAnswers}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative w-full bg-accent/10 rounded-full h-4 overflow-hidden">
                              <motion.div 
                                className="absolute left-0 top-0 h-full bg-accent"
                                style={{ width: '0%' }}
                                animate={{ width: `${team.accuracy}%` }}
                                transition={{ duration: 1, delay: 0.1 * teamIdx }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                {team.totalQuestions > 0 ? 
                                  `${team.accuracy}%` 
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminWinnersPage; 