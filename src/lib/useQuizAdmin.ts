import { useState, useEffect } from 'react';
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
  setCategory, 
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
  selectCategory: (category: string) => Promise<void>;
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
          filteredTeams = teamsList.filter(team => team.gameCode === gameState.gameCode || !team.gameCode);
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
  
  // Game flow control functions
  const startNewGame = async () => {
    setLoading(true);
    try {
      await update(gameRef, {
        isActive: true,
        startedAt: serverTimestamp(),
        // Ensure we maintain the current game code
        gameCode: gameState?.gameCode
      });
      
      // Navigate to category selection
      navigate('/admin/category');
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const endCurrentGame = async () => {
    setLoading(true);
    await endGame();
    setLoading(false);
    navigate('/admin');
  };
  
  const selectCategory = async (category: string) => {
    setLoading(true);
    await setCategory(category);
    setLoading(false);
    navigate('/admin/category');
  };
  
  const showNextQuestion = async (customQuestion?: Partial<Question>) => {
    setLoading(true);
    await setNextQuestion(customQuestion);
    setLoading(false);
    navigate('/admin/question');
  };
  
  const showResults = async () => {
    setLoading(true);
    await revealAnswers();
    setLoading(false);
    navigate('/admin/answers');
  };
  
  const showNextRound = async () => {
    setLoading(true);
    await moveToNextRound();
    setLoading(false);
    
    // Navigate based on game state
    if (gameState && gameState.currentRound < gameState.totalRounds) {
      navigate('/admin/lobby');
    } else {
      navigate('/admin/winners');
    }
  };
  
  const showFinalResults = async () => {
    setLoading(true);
    await updateGameStatus('finished');
    setLoading(false);
    navigate('/admin/winners');
  };
  
  const resetGameState = async () => {
    setLoading(true);
    await resetGame();
    setLoading(false);
    navigate('/admin');
  };
  
  // Helper function for updating game status
  const updateGameStatus = async (status: Game['status']) => {
    if (!gameState) return;
    
    await update(ref(db, 'game'), {
      ...gameState,
      status
    });
  };

  // Create a new game
  const createNewGame = async () => {
    setLoading(true);
    try {
      // Generate a random game code (6 alphanumeric characters)
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Reset the game state for a new session
      await update(gameRef, {
        isActive: false,
        currentRound: 0,
        currentQuestion: null,
        currentCategory: '',
        status: 'waiting',
        totalRounds: 8,
        startedAt: null,
        gameCode: gameCode,
        createdAt: serverTimestamp()
      });
      
      // Clear out any teams from previous games
      await removeTestUsers();
      
      // Navigate to the QR code page
      navigate('/admin/qrcode');
    } catch (error) {
      console.error('Error creating new game:', error);
      throw error;
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
        status: 'question'
      });
      
      // Navigate to question display
      navigate('/admin/question');
    } catch (error) {
      console.error('Error navigating to next question:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Remove test users
  const removeTestUsers = async () => {
    setLoading(true);
    try {
      // Get all teams
      const teamsSnapshot = await get(teamsRef);
      if (teamsSnapshot.exists()) {
        const teamsData = teamsSnapshot.val();
        
        // Get current game code
        const gameData = await get(gameRef);
        const currentGameCode = gameData.exists() ? (gameData.val() as Game).gameCode : null;
        
        // Remove teams that don't have the current game code or are test users
        for (const teamId in teamsData) {
          const team = teamsData[teamId] as Team;
          
          // Remove if team doesn't have current game code or is a test user
          if (!team.gameCode || team.gameCode !== currentGameCode) {
            await remove(ref(db, `teams/${teamId}`));
          }
        }
      }
      
      console.log('Test users removed successfully');
    } catch (error) {
      console.error('Error removing test users:', error);
    } finally {
      setLoading(false);
    }
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
    selectCategory,
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