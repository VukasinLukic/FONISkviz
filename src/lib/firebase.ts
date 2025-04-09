// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  update, 
  onValue, 
  get, 
  remove, 
  serverTimestamp 
} from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBS5gnw4eO8jqAaCW5cNeVTjhUFMXQC140",
  authDomain: "kahoot-clone-b8034.firebaseapp.com",
  databaseURL: "https://kahoot-clone-b8034-default-rtdb.firebaseio.com",
  projectId: "kahoot-clone-b8034",
  storageBucket: "kahoot-clone-b8034.firebasestorage.app",
  messagingSenderId: "486709016032",
  appId: "1:486709016032:web:699b6739bab04f22782785",
  measurementId: "G-JQVLMKD96K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Types for database entities
export interface Team {
  id: string;
  name: string;
  mascotId: number;
  points: number;
  joinedAt: number;
  isActive: boolean;
  gameCode?: string; // Optional game code for connecting to specific games
}

export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: string;
  category: string;
  points?: number;
  timeLimit?: number;
}

export interface Game {
  isActive: boolean;
  currentRound: number;
  currentQuestion: string | null;
  currentCategory: string;
  status: 'waiting' | 'question' | 'answering' | 'results' | 'leaderboard' | 'finished' | 'category';
  totalRounds: number;
  startedAt: number | null;
  gameCode?: string; // Optional game code for identifying games
}

export interface Answer {
  teamId: string;
  questionId: string;
  answer: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  answeredAt: number;
  pointsEarned: number;
}

// Database references
export const teamsRef = ref(db, 'teams');
export const questionsRef = ref(db, 'questions');
export const gameRef = ref(db, 'game');
export const answersRef = ref(db, 'answers');

// Helper functions
export const createTeam = async (teamData: Omit<Team, 'id'>): Promise<string> => {
  const newTeamRef = push(teamsRef);
  const teamId = newTeamRef.key as string;
  
  await set(newTeamRef, {
    ...teamData,
    id: teamId
  });
  
  return teamId;
};

export const updateTeam = async (teamId: string, data: Partial<Team>): Promise<void> => {
  const teamRef = ref(db, `teams/${teamId}`);
  await update(teamRef, data);
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  const teamRef = ref(db, `teams/${teamId}`);
  const snapshot = await get(teamRef);
  
  if (snapshot.exists()) {
    return snapshot.val() as Team;
  }
  
  return null;
};

export const createQuestion = async (questionData: Omit<Question, 'id'>): Promise<string> => {
  const newQuestionRef = push(questionsRef);
  const questionId = newQuestionRef.key as string;
  
  await set(newQuestionRef, {
    ...questionData,
    id: questionId
  });
  
  return questionId;
};

export const updateGame = async (data: Partial<Game>): Promise<void> => {
  await update(gameRef, data);
};

export const getGame = async (): Promise<Game | null> => {
  const snapshot = await get(gameRef);
  
  if (snapshot.exists()) {
    return snapshot.val() as Game;
  }
  
  return null;
};

// Export this function to fix the linter error
export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  const questionRef = ref(db, `questions/${questionId}`);
  const snapshot = await get(questionRef);
  
  if (snapshot.exists()) {
    return snapshot.val() as Question;
  }
  
  return null;
};

export const submitAnswer = async (answerData: Omit<Answer, 'isCorrect' | 'pointsEarned'>): Promise<string> => {
  // Get the current question
  const gameSnapshot = await get(gameRef);
  const game = gameSnapshot.val() as Game;
  
  if (!game.currentQuestion) {
    throw new Error('No active question');
  }
  
  // Get the question data to check if answer is correct
  const questionRef = ref(db, `questions/${game.currentQuestion}`);
  const questionSnapshot = await get(questionRef);
  
  if (!questionSnapshot.exists()) {
    throw new Error('Question not found');
  }
  
  const question = questionSnapshot.val() as Question;
  const isCorrect = answerData.answer === question.correctAnswer;
  
  // Calculate points (base points for correct answer)
  let pointsEarned = 0;
  if (isCorrect) {
    pointsEarned = 100;
    
    // Add speed bonus if we're one of the first three teams to answer correctly
    const answersSnapshot = await get(answersRef);
    const answers = answersSnapshot.val() || {};
    
    // Count how many correct answers already exist for this question
    const correctAnswers = Object.values(answers).filter(
      (a: any) => a.questionId === answerData.questionId && a.isCorrect
    );
    
    if (correctAnswers.length < 3) {
      pointsEarned += 50; // Add speed bonus
    }
  }
  
  // Save the answer
  const newAnswerRef = push(answersRef);
  const answerId = newAnswerRef.key as string;
  
  await set(newAnswerRef, {
    ...answerData,
    isCorrect,
    pointsEarned,
    answeredAt: serverTimestamp()
  });
  
  // Update team points if correct
  if (isCorrect) {
    const teamRef = ref(db, `teams/${answerData.teamId}`);
    const teamSnapshot = await get(teamRef);
    
    if (teamSnapshot.exists()) {
      const team = teamSnapshot.val() as Team;
      await update(teamRef, {
        points: team.points + pointsEarned
      });
    }
  }
  
  return answerId;
};

export const getTeamAnswerForQuestion = async (teamId: string, questionId: string): Promise<Answer | null> => {
  const answersSnapshot = await get(answersRef);
  
  if (!answersSnapshot.exists()) {
    return null;
  }
  
  const answers = answersSnapshot.val();
  
  for (const key in answers) {
    const answer = answers[key] as Answer;
    if (answer.teamId === teamId && answer.questionId === questionId) {
      return answer;
    }
  }
  
  return null;
};

// Initialize default game state if it doesn't exist
export const initializeGameState = async (): Promise<void> => {
  const gameSnapshot = await get(gameRef);
  
  if (!gameSnapshot.exists()) {
    await set(gameRef, {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      currentCategory: '',
      status: 'waiting',
      totalRounds: 8,
      startedAt: null
    });
  }
};

// Export database instance for direct use
export { db }; 