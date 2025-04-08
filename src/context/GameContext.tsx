// src/context/GameContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Definicija tipa za tim
interface Team {
  id: string;
  name: string;
  mascotId: number; // ID maskote (1-4)
  points: number;
  joinedAt: number; // timestamp
  isActive: boolean;
}

// Definicija tipa za stanje igre
interface GameState {
  teams: Team[];
  currentTeam: Team | null;
  currentRound: number;
  isGameStarted: boolean;
  currentCategory: string;
  totalRounds: number;
}

// Definicija tipa za kontekst
interface GameContextType {
  gameState: GameState;
  registerTeam: (name: string) => Promise<Team>;
  updateTeamPoints: (teamId: string, points: number) => Promise<void>;
  updateTeamMascot: (teamId: string, mascotId: number) => Promise<void>;
  updateCurrentCategory: (category: string) => Promise<void>;
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
  });

  // Funkcija za registraciju novog tima
  const registerTeam = async (name: string) => {
    const newTeam: Team = {
      id: crypto.randomUUID(), // Kasnije će ovo biti Firebase ID
      name,
      mascotId: 0, // Početna vrednost - nije izabrana maskota
      points: 0,
      joinedAt: Date.now(),
      isActive: true
    };

    // TODO: Dodati Firebase kod ovde
    // const teamRef = await addDoc(collection(db, 'teams'), newTeam);
    // newTeam.id = teamRef.id;

    setGameState(prev => ({
      ...prev,
      currentTeam: newTeam,
      teams: [...prev.teams, newTeam],
    }));

    return newTeam;
  };

  // Funkcija za ažuriranje poena tima
  const updateTeamPoints = async (teamId: string, points: number) => {
    // TODO: Dodati Firebase kod ovde
    // await updateDoc(doc(db, 'teams', teamId), {
    //   points: increment(points)
    // });

    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map(team => {
        if (team.id === teamId) {
          const updatedTeam = { 
            ...team, 
            points: team.points + points,
          };
          
          if (prev.currentTeam?.id === teamId) {
            prev.currentTeam = updatedTeam;
          }
          
          return updatedTeam;
        }
        return team;
      }),
    }));
  };

  // Funkcija za ažuriranje maskote tima
  const updateTeamMascot = async (teamId: string, mascotId: number) => {
    // TODO: Dodati Firebase kod ovde
    // await updateDoc(doc(db, 'teams', teamId), {
    //   mascotId: mascotId
    // });

    setGameState(prev => {
      // Prvo ažuriramo tim u teams nizu
      const updatedTeams = prev.teams.map(team => {
        if (team.id === teamId) {
          return { 
            ...team, 
            mascotId: mascotId,
          };
        }
        return team;
      });

      // Ažuriramo i currentTeam ako je potrebno
      let updatedCurrentTeam = prev.currentTeam;
      if (prev.currentTeam && prev.currentTeam.id === teamId) {
        updatedCurrentTeam = {
          ...prev.currentTeam,
          mascotId: mascotId
        };
      }

      // Vraćamo ažurirano stanje
      return {
        ...prev,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      };
    });
  };

  // Funkcija za ažuriranje trenutne kategorije
  const updateCurrentCategory = async (category: string) => {
    // TODO: Dodati Firebase kod ovde
    // await updateDoc(doc(db, 'game', 'currentGame'), {
    //   currentCategory: category
    // });

    setGameState(prev => ({
      ...prev,
      currentCategory: category,
    }));
  };

  // Listener za promene u Firebase-u
  useEffect(() => {
    // TODO: Dodati Firebase listener ovde
    // const unsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
    //   const teamsData = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...doc.data()
    //   })) as Team[];
    //   
    //   setGameState(prev => ({
    //     ...prev,
    //     teams: teamsData
    //   }));
    // });
    //
    // return () => unsubscribe();
  }, []);

  const value = {
    gameState,
    registerTeam,
    updateTeamPoints,
    updateTeamMascot,
    updateCurrentCategory,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};