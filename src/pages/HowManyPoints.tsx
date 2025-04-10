import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { useState } from 'react';

interface HowManyPointsProps {}

const HowManyPoints: React.FC<HowManyPointsProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const points = 100; // Ovo bi trebalo da dođe iz konteksta ili API-ja
  const [imageError, setImageError] = useState(false);
  const { gameState } = useGameContext();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Get team data from gameState 
  const teamName = gameState.teamName || "Your Team";
  const mascotId = gameState.mascotId || 0;
  
  // Auto-navigacija nakon prikazivanja poena
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/team-points'); // Navigiramo ka prikazu ukupnih poena tima
      } else {
        navigate('/admin/points');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  // Ako nije registrovan tim, preusmeravamo na početnu stranicu
  if (!gameState.isRegistered) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-tertiarygreen p-4 flex flex-col items-center justify-center">
      {points > 0 ? (
        <>
          <h2 className="text-primary text-2xl font-bold mb-4 font-basteleur">
            Tačan odgovor!
          </h2>
          
          <div className="text-highlight text-6xl font-bold mb-8 animate-bounce font-basteleur">
            +{points}
          </div>
        </>
      ) : (
        <h2 className="text-primary text-2xl font-bold mb-8 font-basteleur">
          Netačan odgovor!
        </h2>
      )}
      
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

      {import.meta.env.DEV && (
        <p className="text-sm text-primary mt-4 font-caviar">
          Debug: Mascot ID = {mascotId}
        </p>
      )}
    </div>
  );
};

export default HowManyPoints; 