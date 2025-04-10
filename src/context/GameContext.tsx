// src/context/GameContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Team, 
  Game,
  Question,
  Answer,
  db,
  gameRef, 
  teamsRef,
  questionsRef,
  answersRef
} from '../lib/firebase';
import { ref, onValue, off, update, get, push, serverTimestamp } from 'firebase/database';

// Konstanta za verziju igre - menjati kad god se promeni struktura lokalnih podataka
const GAME_VERSION = "1.0.1";
// Maksimalno vreme za koje se smatra da je tim "svež" (24h u milisekundama)
const MAX_TEAM_FRESHNESS = 24 * 60 * 60 * 1000;

type GameState = {
  teamId: string | null;
  teamName: string;
  mascotId: number;
  isRegistered: boolean;
  points: number;
  isGameStarted: boolean;
  currentCategory: string;
  currentRound: number;
  currentQuestion: Question | null;
  status: string;
  gameCode: string | null;
};

type GameContextType = {
  gameState: GameState;
  registerTeam: (name: string, mascotId: number, gameCode: string) => Promise<string>;
  updatePoints: (newPoints: number) => Promise<void>;
  updateMascot: (newMascotId: number) => Promise<void>;
  resetGame: () => void;
  submittedAnswer: boolean;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  loading: boolean;
};

const defaultGameState: GameState = {
  teamId: null,
  teamName: '',
  mascotId: 1,
  isRegistered: false,
  points: 0,
  isGameStarted: false,
  currentCategory: '',
  currentRound: 0,
  currentQuestion: null,
  status: 'waiting',
  gameCode: null,
};

export const GameContext = createContext<GameContextType>({
  gameState: defaultGameState,
  registerTeam: async () => '',
  updatePoints: async () => {},
  updateMascot: async () => {},
  resetGame: () => {},
  submittedAnswer: false,
  submitAnswer: async () => {},
  loading: false,
});

export const useGameContext = () => useContext(GameContext);

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverGameData, setServerGameData] = useState<Game | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Funkcija za proveru validnosti podataka u localStorage
  const validateLocalStorageData = (): boolean => {
    const savedVersion = localStorage.getItem('gameVersion');
    const savedTimestamp = localStorage.getItem('lastUpdated');
    const savedTeamId = localStorage.getItem('teamId');
    const savedGameCode = localStorage.getItem('gameCode');
    
    // Provera verzije aplikacije
    if (!savedVersion || savedVersion !== GAME_VERSION) {
      console.log('Verzija igre je promenjena, resetujem localStorage');
      return false;
    }
    
    // Provera svežine podataka
    if (savedTimestamp) {
      const lastUpdated = parseInt(savedTimestamp, 10);
      const now = Date.now();
      
      // Ako su podaci stariji od MAX_TEAM_FRESHNESS, poništi ih
      if (now - lastUpdated > MAX_TEAM_FRESHNESS) {
        console.log('Podaci su zastareli, resetujem localStorage');
        return false;
      }
    } else {
      // Ako nema timestamp-a, podaci nisu validni
      return false;
    }
    
    // Provera neophodnih podataka
    if (!savedTeamId || !savedGameCode) {
      return false;
    }
    
    return true;
  };
  
  // Funkcija za čuvanje podataka u localStorage sa timestamp-om
  const saveToLocalStorage = (key: string, value: string) => {
    localStorage.setItem(key, value);
    localStorage.setItem('lastUpdated', Date.now().toString());
    localStorage.setItem('gameVersion', GAME_VERSION);
  };

  // Listen for game state changes
  useEffect(() => {
    const gameListener = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val() as Game;
        setServerGameData(gameData);
        
        // Update game state in our context
        setGameState(prev => ({
          ...prev,
          isGameStarted: gameData.isActive,
          currentCategory: gameData.currentCategory,
          currentRound: gameData.currentRound,
          status: gameData.status,
        }));
        
        // Load current question if there is one
        if (gameData.currentQuestion) {
          get(ref(db, `questions/${gameData.currentQuestion}`))
            .then((questionSnapshot) => {
              if (questionSnapshot.exists()) {
                const questionData = questionSnapshot.val();
                setGameState(prev => ({
                  ...prev,
                  currentQuestion: {
                    id: gameData.currentQuestion,
                    ...questionData
                  } as Question
                }));
              }
            })
            .catch(error => console.error('Error loading question:', error));
        } else {
          setGameState(prev => ({
            ...prev,
            currentQuestion: null
          }));
        }
      }
    });
    
    return () => {
      off(ref(db, 'game'));
    };
  }, []);
  
  // Handle navigation based on game state changes
  useEffect(() => {
    // Don't navigate unless the player is registered
    if (!gameState.isRegistered || !gameState.teamId) return;
    
    // Get path without the leading slash
    const currentPath = location.pathname.replace(/^\//, '');
    
    // Handle game start - redirect to quiz-starting page
    if (gameState.isGameStarted && 
        (currentPath === 'player' || currentPath === 'player/join' || currentPath === 'player/waiting')) {
      navigate('/player/quiz-starting');
    }
    
    // Handle category change
    if (gameState.status === 'category' && currentPath !== 'player/category') {
      setSubmittedAnswer(false);
      navigate('/player/category');
    }
    
    // Handle question display
    if (gameState.status === 'question' && currentPath !== 'player/answers') {
      setSubmittedAnswer(false);
      navigate('/player/answers');
    }
    
    // Handle showing results
    if (gameState.status === 'results' && currentPath !== 'player/answers') {
      navigate('/player/answers');
    }
    
    // Handle leaderboard
    if (gameState.status === 'leaderboard' && currentPath !== 'player/team-points') {
      navigate('/player/team-points');
    }
    
    // Handle game end
    if (gameState.status === 'finished' && currentPath !== 'player/winners') {
      navigate('/player/winners');
    }
    
  }, [
    gameState.isGameStarted, 
    gameState.isRegistered, 
    gameState.teamId, 
    gameState.currentCategory,
    gameState.status,
    gameState.currentQuestion?.id,
    location.pathname,
    navigate
  ]);
  
  // If player has teamId saved, check if it's still valid and load team data
  useEffect(() => {
    // Provera i validacija podataka iz localStorage
    if (!validateLocalStorageData()) {
      console.log('Podaci u localStorage nisu validni, resetujem...');
      resetGame();
      return;
    }
    
    const savedTeamId = localStorage.getItem('teamId');
    const savedGameCode = localStorage.getItem('gameCode');
    
    if (savedTeamId && savedGameCode) {
      setLoading(true);
      
      // Verify the team exists
      get(ref(db, `teams/${savedTeamId}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const teamData = snapshot.val() as Team;
            // Verify the team belongs to the current game
            if (teamData.gameCode === savedGameCode) {
              setGameState(prev => ({
                ...prev,
                teamId: savedTeamId,
                teamName: teamData.name,
                mascotId: teamData.mascotId,
                points: teamData.points,
                isRegistered: true,
                gameCode: savedGameCode
              }));
              
              // Osvežavanje timestamp-a za validne podatke
              saveToLocalStorage('teamId', savedTeamId);
              saveToLocalStorage('gameCode', savedGameCode);
              
              // Listen for changes to this team
              const teamListener = onValue(ref(db, `teams/${savedTeamId}`), (teamSnapshot) => {
                if (teamSnapshot.exists()) {
                  const updatedTeam = teamSnapshot.val() as Team;
                  setGameState(prev => ({
                    ...prev,
                    points: updatedTeam.points,
                    mascotId: updatedTeam.mascotId,
                  }));
                  
                  // Osvežavanje timestamp-a pri svakom ažuriranju tima
                  saveToLocalStorage('lastUpdated', Date.now().toString());
                } else {
                  // Tim više ne postoji, obrišimo podatke
                  resetGame();
                }
              });
              
              return () => {
                off(ref(db, `teams/${savedTeamId}`));
              };
            } else {
              // Team exists but doesn't match the current game
              resetGame();
            }
          } else {
            // Team doesn't exist anymore
            resetGame();
          }
        })
        .catch(error => {
          console.error('Error verifying team:', error);
          resetGame();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);
  
  // Check if player has already submitted an answer for current question
  useEffect(() => {
    if (!gameState.teamId || !gameState.currentQuestion?.id) {
      setSubmittedAnswer(false);
      return;
    }
    
    const checkAnswers = async () => {
      try {
        const answersSnapshot = await get(answersRef);
        if (answersSnapshot.exists()) {
          const answers = answersSnapshot.val() || {};
          
          // Check if this team has already answered current question
          const hasAnswered = Object.values(answers).some((answer: any) => {
            return answer.teamId === gameState.teamId && 
                  answer.questionId === gameState.currentQuestion?.id;
          });
          
          setSubmittedAnswer(hasAnswered);
        } else {
          setSubmittedAnswer(false);
        }
      } catch (error) {
        console.error('Error checking answers:', error);
        setSubmittedAnswer(false);
      }
    };
    
    checkAnswers();
  }, [gameState.teamId, gameState.currentQuestion?.id]);
  
  const registerTeam = async (name: string, mascotId: number, gameCode: string): Promise<string> => {
    try {
      setLoading(true);
      
      // Create a new team record in Firebase
      const newTeamRef = push(teamsRef);
      const teamId = newTeamRef.key as string;
      
      if (!teamId) throw new Error('Failed to generate team ID');
      
      // Set team data with the provided gameCode
      await update(newTeamRef, {
        id: teamId,
        name: name,
        mascotId: mascotId,
        points: 0,
        joinedAt: serverTimestamp(),
        isActive: true,
        gameCode: gameCode // Make sure gameCode is saved with the team
      });
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        teamId,
        teamName: name,
        mascotId,
        isRegistered: true,
        gameCode: gameCode // Add gameCode to the local state as well
      }));
      
      // Save to localStorage for persistence with timestamp
      saveToLocalStorage('teamId', teamId);
      saveToLocalStorage('gameCode', gameCode);
      saveToLocalStorage('teamName', name);
      
      console.log(`Team registered: ${name} (ID: ${teamId}, Game: ${gameCode})`);
      
      return teamId;
    } catch (error) {
      console.error('Error registering team:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updatePoints = async (newPoints: number): Promise<void> => {
    if (!gameState.teamId) return;
    
    try {
      await update(ref(db, `teams/${gameState.teamId}`), {
        points: newPoints
      });
      
      setGameState(prev => ({
        ...prev,
        points: newPoints
      }));
      
      // Osvežavanje timestamp-a
      saveToLocalStorage('lastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  };
  
  const updateMascot = async (newMascotId: number): Promise<void> => {
    if (!gameState.teamId) {
      console.error('Cannot update mascot: No team ID', gameState);
      throw new Error('No team ID available');
    }
    
    try {
      setLoading(true);
      console.log(`Starting mascot update for team ${gameState.teamId} to mascotId ${newMascotId}`);
      
      // Reference to the team in Firebase
      const teamRef = ref(db, `teams/${gameState.teamId}`);
      
      // First get the current team data to verify it exists
      const teamSnapshot = await get(teamRef);
      if (!teamSnapshot.exists()) {
        console.error(`Team with ID ${gameState.teamId} not found`);
        throw new Error('Team not found');
      }
      
      const currentTeamData = teamSnapshot.val();
      console.log('Current team data:', currentTeamData);
      
      // Update the mascot ID
      await update(teamRef, {
        mascotId: newMascotId
      });
      
      console.log(`Firebase update completed for team ${gameState.teamId}, mascotId=${newMascotId}`);
      
      // Verify the update was successful
      const updatedSnapshot = await get(teamRef);
      const updatedTeam = updatedSnapshot.val();
      console.log('Updated team data:', updatedTeam);
      
      if (updatedTeam.mascotId !== newMascotId) {
        console.error('Mascot update verification failed, Firebase data does not match expected value');
        throw new Error('Mascot update verification failed');
      }
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        mascotId: newMascotId
      }));
      
      // Osvežavanje timestamp-a
      saveToLocalStorage('lastUpdated', Date.now().toString());
      
      console.log('Mascot update complete and verified');
    } catch (error) {
      console.error('Error updating mascot:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const resetGame = () => {
    // Clear localStorage
    localStorage.removeItem('teamId');
    localStorage.removeItem('gameCode');
    localStorage.removeItem('teamName');
    localStorage.removeItem('lastUpdated');
    localStorage.removeItem('gameVersion');
    
    // Reset state
    setGameState(defaultGameState);
    setSubmittedAnswer(false);
    
    console.log('Game state reset successfully');
  };
  
  const submitAnswer = async (questionId: string, answer: string): Promise<void> => {
    if (!gameState.teamId) return;
    
    setLoading(true);
    try {
      const newAnswer: Omit<Answer, 'id' | 'isCorrect' | 'pointsEarned' | 'answeredAt'> = {
        teamId: gameState.teamId,
        questionId,
        answer: answer as 'A' | 'B' | 'C' | 'D' | null
      };
      
      await push(answersRef, newAnswer);
      setSubmittedAnswer(true);
      
      // Osvežavanje timestamp-a
      saveToLocalStorage('lastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    gameState,
    registerTeam,
    updatePoints,
    updateMascot,
    resetGame,
    submittedAnswer,
    submitAnswer,
    loading
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};