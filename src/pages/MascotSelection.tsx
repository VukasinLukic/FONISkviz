import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';

const MascotSelection: React.FC = () => {
  const [selectedMascot, setSelectedMascot] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const { gameState, updateMascot } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');

  if (!gameState.teamId || !gameState.isRegistered) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  const handleMascotSelect = (mascotId: number) => {
    setSelectedMascot(mascotId);
  };

  const handleImageError = (mascotId: number) => {
    setImageError(prev => ({
      ...prev,
      [mascotId]: true
    }));
  };

  const handleSubmit = async () => {
    if (selectedMascot !== null) {
      try {
        await updateMascot(selectedMascot);
        navigate('/player/waiting');
      } catch (error) {
        console.error('Error updating mascot:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-tertiarygreen p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-3xl font-bold mb-8 text-center font-basteleur">
        {gameState.teamName}, izaberite maskotu:
      </h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((mascotId) => (
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
      
      <button
        onClick={handleSubmit}
        disabled={!selectedMascot}
        className="w-full max-w-md py-3 px-6 text-lg font-bold bg-highlight text-white rounded-lg 
        shadow-md hover:bg-opacity-90 transition-all disabled:opacity-50 
        disabled:cursor-not-allowed"
      >
        može!
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