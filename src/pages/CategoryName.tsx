import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CategoryNameProps {}

const CategoryName: React.FC<CategoryNameProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigacija nakon prikazivanja kategorije
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigiramo na odgovarajuću rutu u zavisnosti od toga gde smo
      if (isPlayerRoute) {
        navigate('/player/answers');
      } else {
        navigate('/answers');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);
  
  // Ovde bi trebao doći stvarni naziv kategorije iz konteksta ili API-ja
  const categoryName = "Informatika";

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-xl font-bold mb-4 text-center font-caviar">
        Sledeća kategorija
      </h2>
      
      <div className="text-primary text-5xl font-bold mb-8 text-center animate-pulse font-basteleur">
        {categoryName}
      </div>
      
      <div className="w-48 h-48 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <div className="text-primary text-4xl font-bold font-basteleur">
          NOVA KATEGORIJA
        </div>
      </div>
    </div>
  );
};

export default CategoryName; 