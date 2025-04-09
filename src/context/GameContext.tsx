// src/context/GameContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  db, 
  Team as FirebaseTeam, 
  Game as FirebaseGame,
  teamsRef, 
  gameRef, 
  createTeam, 
  updateTeam, 
  updateGame, 
  initializeGameState 
} from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Use the Firebase types directly
export type Team = FirebaseTeam;
export type Game = FirebaseGame;

// Definicija tipa za stanje igre
interface GameState {
  teams: Team[];
  currentTeam: Team | null;
  currentRound: number;
  isGameStarted: boolean;
  currentCategory: string;
  totalRounds: number;
  status: FirebaseGame['status'];
}

// Definicija tipa za kontekst
interface GameContextType {
  gameState: GameState;
  registerTeam: (name: string, gameCode?: string) => Promise<Team>;
  updateTeamPoints: (teamId: string, points: number) => Promise<void>;
  updateTeamMascot: (teamId: string, mascotId: number) => Promise<void>;
  updateCurrentCategory: (category: string) => Promise<void>;
  updateGameStatus: (status: FirebaseGame['status']) => Promise<void>;
}

// Kreiranje konteksta
const GameContext = createContext<GameContextType | undefined>(undefined);

// Hook za korišćenje konteksta
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

// Provider komponenta
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>({
    teams: [],
    currentTeam: null,
    currentRound: 0,
    isGameStarted: false,
    currentCategory: '',
    totalRounds: 8,
    status: 'waiting',
  });

  // Funkcija za registraciju novog tima
  const registerTeam = async (name: string, gameCode?: string): Promise<Team> => {
    // Create the team in Firebase
    const newTeamData: Omit<Team, 'id'> = {
      name,
      mascotId: 0, // Početna vrednost - nije izabrana maskota
      points: 0,
      joinedAt: Date.now(),
      isActive: true,
      gameCode: gameCode || undefined // Add the game code if provided
    };
    
    const teamId = await createTeam(newTeamData);
    const newTeam: Team = { ...newTeamData, id: teamId };
    
    // Set current team locally - Firebase listener will update the teams array
    setGameState(prev => ({
      ...prev,
      currentTeam: newTeam,
    }));

    return newTeam;
  };

  // Funkcija za ažuriranje poena tima
  const updateTeamPoints = async (teamId: string, points: number): Promise<void> => {
    // Get the existing team first to update the points accurately
    const teamToUpdate = gameState.teams.find(t => t.id === teamId);
    
    if (teamToUpdate) {
      const newPoints = teamToUpdate.points + points;
      await updateTeam(teamId, { points: newPoints });
      
      // Firebase listener will update the state automatically
    }
  };

  // Funkcija za ažuriranje maskote tima
  const updateTeamMascot = async (teamId: string, mascotId: number): Promise<void> => {
    await updateTeam(teamId, { mascotId });
    
    // If this is the current team, update it locally as well
    if (gameState.currentTeam && gameState.currentTeam.id === teamId) {
      setGameState(prev => ({
        ...prev,
        currentTeam: {
          ...prev.currentTeam!,
          mascotId
        }
      }));
    }
  };

  // Funkcija za ažuriranje trenutne kategorije
  const updateCurrentCategory = async (category: string): Promise<void> => {
    await updateGame({ currentCategory: category });
    // Firebase listener will update the state
  };
  
  // Funkcija za ažuriranje statusa igre
  const updateGameStatus = async (status: FirebaseGame['status']): Promise<void> => {
    await updateGame({ status });
    // Firebase listener will update the state
  };

  // Initialize Firebase listeners
  useEffect(() => {
    // Initialize the game state if it doesn't exist
    initializeGameState();
    
    // Listen for teams changes
    const teamsListener = onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.val() || {};
        const teams = Object.values(teamsData) as Team[];
        
        setGameState(prev => {
          // If we have a currentTeam, make sure it's updated
          let updatedCurrentTeam = prev.currentTeam;
          
          if (prev.currentTeam) {
            const updatedTeamData = teams.find(t => t.id === prev.currentTeam?.id);
            if (updatedTeamData) {
              updatedCurrentTeam = updatedTeamData;
            }
          }
          
          return {
            ...prev,
            teams,
            currentTeam: updatedCurrentTeam
          };
        });
      } else {
        setGameState(prev => ({
          ...prev,
          teams: []
        }));
      }
    });
    
    // Listen for game state changes
    const gameListener = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val() as FirebaseGame;
        
        setGameState(prev => ({
          ...prev,
          currentRound: gameData.currentRound,
          isGameStarted: gameData.isActive,
          currentCategory: gameData.currentCategory,
          totalRounds: gameData.totalRounds,
          status: gameData.status
        }));
      }
    });
    
    // Cleanup listeners on unmount
    return () => {
      off(teamsRef);
      off(gameRef);
    };
  }, []);

  const value = {
    gameState,
    registerTeam,
    updateTeamPoints,
    updateTeamMascot,
    updateCurrentCategory,
    updateGameStatus
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};