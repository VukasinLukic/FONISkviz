import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

interface WaitingForAnswerProps {}

const WaitingForAnswer: React.FC<WaitingForAnswerProps> = () => {
  const [dots, setDots] = useState('');
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  const currentTeam = gameState.currentTeam;

  // Simuliramo animaciju tačkica za čekanje
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-navigacija nakon vremena za čekanje (simulacija)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/points');
      } else {
        navigate('/points');
      }
    }, 3000); // Ovo bi bilo duže u stvarnoj implementaciji
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  // Ako nema izabranog tima, preusmeravamo na početnu stranicu
  if (!currentTeam) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-tertiarybrown p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-2xl font-bold mb-8 font-basteleur">
        odgovor je poslat!
      </h2>
      
      <p className="text-primary text-xl mb-8 font-caviar">
        čekamo da svi timovi odgovore{dots}
      </p>
      
      {currentTeam.mascotId > 0 && !imageError ? (
        <img 
          src={`/assets/maskota${currentTeam.mascotId} 1.svg`}
          alt={`Maskota tima ${currentTeam.name}`}
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
          Debug: Mascot ID = {currentTeam?.mascotId}
        </p>
      )}
    </div>
  );
};

export default WaitingForAnswer; 