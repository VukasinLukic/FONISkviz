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
import { ref, onValue, off, get, update } from 'firebase/database';
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
        
        // Sort teams by points
        teamsList.sort((a, b) => b.points - a.points);
        
        setTeams(teamsList);
        setTopTeams(teamsList.slice(0, 3)); // Top 3 teams
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
  }, []);
  
  // Game flow control functions
  const startNewGame = async () => {
    setLoading(true);
    await startGame();
    setLoading(false);
    navigate('/admin/lobby');
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
    resetGameState
  };
}; 