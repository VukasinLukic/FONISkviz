import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';

const MascotSelection: React.FC = () => {
  const [selectedMascot, setSelectedMascot] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { gameState, updateMascot, loading } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');

  // Log team info for debugging
  console.log("MascotSelection - Team Info:", { 
    teamId: gameState.teamId, 
    teamName: gameState.teamName,
    isRegistered: gameState.isRegistered,
    mascotId: gameState.mascotId
  });

  if (!gameState.teamId || !gameState.isRegistered) {
    console.log("No team ID or not registered, redirecting to join page");
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

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
    if (selectedMascot !== null) {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        console.log(`Updating mascot to ${selectedMascot}`);
        
        await updateMascot(selectedMascot);
        
        console.log(`Mascot updated successfully to ${selectedMascot}`);
        setSuccessMessage("Maskota uspešno izabrana!");
        
        // Add a short delay before navigation to show the success message
        setTimeout(() => {
          navigate('/player/waiting');
        }, 800);
      } catch (error) {
        console.error('Error updating mascot:', error);
        setErrorMessage("Greška pri izboru maskote. Pokušajte ponovo.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-tertiarygreen p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-3xl font-bold mb-8 text-center font-basteleur">
        {gameState.teamName}, izaberite maskotu:
      </h1>
      
      {/* Debug info */}
      <div className="mb-4 text-xs text-primary">
        <p>Team ID: {gameState.teamId}</p>
        <p>Current Mascot: {gameState.mascotId}</p>
        <p>Selected Mascot: {selectedMascot}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[2, 3, 4, 5, 6, 7, 8, 9].map((mascotId) => (
          !imageError[mascotId] && (
            <button
              key={mascotId}
              onClick={() => handleMascotSelect(mascotId)}
              className={`p-4 rounded-lg transition-all ${
                selectedMascot === mascotId
                  ? 'ring-4 ring-secondary bg-secondary bg-opacity-20'
                  : 'hover:bg-secondary hover:bg-opacity-10 bg-tertiarygreen'
              }`}
            >
              <img
                src={`/assets/maskota${mascotId} 1.svg`}
                alt={`Maskota ${mascotId}`}
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                onError={() => handleImageError(mascotId)}
              />
            </button>
          )
        ))}
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={!selectedMascot || loading}
        className="w-full max-w-md py-3 px-6 text-lg font-bold bg-highlight text-white rounded-lg 
        shadow-md hover:bg-opacity-90 transition-all disabled:opacity-50 
        disabled:cursor-not-allowed"
      >
        {loading ? 'Učitavanje...' : 'može!'}
      </button>

      {import.meta.env.DEV && selectedMascot && (
        <p className="text-sm text-primary mt-4 font-caviar">
          Debug: Izabrana maskota ID = {selectedMascot}
        </p>
      )}
    </div>
  );
};

export default MascotSelection; 