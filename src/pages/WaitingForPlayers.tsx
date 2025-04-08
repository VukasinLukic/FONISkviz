import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

const WaitingForPlayers: React.FC = () => {
  const [dots, setDots] = useState('');
  const [imageError, setImageError] = useState(false);
  const { gameState } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPlayerRoute = location.pathname.startsWith('/player');
  const currentTeam = gameState.currentTeam;

  // Simuliramo animaciju tačkica za čekanje
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-navigacija nakon što su svi timovi spremni (simulacija)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/quiz-starting');
      } else {
        navigate('/quiz-starting');
      }
    }, 10000); // 10 sekundi čekanja
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  // Ako nema izabranog tima, preusmeravamo na početnu stranicu
  if (!currentTeam) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-5xl font-bold mb-4">
        {currentTeam.name}
      </h1>
      
      <div className="mb-8 text-center">
        <p className="text-primary text-xl">
          čekamo ostale timove{dots}
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
      
      {import.meta.env.DEV && (
        <p className="text-sm text-gray-500 mt-4">
          Debug: Mascot ID = {currentTeam.mascotId}
        </p>
      )}
    </div>
  );
};

export default WaitingForPlayers; 