import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { getDatabase, ref, get, query, orderByChild } from 'firebase/database';
import { DataSnapshot } from 'firebase/database';

interface WinnersPageProps {}

interface TeamData {
  id: string;
  name: string;
  points: number;
  mascotId: number;
}

const WinnersPage: React.FC<WinnersPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState } = useGameContext();
  const [position, setPosition] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  // Get real team data from context
  const teamName = gameState.teamName || "Vaš Tim";
  
  useEffect(() => {
    const fetchTeamRanking = async () => {
      if (!gameState.teamId || !gameState.gameCode) {
        setLoading(false);
        return;
      }
      
      try {
        // Get all teams for the current game and sort by points
        const db = getDatabase();
        const teamsRef = ref(db, 'teams');
        const teamsQuery = query(teamsRef, orderByChild('gameCode'));
        const snapshot = await get(teamsQuery);
        
        if (!snapshot.exists()) {
          setPosition(1); // If no teams found, we're first by default
          setLoading(false);
          return;
        }
        
        // Convert to array and sort by points (highest first)
        const teams: TeamData[] = [];
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const team = childSnapshot.val();
          if (team.gameCode === gameState.gameCode) {
            teams.push(team);
          }
        });
        
        // Sort teams by points (descending)
        teams.sort((a, b) => b.points - a.points);
        
        // Find current team's position (1-indexed)
        const teamIndex = teams.findIndex(team => team.id === gameState.teamId);
        if (teamIndex !== -1) {
          setPosition(teamIndex + 1);
        } else {
          setPosition(teams.length + 1); // If not found, place last
        }
      } catch (error) {
        console.error('Error fetching team ranking:', error);
        // Fallback to a simple position calculation
        if (gameState.points && gameState.points > 30) {
          setPosition(1);
        } else if (gameState.points && gameState.points > 20) {
          setPosition(2);
        } else {
          setPosition(3);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamRanking();
  }, [gameState.teamId, gameState.gameCode, gameState.points]);
  
  // Funkcija za prikaz odgovarajuće medalje i poruke
  const renderResult = () => {
    if (loading) {
      return <p className="text-primary text-xl">Učitavanje rezultata...</p>;
    }
    
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
          {position > 0 && (
            <p className="text-primary text-lg mt-2">Vaše mesto: {position}.</p>
          )}
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
      
      {/* Display team points */}
      <div className="mt-4 mb-4">
        <p className="text-primary text-xl font-semibold">
          Ukupno poena: {gameState.points || 0}
        </p>
      </div>
      
      {/* Display team mascot */}
      <div className="w-48 h-48 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center mt-4">
        {gameState.mascotId ? (
          <img 
            src={`/assets/maskota${gameState.mascotId} 1.svg`} 
            alt="Team mascot" 
            className="w-40 h-40 object-contain"
            onError={() => console.log("Mascot image failed to load")}
          />
        ) : (
          <p className="text-primary">Maskota tima</p>
        )}
      </div>
    </div>
  );
};

export default WinnersPage; 