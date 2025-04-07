import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface WinnersPageProps {}

const WinnersPage: React.FC<WinnersPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Mock podaci - u stvarnoj implementaciji bi došli iz konteksta ili API-ja
  const teamName = "Vaš Tim";
  const position: number = 2; // 1, 2, 3 ili neki drugi broj
  
  // Funkcija za prikaz odgovarajuće medalje i poruke
  const renderResult = () => {
    if (position === 1) {
      return (
        <>
          <span className="text-8xl">🥇</span>
          <h2 className="text-highlight text-3xl font-bold mt-4 mb-2">Pobednici!</h2>
          <p className="text-primary text-xl">Čestitamo! Vi ste pobednici kviza!</p>
        </>
      );
    } else if (position === 2) {
      return (
        <>
          <span className="text-8xl">🥈</span>
          <h2 className="text-primary text-3xl font-bold mt-4 mb-2">Drugo mesto!</h2>
          <p className="text-primary text-xl">Fantasično! Osvojili ste drugo mesto!</p>
        </>
      );
    } else if (position === 3) {
      return (
        <>
          <span className="text-8xl">🥉</span>
          <h2 className="text-primary text-3xl font-bold mt-4 mb-2">Treće mesto!</h2>
          <p className="text-primary text-xl">Sjajno! Osvojili ste treće mesto!</p>
        </>
      );
    } else {
      return (
        <>
          <span className="text-8xl">👏</span>
          <h2 className="text-primary text-3xl font-bold mt-4 mb-2">Hvala na učešću!</h2>
          <p className="text-primary text-xl">Vidimo se sledeći put!</p>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h1 className="text-primary text-4xl font-bold mb-6">
        {teamName}
      </h1>
      
      <div className="flex flex-col items-center">
        {renderResult()}
      </div>
      
      {/* Ovde bi trebalo da bude animacija maskote */}
      <div className="w-48 h-48 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mt-8">
        <p className="text-primary">Maskota tima</p>
      </div>
    </div>
  );
};

export default WinnersPage; 