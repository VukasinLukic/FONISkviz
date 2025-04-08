import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import gsap from 'gsap'; // Removed
import CircularProgressBar from '../components/CircularProgressBar';
import Logo from '../components/Logo';
// import AnimatedBackground from '../components/AnimatedBackground'; // Removed
import { useGameContext } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Team {
  id: string;
  name: string;
  mascot: number;
  readyToPlay: boolean;
  color?: string;
}

interface LobbyPageProps {}

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6, 
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    transition: { 
      duration: 0.4, 
      ease: "easeInOut",
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "backOut" }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};


const LobbyPage: React.FC<LobbyPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  
  // Check if coming from a previous page with transition
  const fromPrevious = location.state?.fromPrevious || false;
  
  const [gameTime, setGameTime] = useState(290); // 4:50 in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameCode] = useState('FONIS123'); // Game code for the current session
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team Awesome', mascot: 1, readyToPlay: true, color: 'bg-gradient-to-br from-red-500 to-red-600' },
    { id: '2', name: 'Quiz Masters', mascot: 3, readyToPlay: true, color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { id: '3', name: 'Brain Storm', mascot: 7, readyToPlay: true, color: 'bg-gradient-to-br from-green-500 to-green-600' },
    { id: '4', name: 'Smart Pandas', mascot: 4, readyToPlay: true, color: 'bg-gradient-to-br from-yellow-500 to-yellow-600' }
  ]);
  const [loaded, setLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Refs not needed for Framer Motion targeting
  // const containerRef = useRef<HTMLDivElement>(null);
  // const timeRef = useRef<HTMLDivElement>(null);
  // const controlsRef = useRef<HTMLDivElement>(null);
  // const teamsGridRef = useRef<HTMLDivElement>(null);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Merge gameState teams with demo teams if they exist
  useEffect(() => {
    if (gameState.teams.length > 0) {
      const updatedTeams = [...teams];
      
      gameState.teams.forEach((gameTeam) => {
        const existingTeamIndex = updatedTeams.findIndex(t => t.name.toLowerCase() === gameTeam.name.toLowerCase());
        
        if (existingTeamIndex >= 0) {
          // Update existing team
          updatedTeams[existingTeamIndex] = {
            ...updatedTeams[existingTeamIndex],
            id: gameTeam.id,
            mascot: gameTeam.mascotId || updatedTeams[existingTeamIndex].mascot,
            readyToPlay: gameTeam.isActive
          };
        } else {
          // Add new team
          const colors = [
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-pink-600',
            'bg-gradient-to-br from-indigo-500 to-indigo-600',
            'bg-gradient-to-br from-teal-500 to-teal-600'
          ];
          
          updatedTeams.push({
            id: gameTeam.id,
            name: gameTeam.name,
            mascot: gameTeam.mascotId || 1,
            readyToPlay: gameTeam.isActive,
            color: colors[updatedTeams.length % colors.length]
          });
        }
      });
      
      setTeams(updatedTeams);
    }
  }, [gameState.teams]);
  
  // Ensure components are loaded with a slight delay for proper animations
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), fromPrevious ? 50 : 100); // Faster load trigger
    return () => clearTimeout(timer);
  }, [fromPrevious]);
  
  // Timer effect
  useEffect(() => {
    if (!loaded) return;
    
    const timer = setInterval(() => {
      setGameTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loaded]);
  
  // GSAP animations removed
  
  const handleStartGame = () => {
    setIsExiting(true);
    // Navigation will happen via onExitComplete in AnimatePresence
  };
  
  return (
    <motion.div 
      // Removed background class - Layout handles bg
      className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden"
    >
      {/* Background elements - REMOVED - Layout handles background */}
      {/* <AnimatedBackground 
        density="medium" // Match QR code page density
        color="primary" 
        delayStart={fromPrevious ? 0 : 0.5} 
        animated={!isExiting} // Stop animating on exit
      /> */}
      
      {/* Logo at top */}
      <motion.div 
        className="absolute top-6 left-6 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Logo size="medium" onClick={() => navigate('/admin')} />
      </motion.div>

      <AnimatePresence 
        mode="wait"
        onExitComplete={() => navigate('/admin/category', { state: { fromPrevious: true } })}
      >
        {loaded && !isExiting && (
          <motion.div
            key="lobby-content"
            className="flex flex-col flex-1 h-full pt-16" // Adjusted padding
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header with quiz name and timer */}
            <motion.div className="lobby-header flex justify-between items-center mb-12 mt-6 z-20" variants={itemVariants}>
              <div className="w-1/3">
                {/* Empty div for spacing */} 
              </div>
              <h1 className="text-4xl font-bold text-accent font-mainstay w-1/3 text-center">FONIS Quiz</h1>
              <div className="w-1/3"></div>
            </motion.div>
            
            {/* Control buttons and progress */}
            <motion.div className="flex justify-between items-center mb-8 z-20" variants={itemVariants}>
              <div className="progress-indicator flex items-center bg-accent bg-opacity-30 p-2 rounded-lg">
                <CircularProgressBar
                  value={12.5 * currentQuestion}
                  currentStep={currentQuestion}
                  totalSteps={8}
                  size={60}
                  showLabel={true}
                />
                <span className="ml-3 text-accent font-semibold">Question {currentQuestion}/8</span>
              </div>
              
              <div className="control-buttons flex gap-4">
                <motion.button 
                  className="control-button bg-special hover:bg-opacity-90 text-white py-2 px-6 rounded-md font-bold transition-colors duration-300 shadow-md flex items-center"
                  onClick={() => {}} // Add reset logic if needed
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  variants={itemVariants}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </motion.button>
                <motion.button 
                  className="control-button bg-highlight hover:bg-opacity-90 text-white py-2 px-6 rounded-md font-bold transition-colors duration-300 shadow-md flex items-center"
                  onClick={handleStartGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  variants={itemVariants} 
                  animate={{ // Add pulsing effect
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0 0 8px 2px rgba(191, 195, 48, 0.4)", 
                      "0 0 12px 4px rgba(191, 195, 48, 0.6)", 
                      "0 0 8px 2px rgba(191, 195, 48, 0.4)"
                    ],
                    transition: {
                      scale: { duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                      boxShadow: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Game
                </motion.button>
              </div>
            </motion.div>
            
            {/* Teams Grid */}
            <motion.div className="flex-1 mb-8 z-20" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-accent mb-6 font-caviar">Connected Teams</h2>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants} // Use container for stagger
              >
                {teams.map((team) => (
                  <motion.div 
                    key={team.id} 
                    className={`team-card p-4 rounded-2xl shadow-md ${team.color || 'bg-gradient-to-br from-accent to-secondary'} overflow-hidden relative`}
                    variants={cardVariants}
                    whileHover={{ 
                      y: -5,
                      transition: { duration: 0.2 } 
                    }}
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                      <div className={`h-3 w-3 rounded-full ${team.readyToPlay ? 'bg-green-400' : 'bg-yellow-400'} shadow-sm`}></div>
                    </div>
                    
                    {/* Mascot Circle */}
                    <motion.div 
                      className="flex justify-center mb-2"
                      whileHover={{ scale: 1.1 }} // Add hover effect to mascot container
                    >
                      <div className="team-mascot-container relative w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden border-4 border-white">
                        <motion.img 
                          src={`/assets/maskota${team.mascot} 1.svg`}
                          alt={`Team ${team.name} Mascot`}
                          className="team-mascot w-16 h-16 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/maskota1 1.svg';
                          }}
                          whileHover={{ rotate: [-5, 5, -5], transition: { duration: 0.5, repeat: Infinity } }} // Wiggle effect
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 rounded-full"></div>
                      </div>
                    </motion.div>
                    
                    {/* Team Name */}
                    <motion.div 
                      className="text-white font-bold text-center text-lg tracking-wide mb-1 font-caviar"
                      // Removed individual animation, handled by parent stagger
                    >
                      {team.name}
                    </motion.div>
                    
                    {/* Join Time */}
                    <div className="text-white/80 text-xs text-center">
                      Joined 2 min ago
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full opacity-50"></div>
                    <div className="absolute -top-6 -left-6 w-12 h-12 bg-white/10 rounded-full opacity-50"></div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Large Creative Timer */}
            <motion.div 
              className="w-full flex flex-col items-center justify-center mb-8 z-20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { 
                  duration: 0.8, 
                  ease: "easeOut" 
                }
              }}
            >
              <motion.div 
                className="relative"
                animate={{
                  scale: [1, 1.03, 1],
                  transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
              >
                {/* Glowing background effects */}
                <div className="absolute -inset-4 bg-secondary bg-opacity-20 rounded-full blur-lg"></div>
                <div className="absolute -inset-8 bg-accent bg-opacity-10 rounded-full blur-xl"></div>
                
                {/* Main timer display */}
                <div className="relative bg-gradient-to-br from-secondary to-primary p-6 rounded-2xl border-4 border-accent border-opacity-30 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-accent text-5xl font-bold font-mainstay tracking-wider">
                      {formatTime(gameTime)}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div 
                className="absolute -z-10"
                animate={{
                  rotate: 360,
                  transition: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
              >
                <div className="w-64 h-64 rounded-full border-4 border-dashed border-accent border-opacity-10"></div>
              </motion.div>
            </motion.div>
            
            {/* Game code and waiting message */}
            <motion.div className="flex flex-col items-center justify-center mb-4 z-20" variants={itemVariants}>
              <div className="waiting-text text-accent text-center mb-4 text-lg font-caviar">
                Waiting for players to join... 
              </div>
              <div className="game-code-display bg-accent bg-opacity-20 px-4 py-2 rounded-lg flex items-center">
                <span className="text-accent mr-2 font-caviar">Game Code:</span>
                <span className="font-bold text-accent">{gameCode}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LobbyPage; 