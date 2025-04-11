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
import { ref, get, set, update, onValue, push, remove, query, orderByChild, equalTo, serverTimestamp } from 'firebase/database';

// Categories in predetermined order
export const CATEGORIES = [
  'Istorija',
  'Geografija',
  'Nauka',
  'Sport',
  'Kultura',
  'Tehnologija'
];

// Quiz Management Functions
export const startGame = async (): Promise<void> => {
  try {
    await update(gameRef, {
      isActive: true,
      currentRound: 1,
      currentQuestion: null,
      currentCategory: CATEGORIES[0],
      status: 'category',
      startedAt: Date.now(),
      transitionScheduledAt: serverTimestamp(),
      transitionDuration: 4000
    });

    const teamsSnapshot = await get(teamsRef);
    if (teamsSnapshot.exists()) {
      const teams = teamsSnapshot.val();
      const updates: Record<string, any> = {};
      for (const teamId in teams) {
        updates[`teams/${teamId}/isActive`] = true;
      }
      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
    }
  } catch (error) {
    console.error("Error starting game:", error);
    // Optional: Update game state to reflect error?
    throw error; // Re-throw for the caller (useQuizAdmin) to handle
  }
};

export const endGame = async (): Promise<void> => {
  try {
    await update(gameRef, {
      isActive: false,
      status: 'finished',
      transitionScheduledAt: null,
      transitionDuration: null
    });
  } catch (error) {
    console.error("Error ending game:", error);
    throw error;
  }
};

// No longer needed as categories progress automatically
// export const setCategory = async (category: string): Promise<void> => {
//   await update(gameRef, {
//     currentCategory: category,
//     status: 'category'
//   });
// };

// Modified to use predetermined categories
export const setNextQuestion = async (questionData?: Partial<Question>): Promise<string | null> => {
  let questionId: string | null = null;
  try {
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) {
      throw new Error("Game state not found in setNextQuestion");
    }
    const game = gameSnapshot.val() as Game;

    if (questionData) {
      const newQuestionRef = push(questionsRef);
      questionId = newQuestionRef.key;
      
      if (questionId) {
        await set(newQuestionRef, {
          id: questionId,
          text: questionData.text || '',
          options: questionData.options || { A: '', B: '', C: '', D: '' },
          correctAnswer: questionData.correctAnswer || 'A',
          category: questionData.category || game.currentCategory,
          timeLimit: questionData.timeLimit || 30
        });
      }
    } else {
      const categoryQuestionsRef = query(questionsRef, orderByChild('category'), equalTo(game.currentCategory));
      const questionsSnapshot = await get(categoryQuestionsRef);
      if (questionsSnapshot.exists()) {
         const questions = questionsSnapshot.val();
         const questionIds = Object.keys(questions);
         if (questionIds.length > 0) {
           const randomIndex = Math.floor(Math.random() * questionIds.length);
           questionId = questionIds[randomIndex];
         }
      }
    }

    if (questionId) {
      await update(gameRef, {
        currentQuestion: questionId,
        status: 'question',
        transitionScheduledAt: null,
        transitionDuration: null
      });
    } else {
        console.warn(`No questions found for category: ${game.currentCategory}`);
        // Optionally handle this case, maybe skip category or end game?
    }
    return questionId;
  } catch (error) {
      console.error("Error setting next question:", error);
      throw error;
  }
};

export const revealAnswers = async (): Promise<void> => {
  try {
    await update(gameRef, {
      status: 'results',
      transitionScheduledAt: serverTimestamp(),
      transitionDuration: 10000
    });
  } catch (error) {
      console.error("Error revealing answers:", error);
      throw error;
  }
};

export const showLeaderboard = async (): Promise<void> => {
  try {
    await update(gameRef, {
      status: 'leaderboard',
      transitionScheduledAt: serverTimestamp(),
      transitionDuration: 5000
    });
  } catch (error) {
      console.error("Error showing leaderboard:", error);
      throw error;
  }
};

// Modified to handle category progression and end of game
export const moveToNextRound = async (): Promise<void> => {
  try {
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) {
        throw new Error("Game state not found in moveToNextRound");
    }
    const game = gameSnapshot.val() as Game;
    const nextRound = game.currentRound + 1;
    
    // Calculate category progression
    const questionsPerCategory = 8;
    const categoryIndex = Math.floor((nextRound - 1) / questionsPerCategory);
    
    // Check if game is finished
    if (categoryIndex >= CATEGORIES.length) {
      await update(gameRef, {
        status: 'finished',
        transitionScheduledAt: null,
        transitionDuration: null
      });
      return;
    }
    
    // Prepare updates for the next round or category
    const nextCategory = CATEGORIES[categoryIndex];
    const isNewCategory = nextCategory !== game.currentCategory;
    
    const updates: Partial<Game> = {
      currentRound: nextRound,
      currentQuestion: null,
      currentCategory: nextCategory,
      status: 'leaderboard', // Always show leaderboard first after results
      transitionScheduledAt: serverTimestamp(), // Schedule leaderboard display
      transitionDuration: 5000 // Leaderboard display duration
    };

    await update(gameRef, updates);
    // The admin listener will handle transitioning FROM leaderboard to the next state (category or question)
  } catch (error) {
      console.error("Error moving to next round:", error);
      throw error;
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
      text: 'Koji grad je glavni grad Srbije?',
      options: {
        A: 'Beograd',
        B: 'Novi Sad',
        C: 'Niš',
        D: 'Kragujevac'
      },
      correctAnswer: 'A',
      category: 'Geografija',
      timeLimit: 20
    },
    {
      text: 'Koje godine je održan prvi FONIS Hakaton?',
      options: {
        A: '2010',
        B: '2012',
        C: '2015',
        D: '2018'
      },
      correctAnswer: 'C',
      category: 'Tehnologija',
      timeLimit: 20
    },
    {
      text: 'Ko je osnivač Tesla Motors-a?',
      options: {
        A: 'Bill Gates',
        B: 'Elon Musk',
        C: 'Jeff Bezos',
        D: 'Mark Zuckerberg'
      },
      correctAnswer: 'B',
      category: 'Tehnologija',
      timeLimit: 15
    },
    {
      text: 'Koje godine je počeo Drugi svetski rat?',
      options: {
        A: '1939',
        B: '1941',
        C: '1945',
        D: '1918'
      },
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
  try {
    await update(gameRef, {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      currentCategory: '',
      status: 'waiting',
      gameCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      startedAt: null,
      transitionScheduledAt: null,
      transitionDuration: null
    });

    const teamsSnapshot = await get(teamsRef);
    if (teamsSnapshot.exists()) {
      const teams = teamsSnapshot.val();
      const updates: Record<string, any> = {};
      for (const teamId in teams) {
        updates[`teams/${teamId}/points`] = 0;
        updates[`teams/${teamId}/isActive`] = true;
      }
      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
    }
  } catch (error) {
      console.error("Error resetting game:", error);
      throw error;
  }
}; 