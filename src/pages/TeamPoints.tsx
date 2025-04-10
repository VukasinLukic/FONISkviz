import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

const TeamPoints: React.FC = () => {
  const { gameState } = useGameContext();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Get team data from gameState 
  const teamName = gameState.teamName || "Your Team";
  const points = gameState.points || 0;
  const mascotId = gameState.mascotId || 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/category');
      } else {
        navigate('/admin/category');
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  // If not registered, redirect to join page
  if (!gameState.isRegistered) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-tertiarygreen p-4 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-primary text-2xl font-bold mb-2 font-basteleur">
          {teamName}
        </h1>
        <p className="text-primary text-xl font-caviar">
          Osvojili ste {points} poena!
        </p>
      </div>
      
      {mascotId > 0 && !imageError ? (
        <img 
          src={`/assets/maskota${mascotId} 1.svg`}
          alt={`Maskota tima ${teamName}`}
          className="w-64 h-64 object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
          <p className="text-primary text-xl font-caviar">?</p>
        </div>
      )}
      
      <div className="mt-8 text-primary">
        <p className="font-caviar">Ukupno poena: {points}</p>
        {import.meta.env.DEV && (
          <p className="text-sm text-primary mt-2 font-caviar">
            Debug: Mascot ID = {mascotId}
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamPoints; 