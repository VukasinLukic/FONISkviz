import { 
  db, 
  questionsRef, 
  gameRef, 
  teamsRef,
  answersRef,
  Question,
  Game,
  Team,
  Answer
} from './firebase';
import { ref, get, set, update, onValue, push, remove, query, orderByChild, equalTo } from 'firebase/database';

// Categories
export const CATEGORIES = [
  'Istorija',
  'Geografija',
  'Nauka',
  'Sport',
  'Umetnost',
  'Zabava',
  'Tehnologija',
  'Opšte znanje'
];

// Quiz Management Functions
export const startGame = async (): Promise<void> => {
  // Reset game state
  await update(gameRef, {
    isActive: true,
    currentRound: 1,
    currentQuestion: null,
    status: 'waiting',
    startedAt: Date.now()
  });

  // Mark all teams as active
  const teamsSnapshot = await get(teamsRef);
  if (teamsSnapshot.exists()) {
    const teams = teamsSnapshot.val();
    const updates: Record<string, any> = {};
    
    for (const teamId in teams) {
      updates[`teams/${teamId}/isActive`] = true;
    }
    
    await update(ref(db), updates);
  }
};

export const endGame = async (): Promise<void> => {
  await update(gameRef, {
    isActive: false,
    status: 'finished',
  });
};

export const setCategory = async (category: string): Promise<void> => {
  await update(gameRef, {
    currentCategory: category,
    status: 'category'
  });
};

export const setNextQuestion = async (questionData?: Partial<Question>): Promise<string | null> => {
  // Get current game state
  const gameSnapshot = await get(gameRef);
  if (!gameSnapshot.exists()) {
    return null;
  }
  
  const game = gameSnapshot.val() as Game;
  
  // If question data is provided, create a new question
  let questionId: string | null = null;
  
  if (questionData) {
    const newQuestionRef = push(questionsRef);
    questionId = newQuestionRef.key;
    
    if (questionId) {
      await set(newQuestionRef, {
        id: questionId,
        question: questionData.question || '',
        answers: questionData.answers || ['', '', '', ''],
        correctAnswer: questionData.correctAnswer || 'A',
        category: questionData.category || game.currentCategory,
        timeLimit: questionData.timeLimit || 30
      });
    }
  } else {
    // Get a random question from the current category
    const categoryQuestionsRef = query(
      questionsRef, 
      orderByChild('category'), 
      equalTo(game.currentCategory)
    );
    
    const questionsSnapshot = await get(categoryQuestionsRef);
    if (questionsSnapshot.exists()) {
      const questions = questionsSnapshot.val();
      const questionIds = Object.keys(questions);
      
      if (questionIds.length > 0) {
        // Select a random question
        const randomIndex = Math.floor(Math.random() * questionIds.length);
        questionId = questionIds[randomIndex];
      }
    }
  }
  
  if (questionId) {
    // Update game with new question
    await update(gameRef, {
      currentQuestion: questionId,
      status: 'question'
    });
  }
  
  return questionId;
};

export const revealAnswers = async (): Promise<void> => {
  await update(gameRef, {
    status: 'results'
  });
};

export const showLeaderboard = async (): Promise<void> => {
  await update(gameRef, {
    status: 'leaderboard'
  });
};

export const moveToNextRound = async (): Promise<void> => {
  const gameSnapshot = await get(gameRef);
  if (!gameSnapshot.exists()) {
    return;
  }
  
  const game = gameSnapshot.val() as Game;
  
  if (game.currentRound < game.totalRounds) {
    await update(gameRef, {
      currentRound: game.currentRound + 1,
      currentQuestion: null,
      status: 'waiting'
    });
  } else {
    // If all rounds are completed, end the game
    await update(gameRef, {
      status: 'finished'
    });
  }
};

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  const questionRef = ref(db, `questions/${questionId}`);
  const snapshot = await get(questionRef);
  
  if (snapshot.exists()) {
    return snapshot.val() as Question;
  }
  
  return null;
};

export const getAllQuestions = async (): Promise<Question[]> => {
  const snapshot = await get(questionsRef);
  
  if (snapshot.exists()) {
    const questionsData = snapshot.val();
    return Object.values(questionsData) as Question[];
  }
  
  return [];
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const questionRef = ref(db, `questions/${questionId}`);
  await remove(questionRef);
};

export const getTeamsByPoints = async (): Promise<Team[]> => {
  const teamsSnapshot = await get(teamsRef);
  
  if (teamsSnapshot.exists()) {
    const teamsData = teamsSnapshot.val();
    const teams = Object.values(teamsData) as Team[];
    
    // Sort teams by points in descending order
    return teams.sort((a, b) => b.points - a.points);
  }
  
  return [];
};

export const getAnswersForQuestion = async (questionId: string): Promise<Answer[]> => {
  const questionAnswersQuery = query(
    answersRef,
    orderByChild('questionId'),
    equalTo(questionId)
  );
  
  const snapshot = await get(questionAnswersQuery);
  
  if (snapshot.exists()) {
    const answersData = snapshot.val();
    return Object.values(answersData) as Answer[];
  }
  
  return [];
};

// Seed initial questions (for development or reset)
export const seedQuestions = async (): Promise<void> => {
  // Check if questions already exist
  const snapshot = await get(questionsRef);
  
  if (snapshot.exists() && Object.keys(snapshot.val()).length > 0) {
    console.log('Questions already exist, skipping seed');
    return;
  }
  
  const sampleQuestions: Omit<Question, 'id'>[] = [
    {
      question: 'Koji grad je glavni grad Srbije?',
      answers: ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac'],
      correctAnswer: 'A',
      category: 'Geografija',
      timeLimit: 20
    },
    {
      question: 'Koje godine je održan prvi FONIS Hakaton?',
      answers: ['2010', '2012', '2015', '2018'],
      correctAnswer: 'C',
      category: 'Tehnologija',
      timeLimit: 20
    },
    {
      question: 'Ko je osnivač Tesla Motors-a?',
      answers: ['Bill Gates', 'Elon Musk', 'Jeff Bezos', 'Mark Zuckerberg'],
      correctAnswer: 'B',
      category: 'Tehnologija',
      timeLimit: 15
    },
    {
      question: 'Koje godine je počeo Drugi svetski rat?',
      answers: ['1939', '1941', '1945', '1918'],
      correctAnswer: 'A',
      category: 'Istorija',
      timeLimit: 20
    }
  ];
  
  // Add sample questions to the database
  for (const question of sampleQuestions) {
    const newQuestionRef = push(questionsRef);
    await set(newQuestionRef, {
      ...question,
      id: newQuestionRef.key
    });
  }
  
  console.log('Sample questions seeded successfully');
};

// Reset the entire game (for development or new game)
export const resetGame = async (): Promise<void> => {
  await set(gameRef, {
    isActive: false,
    currentRound: 0,
    currentQuestion: null,
    currentCategory: '',
    status: 'waiting',
    totalRounds: 8,
    startedAt: null
  });
  
  // Remove all answers
  await set(answersRef, null);
  
  // Reset team points but keep the teams
  const teamsSnapshot = await get(teamsRef);
  if (teamsSnapshot.exists()) {
    const teams = teamsSnapshot.val();
    const updates: Record<string, any> = {};
    
    for (const teamId in teams) {
      updates[`teams/${teamId}/points`] = 0;
      updates[`teams/${teamId}/isActive`] = true;
    }
    
    await update(ref(db), updates);
  }
  
  console.log('Game reset successfully');
}; 