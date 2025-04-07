import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TensionPageProps {}

const TensionPage: React.FC<TensionPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigacija nakon nekoliko sekundi
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigiramo na odgovarajuću rutu u zavisnosti od toga gde smo
      if (isPlayerRoute) {
        navigate('/player/winners');
      } else {
        navigate('/winners');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-3xl font-bold mb-8 text-center animate-pulse">
        Spremite se za finale!
      </h2>
      
      <div className="w-64 h-64 bg-special bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
        <p className="text-special text-8xl">🎭</p>
      </div>
      
      <p className="text-primary text-xl mt-8">
        Ko će biti pobednik?
      </p>
    </div>
  );
};

export default TensionPage; 