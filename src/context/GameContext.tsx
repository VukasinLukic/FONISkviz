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
  answersRef,
  getTeam,
  getGame
} from '../lib/firebase';
import { ref, onValue, off, update, get, push, serverTimestamp } from 'firebase/database';

// Game version constant - update when local storage data structure changes
const GAME_VERSION = "1.0.2";
// Maximum time for which team data is considered "fresh" (24h in milliseconds)
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

  // Function to validate localStorage data
  const validateLocalStorageData = (): boolean => {
    const savedVersion = localStorage.getItem('gameVersion');
    const savedTimestamp = localStorage.getItem('lastUpdated');
    const savedTeamId = localStorage.getItem('teamId');
    const savedGameCode = localStorage.getItem('gameCode');
    
    // Check app version
    if (!savedVersion || savedVersion !== GAME_VERSION) {
      console.log('Game version has changed, resetting localStorage');
      return false;
    }
    
    // Check data freshness
    if (savedTimestamp) {
      const lastUpdated = parseInt(savedTimestamp, 10);
      const now = Date.now();
      
      // If data is older than MAX_TEAM_FRESHNESS, invalidate it
      if (now - lastUpdated > MAX_TEAM_FRESHNESS) {
        console.log('Data is too old, resetting localStorage');
        return false;
      }
    } else {
      // No timestamp, data is invalid
      return false;
    }
    
    // Check required data
    if (!savedTeamId || !savedGameCode) {
      return false;
    }
    
    return true;
  };
  
  // Function to save data to localStorage with timestamp
  const saveToLocalStorage = (key: string, value: string) => {
    localStorage.setItem(key, value);
    localStorage.setItem('lastUpdated', Date.now().toString());
    localStorage.setItem('gameVersion', GAME_VERSION);
  };

  // Listen for global game state changes
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
          // Preserve the gameCode if we already have one, or use the one from gameData, or null
          gameCode: prev.gameCode || (gameData.gameCode ? gameData.gameCode : null)
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
    // Validate localStorage data
    if (!validateLocalStorageData()) {
      console.log('Data in localStorage is invalid, resetting...');
      resetGame();
      return;
    }
    
    const savedTeamId = localStorage.getItem('teamId');
    const savedGameCode = localStorage.getItem('gameCode');
    
    if (savedTeamId && savedGameCode) {
      setLoading(true);
      
      // Verify both the team and current game exist
      Promise.all([
        getTeam(savedTeamId),
        getGame()
      ])
        .then(([team, game]) => {
          if (team && game) {
            // Verify the team belongs to the current game
            if (team.gameCode === savedGameCode && game.gameCode === savedGameCode) {
              // Valid team and game code, restore session
              setGameState(prev => ({
                ...prev,
                teamId: savedTeamId,
                teamName: team.name,
                mascotId: team.mascotId,
                isRegistered: true,
                points: team.points,
                isGameStarted: game.isActive,
                currentCategory: game.currentCategory,
                currentRound: game.currentRound,
                status: game.status,
                gameCode: savedGameCode
              }));
              
              // If the game already started, check current status for navigation
              if (game.isActive) {
                console.log('Game is active, status:', game.status);
                // Navigation will be handled by the status effect above
              } else {
                // Game not started, go to waiting room
                navigate('/player/waiting');
              }
              
              // Update timestamp to keep session fresh
              saveToLocalStorage('lastUpdated', Date.now().toString());
            } else {
              // Game code mismatch - reset
              resetGame();
              console.log('Game code mismatch, resetting');
            }
          } else {
            // Team or game not found
            resetGame();
            console.log('Team or game not found, resetting');
          }
        })
        .catch(error => {
          console.error('Error restoring session:', error);
          resetGame();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []); // Empty deps to run once on mount
  
  // Register a new team
  const registerTeam = async (name: string, mascotId: number, gameCode: string): Promise<string> => {
    setLoading(true);
    
    try {
      // First check if the game code is valid
      const gameSnapshot = await get(gameRef);
      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }
      
      const game = gameSnapshot.val() as Game;
      if (game.gameCode !== gameCode) {
        throw new Error('Invalid game code. Please check and try again.');
      }
      
      // Create the team in Firebase
      const newTeamRef = push(teamsRef);
      const teamId = newTeamRef.key as string;
      
      // Format team name to prevent potentially unsafe characters
      const formattedName = name.trim();
      
      const teamData: Team = {
        id: teamId,
        name: formattedName,
        mascotId: mascotId,
        points: 0,
        joinedAt: Date.now(),
        isActive: true,
        gameCode: gameCode
      };
      
      await update(newTeamRef, teamData);
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        teamId,
        teamName: formattedName,
        mascotId,
        isRegistered: true,
        gameCode
      }));
      
      // Save to localStorage for persistence
      saveToLocalStorage('teamId', teamId);
      saveToLocalStorage('teamName', formattedName);
      saveToLocalStorage('mascotId', mascotId.toString());
      saveToLocalStorage('gameCode', gameCode);
      
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
      // Update in Firebase
      await update(ref(db, `teams/${gameState.teamId}`), {
        points: newPoints
      });
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        points: newPoints
      }));
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  };

  const updateMascot = async (newMascotId: number): Promise<void> => {
    if (!gameState.teamId) {
      throw new Error('No team registered');
    }
    
    try {
      // Update in Firebase
      await update(ref(db, `teams/${gameState.teamId}`), {
        mascotId: newMascotId
      });
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        mascotId: newMascotId
      }));
      
      // Save to localStorage
      saveToLocalStorage('mascotId', newMascotId.toString());
      
      // Navigate to waiting room
      navigate('/player/waiting');
    } catch (error) {
      console.error('Error updating mascot:', error);
      throw error;
    }
  };

  const resetGame = () => {
    // Clear local state
    setGameState(defaultGameState);
    setSubmittedAnswer(false);
    
    // Clear localStorage
    localStorage.removeItem('teamId');
    localStorage.removeItem('teamName');
    localStorage.removeItem('mascotId');
    localStorage.removeItem('gameCode');
    localStorage.removeItem('lastUpdated');
    localStorage.removeItem('gameVersion');
    
    // Don't navigate here - let the component handle navigation
  };

  const submitAnswer = async (questionId: string, answer: string): Promise<void> => {
    if (!gameState.teamId || !questionId) {
      throw new Error('Missing team ID or question ID');
    }
    
    if (submittedAnswer) {
      console.log('Answer already submitted, ignoring');
      return;
    }
    
    try {
      // Prepare answer data
      const answerData = {
        teamId: gameState.teamId,
        questionId,
        answer,
        answeredAt: Date.now(),
        isCorrect: false, // Will be updated by server
        pointsEarned: 0   // Will be updated by server
      };
      
      // Submit to Firebase
      const newAnswerRef = push(answersRef);
      await update(newAnswerRef, answerData);
      
      // Mark as submitted locally
      setSubmittedAnswer(true);
      
      // Navigate to waiting for results screen
      navigate('/player/waiting-answer');
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider 
      value={{
        gameState,
        registerTeam,
        updatePoints,
        updateMascot,
        resetGame,
        submittedAnswer,
        submitAnswer,
        loading
      }}
    >
      {children}
    </GameContext.Provider>
  );
};