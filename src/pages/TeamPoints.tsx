import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

const TeamPoints: React.FC = () => {
  const { gameState } = useGameContext();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');
  const currentTeam = gameState.currentTeam;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/answers');
      } else {
        navigate('/answers');
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  if (!currentTeam) {
    // Redirect to join page if no team
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-primary text-2xl font-bold mb-2">
          {currentTeam.name}
        </h1>
        <p className="text-primary text-xl">
          Osvojili ste {currentTeam.points} poena!
        </p>
      </div>
      
      {currentTeam.mascotId > 0 && !imageError ? (
        <img 
          src={`/assets/maskota${currentTeam.mascotId} 1.svg`}
          alt={`Maskota tima ${currentTeam.name}`}
          className="w-64 h-64 object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
          <p className="text-primary text-xl">?</p>
        </div>
      )}
      
      <div className="mt-8 text-primary">
        <p>Ukupno poena: {currentTeam.points}</p>
        {import.meta.env.DEV && (
          <p className="text-sm text-gray-500 mt-2">
            Debug: Mascot ID = {currentTeam.mascotId}
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamPoints; 