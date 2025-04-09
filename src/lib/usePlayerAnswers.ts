import { useState, useEffect } from 'react';
import { 
  db, 
  Question, 
  Team, 
  Answer,
  gameRef,
  teamsRef,
  submitAnswer,
  getTeamAnswerForQuestion,
  getQuestionById
} from './firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { useGameContext } from '../context/GameContext';

interface UsePlayerAnswersResult {
  currentQuestion: Question | null;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  timeRemaining: number;
  loading: boolean;
  submitPlayerAnswer: (answer: 'A' | 'B' | 'C' | 'D') => Promise<void>;
}

export const usePlayerAnswers = (teamId: string): UsePlayerAnswersResult => {
  const { gameState } = useGameContext();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen for current question changes
  useEffect(() => {
    setLoading(true);
    
    // Create a reference to the game data
    const gameListener = onValue(gameRef, async (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val();
        
        if (gameData.currentQuestion) {
          // Get question details
          const questionData = await getQuestionById(gameData.currentQuestion);
          
          if (questionData) {
            setCurrentQuestion(questionData);
            setTimeRemaining(questionData.timeLimit);
            
            // Check if the player has already answered
            const existingAnswer = await getTeamAnswerForQuestion(teamId, questionData.id);
            
            if (existingAnswer) {
              setHasAnswered(true);
              setSelectedAnswer(existingAnswer.answer);
              setIsCorrect(existingAnswer.isCorrect);
              setPointsEarned(existingAnswer.pointsEarned);
            } else {
              setHasAnswered(false);
              setSelectedAnswer(null);
              setIsCorrect(null);
              setPointsEarned(0);
            }
          } else {
            // Reset if no question was found
            setCurrentQuestion(null);
            setHasAnswered(false);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setPointsEarned(0);
          }
        } else {
          // Reset if no current question
          setCurrentQuestion(null);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setPointsEarned(0);
        }
        
        setLoading(false);
      }
    });
    
    return () => {
      off(ref(db, 'game'));
    };
  }, [teamId]);
  
  // Timer for the question time remaining
  useEffect(() => {
    if (!currentQuestion || hasAnswered || gameState.status !== 'question') {
      return;
    }
    
    // Only start timer if we have a question and haven't answered yet
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [currentQuestion, hasAnswered, gameState.status]);

  // Function to submit a player's answer
  const submitPlayerAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || hasAnswered) {
      return;
    }
    
    try {
      setSelectedAnswer(answer);
      setHasAnswered(true);
      
      // Submit answer to Firebase
      await submitAnswer({
        teamId,
        questionId: currentQuestion.id,
        answer: answer,
        answeredAt: Date.now()
      });
      
      // Get the submitted answer to update local state
      const submittedAnswer = await getTeamAnswerForQuestion(teamId, currentQuestion.id);
      
      if (submittedAnswer) {
        setIsCorrect(submittedAnswer.isCorrect);
        setPointsEarned(submittedAnswer.pointsEarned);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Reset state on error
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  };

  return {
    currentQuestion,
    hasAnswered,
    selectedAnswer,
    isCorrect,
    pointsEarned,
    timeRemaining,
    loading,
    submitPlayerAnswer
  };
}; 