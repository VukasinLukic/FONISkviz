import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface FinalTeamPointsProps {}

const FinalTeamPoints: React.FC<FinalTeamPointsProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Auto-navigacija nakon prikazivanja poena
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigiramo na odgovarajuću rutu u zavisnosti od toga gde smo
      if (isPlayerRoute) {
        navigate('/player/tension');
      } else {
        navigate('/tension');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  // Mock podaci - u stvarnoj implementaciji bi došli iz konteksta ili API-ja
  const teamName = "Vaš Tim";
  const points = 2350;
  const position: number = 2; // 1, 2 ili 3 za medalju

  // Funkcija za prikaz odgovarajuće medalje
  const renderMedal = () => {
    switch(position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-2xl font-bold mb-4 text-center">
        Konačan rezultat
      </h2>
      
      <div className="text-primary text-5xl font-bold mb-4 flex items-center gap-4">
        {renderMedal()} <span>{teamName}</span>
      </div>
      
      <div className="text-secondary text-6xl font-bold mb-12">
        {points}
      </div>
      
      {/* Ovde bi trebalo da bude animacija maskote */}
      <div className="w-48 h-48 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <p className="text-primary">Maskota tima</p>
      </div>
    </div>
  );
};

export default FinalTeamPoints; 