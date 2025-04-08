import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';

const MascotSelection: React.FC = () => {
  const [selectedMascot, setSelectedMascot] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const { gameState, updateTeamMascot } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');
  const currentTeam = gameState.currentTeam;

  if (!currentTeam) {
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
        await updateTeamMascot(currentTeam.id, selectedMascot);
        if (isPlayerRoute) {
          navigate('/player/waiting');
        } else {
          navigate('/waiting');
        }
      } catch (error) {
        console.error('Error updating mascot:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-3xl font-bold mb-8 text-center">
        {currentTeam.name}, izaberite maskotu:
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
                  : 'hover:bg-secondary hover:bg-opacity-10'
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
      
      <MainButton 
        onClick={handleSubmit}
        disabled={selectedMascot === null}
      >
        može!
      </MainButton>

      {import.meta.env.DEV && selectedMascot && (
        <p className="text-sm text-gray-500 mt-4">
          Debug: Izabrana maskota ID = {selectedMascot}
        </p>
      )}
    </div>
  );
};

export default MascotSelection; 