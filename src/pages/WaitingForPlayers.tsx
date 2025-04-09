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

  // Simuliramo animaciju tačkica za čekanje
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-navigacija nakon što su svi timovi spremni (simulacija)
  useEffect(() => {
    // Instead of a timer, we should listen to game state changes
    // Game state changes are already listened to in GameContext.tsx
    // and will automatically navigate when the game starts
  }, [navigate, isPlayerRoute]);

  // If no team info, redirect to the join page
  if (!gameState.teamId || !gameState.isRegistered) {
    navigate(isPlayerRoute ? '/player' : '/');
    return null;
  }

  return (
    <div className="min-h-screen bg-tertiarypink p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-5xl font-bold mb-4 font-basteleur">
        {gameState.teamName}
      </h1>
      
      <div className="mb-8 text-center">
        <p className="text-primary text-xl font-caviar">
          čekamo ostale timove{dots}
        </p>
      </div>
      
      {gameState.mascotId > 0 && !imageError ? (
        <img 
          src={`/assets/maskota${gameState.mascotId} 1.svg`}
          alt={`Maskota tima ${gameState.teamName}`}
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
          Debug: Mascot ID = {gameState.mascotId}
        </p>
      )}
    </div>
  );
};

export default WaitingForPlayers; 