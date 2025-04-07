import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TeamPointsProps {}

const TeamPoints: React.FC<TeamPointsProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const teamName = "Vaš Tim"; // Ovo bi trebalo da dođe iz konteksta
  const points = 450; // Ovo bi trebalo da dođe iz API-ja
  
  // Auto-navigacija nakon prikazivanja poena
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/category'); // Vraćamo se na kategoriju za sledeće pitanje
      } else {
        navigate('/category');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-2xl font-bold mb-4">
        {teamName}
      </h2>
      
      <div className="text-primary text-6xl font-bold mb-8">
        {points}
      </div>
      
      {/* Ovde bi trebalo da bude animacija maskote */}
      <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <p className="text-primary">Maskota tima</p>
      </div>
    </div>
  );
};

export default TeamPoints; 