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
const GAME_VERSION = "1.0.3";
// Maximum time for which team data is considered "fresh" (24h in milliseconds)
const MAX_TEAM_FRESHNESS = 24 * 60 * 60 * 1000;
// Heartbeat interval in milliseconds
const HEARTBEAT_INTERVAL = 3000;

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
  lastSyncTime: number;
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
  lastSyncTime: 0,
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
  const [isConnected, setIsConnected] = useState(true);
  
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

  // Heartbeat check to verify Firebase connection
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      // If we haven't received a game update in over 10 seconds, try to refresh
      const now = Date.now();
      if (gameState.lastSyncTime > 0 && now - gameState.lastSyncTime > 10000) {
        console.log('No game updates recently, checking connection...');
        
        get(gameRef)
          .then(snapshot => {
            if (snapshot.exists()) {
              // Connection is working, update the game state
              const gameData = snapshot.val() as Game;
              updateGameStateFromServer(gameData);
              setIsConnected(true);
            }
          })
          .catch(error => {
            console.error('Connection check failed:', error);
            setIsConnected(false);
          });
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeatInterval);
  }, [gameState.lastSyncTime]);

  // Function to update game state from server data
  const updateGameStateFromServer = (gameData: Game) => {
    setServerGameData(gameData);
    
    setGameState(prev => ({
      ...prev,
      isGameStarted: gameData.isActive,
      currentCategory: gameData.currentCategory,
      currentRound: gameData.currentRound,
      status: gameData.status,
      // Preserve the gameCode if we already have one, or use the one from gameData, or null
      gameCode: prev.gameCode || (gameData.gameCode ? gameData.gameCode : null),
      lastSyncTime: Date.now()
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
              } as Question,
              lastSyncTime: Date.now()
            }));
          }
        })
        .catch(error => console.error('Error loading question:', error));
    } else {
      setGameState(prev => ({
        ...prev,
        currentQuestion: null,
        lastSyncTime: Date.now()
      }));
    }
  };

  // Listen for global game state changes
  useEffect(() => {
    console.log('Setting up real-time game state listener');
    
    const gameListener = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val() as Game;
        console.log('Game update received:', gameData.status);
        updateGameStateFromServer(gameData);
        setIsConnected(true);
      }
    }, (error) => {
      console.error('Game listener error:', error);
      setIsConnected(false);
    });
    
    return () => {
      console.log('Cleaning up game state listener');
      off(gameRef);
    };
  }, []);
  
  // Specifically watch for game start to immediately transition waiting players
  useEffect(() => {
    const handleGameStart = () => {
      // Check if we're on a player waiting screen
      const currentPath = location.pathname;
      if (gameState.isRegistered && 
          gameState.teamId && 
          (currentPath === '/player/waiting' || currentPath === '/player/waiting') && 
          gameState.isGameStarted) {
        console.log('Game started while on waiting screen, redirecting to category');
        navigate('/player/category');
      }
    };

    // Set up a periodic check for game start status specifically
    const gameStartInterval = setInterval(() => {
      if (gameState.isRegistered && gameState.teamId) {
        get(gameRef)
          .then(snapshot => {
            if (snapshot.exists()) {
              const gameData = snapshot.val() as Game;
              if (gameData.isActive && !gameState.isGameStarted) {
                console.log('Game start detected in interval check');
                setGameState(prev => ({
                  ...prev,
                  isGameStarted: true,
                  status: gameData.status,
                  lastSyncTime: Date.now()
                }));
                handleGameStart();
              }
            }
          })
          .catch(error => console.error('Game start check error:', error));
      }
    }, 1500); // Check more frequently specifically for game start

    return () => clearInterval(gameStartInterval);
  }, [gameState.isRegistered, gameState.teamId, gameState.isGameStarted, location.pathname, navigate]);
  
  // Handle navigation based on game state changes
  useEffect(() => {
    // Don't navigate unless the player is registered
    if (!gameState.isRegistered || !gameState.teamId) return;
    
    // Get path without the leading slash
    const currentPath = location.pathname.replace(/^\//, '');
    
    // Only handle navigation for player routes
    if (!currentPath.startsWith('player')) return;
    
    console.log('Checking navigation based on game state:', {
      path: currentPath,
      status: gameState.status,
      isGameStarted: gameState.isGameStarted
    });
    
    // Handle game start - redirect to category page (skip quiz-starting)
    if (gameState.isGameStarted && 
        (currentPath === 'player' || currentPath === 'player/join' || currentPath === 'player/waiting')) {
      console.log('Game started while on waiting/join page, redirecting to category');
      navigate('/player/category');
      return;
    }
    
    // Handle category change
    if (gameState.status === 'category' && currentPath !== 'player/category') {
      setSubmittedAnswer(false);
      navigate('/player/category');
      return;
    }
    
    // Handle question display
    if (gameState.status === 'question' && currentPath !== 'player/question') {
      setSubmittedAnswer(false);
      console.log('Game status is question, navigating to question display page');
      navigate('/player/question');
      return;
    }
    
    // If player has already submitted an answer and status is still question, wait for results
    if (gameState.status === 'question' && submittedAnswer && currentPath !== 'player/waiting-answer') {
      navigate('/player/waiting-answer');
      return;
    }
    
    // Handle showing results
    if (gameState.status === 'results' && currentPath !== 'player/points') {
      navigate('/player/points');
      return;
    }
    
    // Handle leaderboard
    if (gameState.status === 'leaderboard' && currentPath !== 'player/team-points') {
      navigate('/player/team-points');
      return;
    }
    
    // Handle game end
    if (gameState.status === 'finished' && currentPath !== 'player/winners') {
      navigate('/player/winners');
      return;
    }
    
  }, [
    gameState.isGameStarted, 
    gameState.isRegistered, 
    gameState.teamId, 
    gameState.currentCategory,
    gameState.status,
    gameState.currentQuestion?.id,
    gameState.lastSyncTime,
    location.pathname,
    navigate,
    submittedAnswer
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
                gameCode: savedGameCode,
                lastSyncTime: Date.now()
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
        gameCode,
        lastSyncTime: Date.now()
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
        points: newPoints,
        lastSyncTime: Date.now()
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
        mascotId: newMascotId,
        lastSyncTime: Date.now()
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
      {/* Show connection warning if disconnected */}
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-secondary text-white py-1 text-center text-sm z-50">
          Sinhronizacija u toku... Molimo sačekajte.
        </div>
      )}
      {children}
    </GameContext.Provider>
  );
};