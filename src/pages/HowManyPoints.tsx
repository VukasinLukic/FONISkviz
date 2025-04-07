import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HowManyPointsProps {}

const HowManyPoints: React.FC<HowManyPointsProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const points = 100; // Ovo bi trebalo da dođe iz konteksta ili API-ja
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigacija nakon prikazivanja poena
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/team-points'); // Navigiramo ka prikazu ukupnih poena tima
      } else {
        navigate('/team-points');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      {points > 0 ? (
        <>
          <h2 className="text-primary text-2xl font-bold mb-4">
            Tačan odgovor!
          </h2>
          
          <div className="text-highlight text-6xl font-bold mb-8 animate-bounce">
            +{points}
          </div>
        </>
      ) : (
        <h2 className="text-primary text-2xl font-bold mb-8">
          Netačan odgovor!
        </h2>
      )}
      
      {/* Ovde bi trebalo da bude animacija maskote */}
      <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <p className="text-primary">Animacija maskote</p>
      </div>
    </div>
  );
};

export default HowManyPoints; 