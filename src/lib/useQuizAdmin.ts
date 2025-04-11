import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  db, 
  gameRef, 
  teamsRef, 
  questionsRef,
  answersRef,
  Team, 
  Game, 
  Question,
  Answer
} from './firebase';
import { 
  startGame, 
  endGame, 
  setNextQuestion, 
  revealAnswers, 
  showLeaderboard, 
  moveToNextRound,
  seedQuestions,
  resetGame,
  CATEGORIES,
  getTeamsByPoints,
  getQuestionById,
  getAnswersForQuestion
} from './quizService';
import { ref, onValue, off, get, update, push, serverTimestamp, remove } from 'firebase/database';
import { useGameContext } from '../context/GameContext';

interface UseQuizAdminResult {
  teams: Team[];
  gameState: Game | null;
  currentQuestion: Question | null;
  teamAnswers: Answer[];
  topTeams: Team[];
  categories: string[];
  loading: boolean;
  
  // Game flow controls
  startNewGame: () => Promise<void>;
  endCurrentGame: () => Promise<void>;
  showNextQuestion: (customQuestion?: Partial<Question>) => Promise<void>;
  showResults: () => Promise<void>;
  showNextRound: () => Promise<void>;
  showFinalResults: () => Promise<void>;
  resetGameState: () => Promise<void>;
  createNewGame: () => Promise<void>;
  nextQuestion: (questionId: string) => Promise<void>;
  removeTestUsers: () => Promise<void>;
}

export const useQuizAdmin = (): UseQuizAdminResult => {
  const navigate = useNavigate();
  const { gameState: contextGameState } = useGameContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<Answer[]>([]);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref for the transition timer

  // Load initial data and setup listeners
  useEffect(() => {
    setLoading(true);
    
    // Initialize with sample questions if needed
    seedQuestions();
    
    // Listen for game state changes
    const gameListener = onValue(gameRef, async (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val() as Game;
        setGameState(gameData);
        
        // When the current question changes, load it and its answers
        if (gameData.currentQuestion) {
          const questionData = await getQuestionById(gameData.currentQuestion);
          setCurrentQuestion(questionData);
          
          // Load answers for this question
          const answers = await getAnswersForQuestion(gameData.currentQuestion);
          setTeamAnswers(answers);
        } else {
          setCurrentQuestion(null);
          setTeamAnswers([]);
        }
        
        // Navigate based on game status changes
        handleGameStateChange(gameData);
      } else {
        setGameState(null);
      }
    });
    
    // Listen for team changes
    const teamsListener = onValue(teamsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.val() || {};
        const teamsList = Object.values(teamsData) as Team[];
        
        // Filter teams by gameCode if available
        let filteredTeams = teamsList;
        if (gameState?.gameCode) {
          // Changed this filter to be more lenient - include teams with this gameCode 
          // or teams that may have been created before the gameCode system
          filteredTeams = teamsList.filter(team => 
            team.gameCode === gameState.gameCode || 
            !team.gameCode || // Include teams with no gameCode for backward compatibility
            team.gameCode === '' // Include teams with empty string gameCode
          );
        }
        
        // Sort teams by points
        filteredTeams.sort((a, b) => b.points - a.points);
        
        setTeams(filteredTeams);
        setTopTeams(filteredTeams.slice(0, 3)); // Top 3 teams
      } else {
        setTeams([]);
        setTopTeams([]);
      }
      
      setLoading(false);
    });
    
    // Cleanup on unmount
    return () => {
      off(ref(db, 'game'));
      off(ref(db, 'teams'));
    };
  }, [gameState?.gameCode]);
  
  // Effect to handle scheduled transitions
  useEffect(() => {
    // Clear any existing timer if state changes
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    // Check if a transition is scheduled
    if (gameState && gameState.transitionScheduledAt && gameState.transitionDuration) {
      // We will calculate the exact delay inside the timer callback
      // using the fresh game state to ensure accuracy.
      const initialScheduledTime = gameState.transitionScheduledAt;
      const initialDuration = gameState.transitionDuration;
      const initialStatus = gameState.status;

      console.log(`[Admin Timer] Received schedule for status: ${initialStatus}`);

      transitionTimerRef.current = setTimeout(async () => {
        const freshGameSnapshot = await get(gameRef);
        if (!freshGameSnapshot.exists()) return;
        const freshGameState = freshGameSnapshot.val() as Game;

        // Verify the transition is still relevant
        if (
          freshGameState.status !== initialStatus ||
          freshGameState.transitionScheduledAt !== initialScheduledTime ||
          freshGameState.transitionDuration !== initialDuration ||
          !freshGameState.transitionScheduledAt || // Check if null/undefined
          !freshGameState.transitionDuration   // Check if null/undefined
        ) {
          console.log(`[Admin Timer] Transition cancelled or state changed. Initial: ${initialStatus}, Current: ${freshGameState.status}`);
          return; // Exit if state changed or transition was cleared
        }

        // Now we can safely calculate timing based on confirmed number
        const scheduledTimeNumber = freshGameState.transitionScheduledAt as number;
        const durationNumber = freshGameState.transitionDuration;
        const targetTime = scheduledTimeNumber + durationNumber;
        const currentTime = Date.now();

        // Check if target time has passed
        if (currentTime >= targetTime) {
          console.log(`[Admin Timer] Executing scheduled transition from status: ${initialStatus}`);
          try {
            if (initialStatus === 'category') {
              await setNextQuestion();
            } else if (initialStatus === 'results') {
              await showLeaderboard();
            } else if (initialStatus === 'leaderboard') {
              await moveToNextRound();
            }
          } catch (error) {
            console.error("[Admin Timer] Error executing transition action:", error);
          }
        } else {
            // This case should ideally not happen often with the buffer,
            // but it means the timeout fired too early. Reschedule?
            console.warn(`[Admin Timer] Timer fired early for status ${initialStatus}. Target: ${targetTime}, Current: ${currentTime}. No action taken yet.`);
            // Consider rescheduling if this becomes an issue:
            // const remainingDelay = Math.max(0, targetTime - currentTime);
            // transitionTimerRef.current = setTimeout( ..., remainingDelay + 100);
        }
      }, 1000); // Check every second - adjust as needed for responsiveness vs performance
                 // More robust than calculating exact delay once, handles potential clock drift slightly better.
    }

    // Cleanup function
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
        console.log('[Admin Timer] Cleared active transition timer.');
      }
    };
  }, [gameState?.status, gameState?.transitionScheduledAt, gameState?.transitionDuration]);
  
  // Handle navigation based on game state changes
  const handleGameStateChange = (gameData: Game) => {
    if (!gameData.isActive) return;
    
    const adminPath = window.location.pathname;
    
    // Only navigate if we're on an admin path
    if (!adminPath.startsWith('/admin')) return;
    
    switch (gameData.status) {
      case 'category':
        if (adminPath !== '/admin/category') {
          navigate('/admin/category');
        }
        break;
      case 'question':
        if (adminPath !== '/admin/question') {
          navigate('/admin/question');
        }
        break;
      case 'results':
        if (adminPath !== '/admin/answers') {
          navigate('/admin/answers');
        }
        break;
      case 'leaderboard':
        if (adminPath !== '/admin/points') {
          navigate('/admin/points');
        }
        break;
      case 'finished':
        if (adminPath !== '/admin/winners') {
          navigate('/admin/winners');
        }
        break;
    }
  };
  
  // Game flow control functions
  const startNewGame = async () => {
    setLoading(true);
    try {
      await startGame();
      // Navigation is handled by the game state change listener
    } catch (error) {
      console.error('Error starting game from admin:', error);
      // Optional: Show error message to admin user
    } finally {
      setLoading(false);
    }
  };
  
  const endCurrentGame = async () => {
    setLoading(true);
    try {
      await endGame();
      navigate('/admin'); // Navigate after successful end
    } catch (error) {
      console.error('Error ending game from admin:', error);
    } finally {
        setLoading(false);
    }
  };
  
  const showNextQuestion = async (customQuestion?: Partial<Question>) => {
    setLoading(true);
    try {
      await setNextQuestion(customQuestion);
      // Navigation is handled by the game state change listener
    } catch (error) {
      console.error('Error showing next question from admin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const showResults = async () => {
    setLoading(true);
    try {
      await revealAnswers();
      // Navigation is handled by the game state change listener
    } catch (error) {
      console.error('Error showing results from admin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const showNextRound = async () => {
    setLoading(true);
    try {
      await moveToNextRound();
      // Navigation is handled by the game state change listener
    } catch (error) {
      console.error('Error showing next round from admin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const showFinalResults = async () => {
    setLoading(true);
    try {
      await updateGameStatus('finished');
      // Navigation is handled by the game state change listener
    } catch (error) {
      console.error('Error showing final results from admin:', error);
    } finally {
        setLoading(false);
    }
  };
  
  const resetGameState = async () => {
    setLoading(true);
    try {
      await resetGame();
      navigate('/admin'); // Navigate after successful reset
    } catch (error) {
      console.error('Error resetting game state from admin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function for updating game status
  const updateGameStatus = async (status: Game['status']) => {
    if (!gameState) return;
    // Add try-catch here as well
    try {
        await update(ref(db, 'game'), {
          ...gameState,
          status
        });
    } catch (error) {
        console.error(`Error updating game status to ${status}:`, error);
        throw error; // Re-throw if needed
    }
  };

  // Create a new game
  const createNewGame = async () => {
    setLoading(true);
    try {
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await update(gameRef, {
        isActive: false,
        currentRound: 0,
        currentQuestion: null,
        currentCategory: '',
        status: 'waiting',
        totalRounds: 48, // 6 categories * 8 questions each
        startedAt: null,
        gameCode: gameCode,
        createdAt: serverTimestamp(),
        transitionScheduledAt: null, // Ensure cleared
        transitionDuration: null // Ensure cleared
      });
      await removeTestUsers(); // Wrap this too
      navigate('/admin/qrcode');
    } catch (error) {
      console.error('Error creating new game:', error);
    } finally {
      setLoading(false);
    }
  };

  // Go to next question
  const nextQuestion = async (questionId: string) => {
    setLoading(true);
    try {
      await update(gameRef, {
        currentQuestion: questionId,
        status: 'question',
        transitionScheduledAt: null, // Clear transitions
        transitionDuration: null
      });
      // Navigation is handled by listener
    } catch (error) {
      console.error('Error navigating to next question:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Remove test users
  const removeTestUsers = async () => {
    setLoading(true); // Keep loading state if called independently
    try {
      const teamsSnapshot = await get(teamsRef);
      if (teamsSnapshot.exists()) {
        const teamsData = teamsSnapshot.val();
        const gameData = await get(gameRef);
        const currentGameCode = gameData.exists() ? (gameData.val() as Game).gameCode : null;
        
        for (const teamId in teamsData) {
          const team = teamsData[teamId] as Team;
          if (!team.gameCode || team.gameCode !== currentGameCode) {
            await remove(ref(db, `teams/${teamId}`));
          }
        }
      }
      console.log('Test users removed successfully');
    } catch (error) {
      console.error('Error removing test users:', error);
      // Don't setLoading(false) here if called from createNewGame
      // Let the calling function handle the final loading state
      throw error; // Re-throw if needed
    } 
    // Remove finally block if called from createNewGame to avoid premature loading state change
    // finally {
    //  setLoading(false);
    // }
  };

  return {
    teams,
    gameState,
    currentQuestion,
    teamAnswers,
    topTeams,
    categories: CATEGORIES,
    loading,
    
    startNewGame,
    endCurrentGame,
    showNextQuestion,
    showResults,
    showNextRound,
    showFinalResults,
    resetGameState,
    createNewGame,
    nextQuestion,
    removeTestUsers
  };
}; 