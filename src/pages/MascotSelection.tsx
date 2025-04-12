import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainButton from '../components/MainButton';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { motion } from 'framer-motion';
import { updateTeam, getDb } from '../lib/firebase';
import { Database } from 'firebase/database';

const MascotSelection: React.FC = () => {
  const [selectedMascot, setSelectedMascot] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [dbInstance, setDbInstance] = useState<Database | null>(null);
  
  // Get team data from localStorage
  const [teamData, setTeamData] = useState({
    teamId: localStorage.getItem('teamId') || '',
    teamName: localStorage.getItem('teamName') || '',
    gameCode: localStorage.getItem('gameCode') || ''
  });
  
  const isPlayerRoute = location.pathname.startsWith('/player');

  // Check if team data exists
  useEffect(() => {
    if (!teamData.teamId || !teamData.teamName) {
      console.log("No team ID or team name, redirecting to join page");
      navigate(isPlayerRoute ? '/player' : '/');
    }
  }, [teamData.teamId, teamData.teamName, navigate, isPlayerRoute]);

  // Fetch DB instance
  useEffect(() => {
    const fetchDb = async () => {
      const db = await getDb();
      setDbInstance(db);
    };
    fetchDb();
  }, []);

  const handleMascotSelect = (mascotId: number) => {
    setSelectedMascot(mascotId);
    setErrorMessage(null); // Clear any previous errors
  };

  const handleImageError = (mascotId: number) => {
    console.log(`Image error for mascot ${mascotId}`);
    setImageError(prev => ({
      ...prev,
      [mascotId]: true
    }));
  };

  const handleSubmit = async () => {
    if (selectedMascot !== null && teamData.teamId) {
      setIsLoading(true);
      try {
        if (!dbInstance) throw new Error("DB not initialized");
        setErrorMessage(null);
        setSuccessMessage(null);
        console.log(`Updating mascot to ${selectedMascot}`);
        
        await updateTeam(teamData.teamId, { mascotId: selectedMascot });
        
        // Save mascot ID to localStorage
        localStorage.setItem('mascotId', selectedMascot.toString());
        
        console.log(`Mascot updated successfully to ${selectedMascot}`);
        setSuccessMessage("Maskota uspešno izabrana!");
        
        // Add a short delay before navigation to show the success message
        setTimeout(() => {
          navigate('/player/waiting');
        }, 800);
      } catch (error) {
        console.error('Error updating mascot:', error);
        setErrorMessage("Greška pri izboru maskote. Pokušajte ponovo.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage("Izaberite maskotu pre nego što nastavite.");
    }
  };

  return (
    <div className="min-h-screen bg-primary p-4 relative overflow-hidden">
      <AnimatedBackground density="low" />
      
      <motion.div
        className="z-30 absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" />
      </motion.div>
      
      <div className="max-w-2xl mx-auto pt-24 z-20 relative flex flex-col items-center">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-accent mb-8 text-center font-serif"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {teamData.teamName}, izaberite maskotu:
        </motion.h1>
        
        <motion.div 
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((mascotId) => (
            !imageError[mascotId] && (
              <motion.button
                key={mascotId}
                onClick={() => handleMascotSelect(mascotId)}
                className={`p-4 rounded-lg transition-all ${
                  selectedMascot === mascotId
                    ? 'ring-4 ring-highlight bg-highlight/20'
                    : 'hover:bg-accent/20 bg-accent/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={`/assets/maskota${mascotId} 1.svg`}
                  alt={`Maskota ${mascotId}`}
                  className="w-24 h-24 md:w-32 md:h-32 object-contain"
                  onError={() => handleImageError(mascotId)}
                />
              </motion.button>
            )
          ))}
        </motion.div>
        
        {/* Error message */}
        {errorMessage && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-md mb-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errorMessage}
          </motion.div>
        )}
        
        {/* Success message */}
        {successMessage && (
          <motion.div 
            className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-md mb-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMessage}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <MainButton
            onClick={handleSubmit}
            disabled={!selectedMascot || isLoading}
            className="w-full py-3 text-lg"
          >
            {isLoading ? 'Učitavanje...' : 'Potvrdi izbor'}
          </MainButton>
        </motion.div>
      </div>
    </div>
  );
};

export default MascotSelection; 