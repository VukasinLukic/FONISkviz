import { useState, useEffect } from 'react';
import { ref, set, remove, get, query, orderByChild, equalTo, onValue, DataSnapshot, Database } from 'firebase/database';
import { getDb } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface DevToolsProps {
  gameCode: string;
}

interface Team {
  id: string;
  name: string;
  gameCode: string;
  mascot: string;
  isActive: boolean;
  lastSeen?: number;
}

export default function DevTools({ gameCode }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [dbInstance, setDbInstance] = useState<Database | null>(null);

  // Fetch DB instance
  useEffect(() => {
    const fetchDb = async () => {
      const db = await getDb();
      setDbInstance(db);
    };
    fetchDb();
  }, []);

  // Fetch teams data
  useEffect(() => {
    if (!isOpen || !dbInstance) return;

    const teamsQuery = query(
      ref(dbInstance, 'teams'),
      orderByChild('gameCode'),
      equalTo(gameCode)
    );

    const unsubscribe = onValue(teamsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setTeams(teamsData);
      } else {
        setTeams([]);
      }
    });

    return () => unsubscribe();
  }, [gameCode, isOpen, dbInstance]);

  // Reset entire game state
  const handleResetGame = async () => {
    if (!window.confirm('Are you sure you want to reset the game? This will remove all players and game data.')) {
      return;
    }
    
    setLoading(true);
    try {
      if (!dbInstance) throw new Error("DB not initialized");
      // Remove game data
      await remove(ref(dbInstance, `game/${gameCode}`));
      
      // Remove all teams for this game
      const teamsSnapshot = await get(ref(dbInstance, 'teams'));
      if (teamsSnapshot.exists()) {
        const teams = teamsSnapshot.val();
        const gameTeams = Object.entries(teams)
          .filter(([_, team]: [string, any]) => team.gameCode === gameCode);
        
        for (const [teamId] of gameTeams) {
          await remove(ref(dbInstance, `teams/${teamId}`));
        }
      }
      
      // Remove answers
      await remove(ref(dbInstance, `answers/${gameCode}`));
      
      // Remove scores
      await remove(ref(dbInstance, `scores/${gameCode}`));
      
      // Clear local storage
      localStorage.removeItem('gameCode');
      localStorage.removeItem('teamId');
      localStorage.removeItem('teamName');
      localStorage.removeItem('isAdmin');
      
      // Navigate to home
      navigate('/');
      
    } catch (error) {
      console.error('Error resetting game:', error);
      alert('Failed to reset game. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Force change game state
  const handleForceGameState = async (status: string) => {
    try {
      if (!dbInstance) throw new Error("DB not initialized");
      const gameRef = ref(dbInstance, `game/${gameCode}`);
      const snapshot = await get(gameRef);
      if (snapshot.exists()) {
        await set(ref(dbInstance, `game/${gameCode}/status`), status);
      }
    } catch (error) {
      console.error('Error changing game state:', error);
      alert('Failed to change game state');
    }
  };

  // Kick player
  const handleKickPlayer = async (teamId: string) => {
    try {
      if (!dbInstance) throw new Error("DB not initialized");
      await remove(ref(dbInstance, `teams/${teamId}`));
      alert('Player kicked successfully');
    } catch (error) {
      console.error('Error kicking player:', error);
      alert('Failed to kick player');
    }
  };

  // Force player state
  const handleForcePlayerState = async (teamId: string, state: string) => {
    try {
      if (!dbInstance) throw new Error("DB not initialized");
      await set(ref(dbInstance, `teams/${teamId}/currentState`), state);
      alert('Player state updated successfully');
    } catch (error) {
      console.error('Error updating player state:', error);
      alert('Failed to update player state');
    }
  };

  // Reset player
  const handleResetPlayer = async (teamId: string) => {
    try {
      if (!dbInstance) throw new Error("DB not initialized");
      const teamRef = ref(dbInstance, `teams/${teamId}`);
      const snapshot = await get(teamRef);
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        await set(teamRef, {
          ...teamData,
          currentState: 'waiting',
          lastAnswer: null,
          score: 0
        });
      }
      alert('Player reset successfully');
    } catch (error) {
      console.error('Error resetting player:', error);
      alert('Failed to reset player');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50 hover:bg-red-600"
      >
        🛠️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl z-50 w-96 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Dev Tools</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Game Controls */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-600">Game Controls</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetGame}
              disabled={loading}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Reset Game
            </button>
          </div>
        </div>

        {/* Game State Controls */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-600">Force Game State</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleForceGameState('waiting')}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Waiting
            </button>
            <button
              onClick={() => handleForceGameState('question_display')}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Question
            </button>
            <button
              onClick={() => handleForceGameState('answer_collection')}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Answers
            </button>
            <button
              onClick={() => handleForceGameState('answer_reveal')}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Reveal
            </button>
            <button
              onClick={() => handleForceGameState('game_end')}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              End Game
            </button>
          </div>
        </div>

        {/* Team Management */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-600">Team Management</h4>
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="bg-gray-50 p-2 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{team.name}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleKickPlayer(team.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Kick
                    </button>
                    <button
                      onClick={() => handleResetPlayer(team.id)}
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>ID: {team.id}</p>
                  <p>Mascot: {team.mascot}</p>
                  <p>Active: {team.isActive ? 'Yes' : 'No'}</p>
                  {team.lastSeen && (
                    <p>Last Seen: {new Date(team.lastSeen).toLocaleString()}</p>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleForcePlayerState(team.id, 'waiting')}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Force Waiting
                  </button>
                  <button
                    onClick={() => handleForcePlayerState(team.id, 'playing')}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Force Playing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500">
          <p>Game Code: {gameCode}</p>
          <p>Admin Mode: {localStorage.getItem('isAdmin') ? 'Yes' : 'No'}</p>
          <p>Total Teams: {teams.length}</p>
        </div>
      </div>
    </div>
  );
} 