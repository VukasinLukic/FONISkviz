import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface QuizStartingProps {}

const QuizStarting: React.FC<QuizStartingProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigacija nakon kratkog vremena
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigiramo na odgovarajuću rutu u zavisnosti od toga gde smo
      if (isPlayerRoute) {
        navigate('/player/category');
      } else {
        navigate('/category');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-3xl font-bold mb-8 text-center">
        Kviz počinje!
      </h1>
      
      <div className="w-72 h-72 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mb-8">
        <div className="w-56 h-56 bg-secondary bg-opacity-30 rounded-full flex items-center justify-center animate-pulse">
          <p className="text-primary text-5xl font-bold">FON</p>
        </div>
      </div>
      
      <p className="text-primary text-xl">
        Pripremite se...
      </p>
    </div>
  );
};

export default QuizStarting; 