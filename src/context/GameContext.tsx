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
    if (gameState.status === 'results' && currentPath !== 'player/results') {
      navigate('/player/results');
    }
    
    // Handle leaderboard
    if (gameState.status === 'leaderboard' && currentPath !== 'player/leaderboard') {
      navigate('/player/leaderboard');
    }
    
    // Handle game end
    if (gameState.status === 'finished' && currentPath !== 'player/finished') {
      navigate('/player/finished');
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
              
              // Listen for changes to this team
              const teamListener = onValue(ref(db, `teams/${savedTeamId}`), (teamSnapshot) => {
                if (teamSnapshot.exists()) {
                  const updatedTeam = teamSnapshot.val() as Team;
                  setGameState(prev => ({
                    ...prev,
                    points: updatedTeam.points,
                    mascotId: updatedTeam.mascotId,
                  }));
                }
              });
              
              return () => {
                off(ref(db, `teams/${savedTeamId}`));
              };
            } else {
              // Team exists but doesn't match the current game
              localStorage.removeItem('teamId');
              localStorage.removeItem('gameCode');
            }
          } else {
            // Team doesn't exist anymore
            localStorage.removeItem('teamId');
            localStorage.removeItem('gameCode');
          }
        })
        .catch(error => {
          console.error('Error verifying team:', error);
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
    setLoading(true);
    try {
      // Create new team entry
      const newTeam: Omit<Team, 'id'> = {
        name,
        mascotId,
        points: 0,
        joinedAt: Date.now(),
        isActive: true,
        gameCode
      };
      
      // Push to Firebase
      const newTeamRef = push(teamsRef);
      const teamId = newTeamRef.key as string;
      
      // Update with ID
      await update(newTeamRef, {
        id: teamId
      });
      
      // Save to local storage
      localStorage.setItem('teamId', teamId);
      localStorage.setItem('gameCode', gameCode);
      
      // Update context
      setGameState(prev => ({
        ...prev,
        teamId,
        teamName: name,
        mascotId,
        isRegistered: true,
        gameCode
      }));
      
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
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  };
  
  const updateMascot = async (newMascotId: number): Promise<void> => {
    if (!gameState.teamId) return;
    
    try {
      await update(ref(db, `teams/${gameState.teamId}`), {
        mascotId: newMascotId
      });
      
      setGameState(prev => ({
        ...prev,
        mascotId: newMascotId
      }));
    } catch (error) {
      console.error('Error updating mascot:', error);
      throw error;
    }
  };
  
  const resetGame = () => {
    // Clear localStorage
    localStorage.removeItem('teamId');
    localStorage.removeItem('gameCode');
    
    // Reset state
    setGameState(defaultGameState);
    setSubmittedAnswer(false);
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