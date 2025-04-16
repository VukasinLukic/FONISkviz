import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainButton from '../components/MainButton';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { updateTeam, getDb, getTeamsForGame } from '../lib/firebase';
import { Database } from 'firebase/database';
import { getMascotImageUrl } from '../lib/utils';

// Maksimalni ID maskota
const MAX_MASCOT_ID = 18;

const MascotSelection: React.FC = () => {
  const [currentMascot, setCurrentMascot] = useState<number>(1);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [takenMascots, setTakenMascots] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [dbInstance, setDbInstance] = useState<Database | null>(null);
  const controls = useAnimation();
  
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

  // Fetch DB instance and already taken mascots
  useEffect(() => {
    const fetchDbAndTakenMascots = async () => {
      const db = await getDb();
      setDbInstance(db);
      
      // Fetch teams for the current game to see which mascots are taken
      if (teamData.gameCode) {
        try {
          const teams = await getTeamsForGame(teamData.gameCode);
          const takenMascotIds = teams
            .filter(team => team.id !== teamData.teamId && team.mascotId) // Exclude current team
            .map(team => team.mascotId);
          
          console.log('Taken mascots:', takenMascotIds);
          setTakenMascots(takenMascotIds);
        } catch (error) {
          console.error('Error fetching teams:', error);
        }
      }
    };
    
    fetchDbAndTakenMascots();
  }, [teamData.gameCode, teamData.teamId]);

  const handleNextMascot = () => {
    if (currentMascot < MAX_MASCOT_ID) {
      controls.start({ opacity: 0 })
        .then(() => {
          setCurrentMascot(prev => prev + 1);
          controls.start({ opacity: 1 });
        });
    }
  };

  const handlePrevMascot = () => {
    if (currentMascot > 1) {
      controls.start({ opacity: 0 })
        .then(() => {
          setCurrentMascot(prev => prev - 1);
          controls.start({ opacity: 1 });
        });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50; // minimalna distanca za promenu maskote
    
    if (info.offset.x < -threshold && currentMascot < MAX_MASCOT_ID) {
      handleNextMascot();
    } else if (info.offset.x > threshold && currentMascot > 1) {
      handlePrevMascot();
    } else {
      // Vrati na centralnu poziciju ako drag nije prešao threshold
      controls.start({ x: 0 });
    }
  };

  const handleImageError = (mascotId: number) => {
    console.log(`Image error for mascot ${mascotId}`);
    setImageError(prev => ({
      ...prev,
      [mascotId]: true
    }));
    
    // Ako trenutna maskota ne može da se učita, pomeri na sledeću
    if (mascotId === currentMascot) {
      if (currentMascot < MAX_MASCOT_ID) {
        setCurrentMascot(prev => prev + 1);
      } else if (currentMascot > 1) {
        setCurrentMascot(prev => prev - 1);
      }
    }
  };

  const handleSubmit = async () => {
    if (currentMascot && teamData.teamId) {
      setIsLoading(true);
      try {
        if (!dbInstance) throw new Error("DB not initialized");
        setErrorMessage(null);
        setSuccessMessage(null);
        
        // Check if this mascot is already taken
        if (takenMascots.includes(currentMascot)) {
          setErrorMessage("Ova maskota je već izabrana od strane drugog tima. Izaberite drugu.");
          setIsLoading(false);
          return;
        }
        
        console.log(`Updating mascot to ${currentMascot}`);
        
        await updateTeam(teamData.teamId, { mascotId: currentMascot });
        
        // Save mascot ID to localStorage
        localStorage.setItem('mascotId', currentMascot.toString());
        
        console.log(`Mascot updated successfully to ${currentMascot}`);
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

  // Proveri da li je trenutna maskota dostupna, ako nije preskoči je
  useEffect(() => {
    if (imageError[currentMascot]) {
      if (currentMascot < MAX_MASCOT_ID) {
        setCurrentMascot(prev => prev + 1);
      } else if (currentMascot > 1) {
        setCurrentMascot(prev => prev - 1);
      }
    }
  }, [currentMascot, imageError]);

  // Check if current mascot is already taken
  const isMascotTaken = takenMascots.includes(currentMascot);

  return (
    <div className="min-h-screen bg-primary p-2 sm:p-4 relative overflow-hidden flex flex-col">
      <AnimatedBackground density="low" />
      
      {/* Centered logo at top - smaller on mobile */}
      {/* <div className="w-full flex justify-center mt-1 sm:mt-2 mb-0 sm:mb-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="large" className="w-36 h-36 sm:w-28 sm:h-28 ml-8" />
        </motion.div>
      </div> */}
      
      <div className="flex-grow flex flex-col items-center justify-center max-w-xl mx-auto z-20 relative">
        <motion.h1 
          className="text-2xl sm:text-2xl md:text-3xl font-bold text-accent mb-1 text-center font-serif px-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {teamData.teamName}, izaberite maskotu:
        </motion.h1>
        
        {/* Glavni deo - pregled maskote */}
        <div className="w-full flex flex-col items-center justify-center mt-1 mb-2 sm:mb-4">
          {/* Avatar pregled - responsive size */}
          <motion.div 
            className={`relative bg-accent/20 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl flex items-center justify-center p-2 sm:p-4 border-[3px] ${
              isMascotTaken ? 'border-red-500/60' : 'border-accent/40'
            } backdrop-blur-sm shadow-xl mb-2 sm:mb-4`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Overlay for taken mascots */}
            {isMascotTaken && (
              <div className="absolute inset-0 bg-red-500/20 rounded-3xl flex items-center justify-center z-20">
                <div className="bg-red-500/70 text-white font-bold px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                  Već zauzeto
                </div>
              </div>
            )}
            
            {/* Kontejner za maskotu sa animacijom i drag funkcionalnostima */}
            <motion.div
              className="w-full h-full flex items-center justify-center p-2 sm:p-4 z-10"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              animate={controls}
              initial={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {!imageError[currentMascot] && (
                <img
                  src={getMascotImageUrl(currentMascot)}
                  alt={`Maskota ${currentMascot}`}
                  className={`w-full h-full object-contain scale-125 transform-gpu ${
                    isMascotTaken ? 'opacity-50' : ''
                  }`}
                  style={{ 
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                    maxWidth: '80%',
                    maxHeight: '80%'
                  }}
                  onError={() => handleImageError(currentMascot)}
                />
              )}
            </motion.div>
          </motion.div>
          
          {/* Indikator trenutne maskote - responsivni fontovi */}
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="bg-accent/20 px-4 sm:px-5 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border border-accent/30 shadow-md">
              <span className="text-accent font-medium text-base sm:text-lg">{currentMascot} / {MAX_MASCOT_ID}</span>
            </div>
          </div>
          
          {/* Kontrole za navigaciju - responsive size and spacing */}
          <div className="flex items-center justify-center w-full mt-1 sm:mt-2 gap-4 sm:gap-8">
            {currentMascot > 1 ? (
              <motion.button
                onClick={handlePrevMascot}
                className="bg-accent/20 hover:bg-accent/40 w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors border-2 border-accent/30 shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-xl text-accent">{"<"}</p>
              </motion.button>
            ) : (
              <div className="w-12 sm:w-14 md:w-16"></div> // Placeholder za poravnanje kada nema prethodnog dugmeta
            )}
            
            {currentMascot < MAX_MASCOT_ID ? (
              <motion.button
                onClick={handleNextMascot}
                className="bg-accent/20 hover:bg-accent/40 w-16 h-16 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors border-2 border-accent/30 shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-xl text-accent">{">"}</p>
              </motion.button>
            ) : (
              <div className="w-16 sm:w-14 md:w-16"></div> // Placeholder za poravnanje kada nema sledećeg dugmeta
            )}
          </div>
        </div>
        
        {/* Pomoćni tekst za swipe */}
        <motion.p
          className="text-accent/70 text-m sm:text-m mb-2 sm:mb-3 px-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          prevucite prstom levo ili desno za pregled svih maskota
        </motion.p>
        
        {/* Error message */}
        {errorMessage && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 text-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-3 sm:mb-4 text-center w-full text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errorMessage}
          </motion.div>
        )}
        
        {/* Success message */}
        {successMessage && (
          <motion.div 
            className="bg-green-500/20 border border-green-500/50 text-green-100 px-3 sm:px-4 py-2 sm:py-3 rounded-md mb-3 sm:mb-4 text-center w-full text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMessage}
          </motion.div>
        )}
        
        {/* Veliko dugme za izbor postavljeno na dnu - responsive width */}
        <motion.button
          onClick={handleSubmit}
          disabled={isLoading || isMascotTaken}
          className={`bg-secondary text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-xl shadow-lg ${
            isMascotTaken ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-secondary/90'
          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl sm:text-lg w-[85%] sm:w-3/4 mt-2 sm:mt-4`}
          whileHover={{ scale: isMascotTaken ? 1 : 1.05 }}
          whileTap={{ scale: isMascotTaken ? 1 : 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isLoading ? 'učitavanje...' : isMascotTaken ? 'maskota je zauzeta' : 'izaberi ovu maskotu'}
        </motion.button>
      </div>
    </div>
  );
};

export default MascotSelection;