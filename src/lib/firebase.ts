// Firebase configuration and initialization
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  update, 
  onValue, 
  get, 
  query,
  orderByChild,
  equalTo,
  Database,
  remove
} from 'firebase/database';
import { initializeApp, FirebaseApp } from 'firebase/app'; // Import initializeApp and FirebaseApp
import { getAnalytics, isSupported } from 'firebase/analytics'; // Import analytics

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Handle the error appropriately - maybe show a message to the user
  throw error; // Rethrow or handle gracefully
}

// Initialize Analytics (Optional)
const initAnalytics = async () => {
  try {
    if (await isSupported()) {
      const analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
      return analytics;
    } else {
      console.warn('Firebase Analytics is not supported in this environment.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
  }
  return null;
};

initAnalytics(); // Initialize analytics in the background

// Types for database entities
export interface Team {
  id: string;
  name: string;
  points: number;
  isActive: boolean;
  gameCode: string;
  mascotId: number;
  joinedAt: number;
}

// NOVO: Tipovi za igru, pitanja, odgovore i skorove
export type GameStatus = 'waiting' | 'question_display' | 'answer_collection' | 'answer_reveal' | 'game_end' | 'leaderboard' | 'finished';

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questions: Question[];
  teams: Record<string, Team>;
  answers: Record<string, Record<string, Answer>>;
  questionOrder: string[];
  timerEnd: number | null;
  currentRound: number;
  resultsReady?: boolean;
}

export interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Answer {
  selectedAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  answerIndex: number;
  submittedAt?: number; // Add timestamp
}

export interface TeamScore {
  totalScore: number;
  rank?: number; // Izračunato
}

// Database cache
let _db: Database | null = null;

// Function to get database instance safely
const getDb = async (): Promise<Database> => {
  if (_db) return _db;
  
  // Get database instance from the initialized app
  try {
    _db = getDatabase(app);
    return _db;
  } catch (error) {
    console.error("Error getting Firebase Database instance:", error);
    throw error; // Rethrow or handle
  }
};

// Maximum number of retries for Firebase operations
const MAX_RETRIES = 3;
// Base delay between retries in milliseconds
const BASE_RETRY_DELAY = 500;

/**
 * Handles retry logic for Firebase operations
 * @param operation - Function to retry
 * @param retries - Number of retries left
 * @param operationName - Name of the operation for logging
 */
async function withRetry<T>(
  operation: () => Promise<T>, 
  retries = MAX_RETRIES, 
  operationName = 'Firebase operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      console.error(`Error in ${operationName} after maximum retries:`, error);
      throw error;
    }
    
    // Calculate exponential backoff delay with jitter
    const delay = BASE_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries) * (0.5 + Math.random());
    console.warn(`Retrying ${operationName} due to error. Retries left: ${retries}. Retrying in ${delay.toFixed(0)}ms`, error);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the operation
    return withRetry(operation, retries - 1, operationName);
  }
}

// === Team functions ===
export const createTeam = async (teamData: Omit<Team, 'id'>): Promise<string> => {
  return withRetry(async () => {
    const db = await getDb();
    const newTeamRef = push(ref(db, 'teams'));
    const teamId = newTeamRef.key as string;
    
    await set(newTeamRef, {
      ...teamData,
      id: teamId
    });
    
    return teamId;
  }, MAX_RETRIES, 'createTeam');
};

export const updateTeam = async (teamId: string, data: Partial<Team>): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `teams/${teamId}`;
    console.log(`[Firebase] updateTeam: path="${path}"`);
    if (!teamId || /[.#$\[\]]/g.test(teamId)) { // Basic check for invalid chars
      console.error(`[Firebase] updateTeam: Invalid teamId: "${teamId}"`);
      throw new Error(`Invalid teamId provided: ${teamId}`);
    }
    await update(ref(db, path), data);
  }, MAX_RETRIES, 'updateTeam');
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `teams/${teamId}`;
    console.log(`[Firebase] getTeam: path="${path}"`);
    if (!teamId || /[.#$\[\]]/g.test(teamId)) {
      console.error(`[Firebase] getTeam: Invalid teamId: "${teamId}"`);
      throw new Error(`Invalid teamId provided: ${teamId}`);
    }
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() as Team : null;
  }, MAX_RETRIES, 'getTeam');
};

export const getTeamsForGame = async (gameCode: string): Promise<Team[]> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = 'teams'; // Path for the query base
    console.log(`[Firebase] getTeamsForGame: gameCode="${gameCode}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) {
      console.error(`[Firebase] getTeamsForGame: Invalid gameCode: "${gameCode}"`);
      throw new Error(`Invalid gameCode provided: ${gameCode}`);
    }
    const teamsQuery = query(
      ref(db, path),
      orderByChild('gameCode'),
      equalTo(gameCode)
    );
    
    const snapshot = await get(teamsQuery);
    if (!snapshot.exists()) {
      return [];
    }
    
    const teamsData = snapshot.val();
    return Object.values(teamsData) as Team[];
  }, MAX_RETRIES, 'getTeamsForGame');
};

// === NOVO: Game functions ===
export const createGame = async (gameCode: string, initialData: {
  currentQuestionIndex: number;
  questionOrder: string[];
  timerEnd: number | null;
  currentRound: number;
}): Promise<void> => {
  const attemptCreate = async (): Promise<void> => {
    const db = await getDb();
    const gameRef = ref(db, `game/${gameCode}`);
    const baseGameData = {
      id: gameCode,
      code: gameCode,
      status: 'lobby', // Start in lobby
      teams: {},
      answers: {},
      questions: [] as Question[], // <-- Explicitly type the empty array
      ...initialData,
      resultsReady: false
    };

    // Fetch questions to embed (assuming questions exist at /questions)
    const questionsSnapshot = await get(ref(db, 'questions'));
    if (questionsSnapshot.exists()) {
      const allQuestions = questionsSnapshot.val();
      // Filter questions based on questionOrder
      baseGameData.questions = initialData.questionOrder
        .map(qId => allQuestions[qId])
        .filter(q => q); // Filter out undefined if ID doesn't exist
    } else {
      console.warn(`[Firebase] No questions found at /questions while creating game ${gameCode}`);
    }

    console.log(`[Firebase] createGame: path="game/${gameCode}"`, baseGameData);
    await set(gameRef, baseGameData);
  };
  return withRetry(attemptCreate, 3, 'createGame');
};

export const updateGameStatus = async (gameCode: string, status: GameStatus): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `game/${gameCode}`;
    console.log(`[Firebase] updateGameStatus: path="${path}", status="${status}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) {
      console.error(`[Firebase] updateGameStatus: Invalid gameCode: "${gameCode}"`);
      throw new Error(`Invalid gameCode provided: ${gameCode}`);
    }
    await update(ref(db, path), { status });
  }, MAX_RETRIES, 'updateGameStatus');
};

export const updateGameData = async (gameCode: string, data: Partial<Game>): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `game/${gameCode}`;
    console.log(`[Firebase] updateGameData: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) {
      console.error(`[Firebase] updateGameData: Invalid gameCode: "${gameCode}"`);
      throw new Error(`Invalid gameCode provided: ${gameCode}`);
    }
    await update(ref(db, path), data);
  }, MAX_RETRIES, 'updateGameData');
};

export const getGameData = async (gameCode: string): Promise<Game | null> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `game/${gameCode}`;
    console.log(`[Firebase] getGameData: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) {
      console.error(`[Firebase] getGameData: Invalid gameCode: "${gameCode}"`);
      throw new Error(`Invalid gameCode provided: ${gameCode}`);
    }
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() as Game : null;
  }, MAX_RETRIES, 'getGameData');
};

// === NOVO: Question functions ===
export const createQuestion = async (questionData: Omit<Question, 'id'>): Promise<string> => {
  return withRetry(async () => {
    const db = await getDb();
    const newQuestionRef = push(ref(db, 'questions'));
    const questionId = newQuestionRef.key as string;
    
    await set(newQuestionRef, {
      ...questionData,
      id: questionId
    });
    
    return questionId;
  }, MAX_RETRIES, 'createQuestion');
};

export const getAllQuestions = async (): Promise<Question[]> => {
  return withRetry(async () => {
    const db = await getDb();
    const snapshot = await get(ref(db, 'questions'));
    if (!snapshot.exists()) {
      return [];
    }
    
    const questionsData = snapshot.val();
    return Object.values(questionsData) as Question[];
  }, MAX_RETRIES, 'getAllQuestions');
};

export const getQuestion = async (questionId: string): Promise<Question | null> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `questions/${questionId}`;
    console.log(`[Firebase] getQuestion: path="${path}"`);
    if (!questionId || /[.#$\[\]]/g.test(questionId)) {
      console.error(`[Firebase] getQuestion: Invalid questionId: "${questionId}"`);
      throw new Error(`Invalid questionId provided: ${questionId}`);
    }
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() as Question : null;
  }, MAX_RETRIES, 'getQuestion');
};

// === NOVO: Answer functions ===
export const submitAnswer = async (
  gameCode: string,
  questionId: string,
  teamId: string,
  answerData: Omit<Answer, 'isCorrect' | 'pointsAwarded' | 'submittedAt'> // Omit generated fields
): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `answers/${gameCode}/${questionId}/${teamId}`;
    console.log(`[Firebase] submitAnswer: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);
    if (!questionId || /[.#$\[\]]/g.test(questionId)) throw new Error(`Invalid questionId: ${questionId}`);
    if (!teamId || /[.#$\[\]]/g.test(teamId)) throw new Error(`Invalid teamId: ${teamId}`);

    const dataToSubmit: Partial<Answer> = {
        ...answerData,
        submittedAt: Date.now() // Add current timestamp
    };

    await set(ref(db, path), dataToSubmit);
  }, MAX_RETRIES, 'submitAnswer');
};

export const getAnswersForQuestion = async (
  gameCode: string,
  questionId: string
): Promise<Record<string, Answer>> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `answers/${gameCode}/${questionId}`;
    console.log(`[Firebase] getAnswersForQuestion: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);
    if (!questionId || /[.#$\[\]]/g.test(questionId)) throw new Error(`Invalid questionId: ${questionId}`);

    const snapshot = await get(ref(db, path));
    if (!snapshot.exists()) {
      return {};
    }
    
    return snapshot.val() as Record<string, Answer>;
  }, MAX_RETRIES, 'getAnswersForQuestion');
};

export const getTeamAnswer = async (
  gameCode: string,
  questionId: string,
  teamId: string
): Promise<Answer | null> => {
  // This function gets the *initial* answer, maybe before processing
  const attemptGetAnswer = async (): Promise<Answer | null> => {
    const db = await getDb();
    const answerRef = ref(db, `answers/${gameCode}/${questionId}/${teamId}`);
    const snapshot = await get(answerRef);
    return snapshot.exists() ? snapshot.val() as Answer : null;
  };
  return withRetry(attemptGetAnswer, 3, 'getTeamAnswer');
};

// NEW FUNCTION: Get the processed answer result
export const getTeamAnswerResult = async (
  gameCode: string,
  questionId: string,
  teamId: string
): Promise<Answer | null> => {
  console.log(`[Firebase] getTeamAnswerResult: path="answers/${gameCode}/${questionId}/${teamId}"`);
  const attemptGetResult = async (): Promise<Answer | null> => {
    const db = await getDb();
    const answerRef = ref(db, `answers/${gameCode}/${questionId}/${teamId}`);
    const snapshot = await get(answerRef);

    if (snapshot.exists()) {
      const result = snapshot.val() as Answer;
      // Ensure the result has been processed (contains pointsAwarded)
      if (typeof result.pointsAwarded === 'number') {
        return result;
      }
      // If pointsAwarded is missing, the answer exists but isn't fully processed yet.
      // Return null temporarily, the UI should handle this as "processing" or wait.
      console.warn('[Firebase] getTeamAnswerResult: Answer found but lacks pointsAwarded.');
      return null; // Indicate not ready / not processed yet
    }
    console.log(`[Firebase] getTeamAnswerResult: No answer record found for team ${teamId}, returning null.`);
    return null; // Return null if no snapshot exists (means team didn't answer)
  };
  return withRetry(attemptGetResult, 2, 'getTeamAnswerResult');
};

// === NOVO: Score functions ===
export const updateTeamScore = async (
  gameCode: string,
  teamId: string,
  score: TeamScore
): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `scores/${gameCode}/${teamId}`;
    console.log(`[Firebase] updateTeamScore: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);
    if (!teamId || /[.#$\[\]]/g.test(teamId)) throw new Error(`Invalid teamId: ${teamId}`);

    await set(ref(db, path), score);
  }, MAX_RETRIES, 'updateTeamScore');
};

export const getTeamScore = async (
  gameCode: string,
  teamId: string
): Promise<TeamScore | null> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `scores/${gameCode}/${teamId}`;
    console.log(`[Firebase] getTeamScore: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);
    if (!teamId || /[.#$\[\]]/g.test(teamId)) throw new Error(`Invalid teamId: ${teamId}`);

    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() as TeamScore : null;
  }, MAX_RETRIES, 'getTeamScore');
};

export const getAllScoresForGame = async (gameCode: string): Promise<Record<string, TeamScore>> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `scores/${gameCode}`;
    console.log(`[Firebase] getAllScoresForGame: path="${path}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);

    const snapshot = await get(ref(db, path));
    if (!snapshot.exists()) {
      return {};
    }
    
    return snapshot.val() as Record<string, TeamScore>;
  }, MAX_RETRIES, 'getAllScoresForGame');
};

// === NOVO: Score calculation ===
export const processQuestionResults = async (gameCode: string, questionId: string): Promise<void> => {
  console.log(`[Firebase] processQuestionResults: gameCode="${gameCode}", questionId="${questionId}"`);
  const attemptProcess = async (): Promise<void> => {
    const db = await getDb();
    const gameRef = ref(db, `game/${gameCode}`);
    const gameSnapshot = await get(gameRef);

    if (!gameSnapshot.exists()) {
      throw new Error(`Game with code ${gameCode} not found.`);
    }

    const gameData = gameSnapshot.val() as Game;
    const question = gameData.questions.find(q => q.id === questionId);

    if (!question) {
      throw new Error(`Question with ID ${questionId} not found in game data.`);
    }

    const answersRef = ref(db, `answers/${gameCode}/${questionId}`);
    const answersSnapshot = await get(answersRef);
    const submittedAnswersData = answersSnapshot.exists() ? answersSnapshot.val() : {};

    const allTeams = await getTeamsForGame(gameCode);
    const activeTeams = allTeams.filter(team => team.isActive !== false);

    const updatePaths: { [path: string]: any } = {};
    let fastestCorrectTeamId: string | null = null;
    let minTimestamp = Infinity;

    // --- First Pass: Identify fastest correct answer --- 
    for (const team of activeTeams) {
      const teamId = team.id;
      const submittedAnswer = submittedAnswersData[teamId] as Answer | undefined;
      
      if (submittedAnswer && typeof submittedAnswer.answerIndex === 'number' && submittedAnswer.answerIndex === question.correctAnswerIndex && submittedAnswer.submittedAt) {
          if (submittedAnswer.submittedAt < minTimestamp) {
              minTimestamp = submittedAnswer.submittedAt;
              fastestCorrectTeamId = teamId;
          }
      }
    }

    console.log(`[Firebase] Fastest correct answer from team: ${fastestCorrectTeamId || 'None'}`);

    // --- Second Pass: Calculate points and prepare updates --- 
    for (const team of activeTeams) {
      const teamId = team.id;
      const submittedAnswer = submittedAnswersData[teamId] as Answer | undefined;

      let isCorrect = false;
      let pointsAwarded = 0;
      let selectedAnswerText = "Nije odgovoreno";
      let answerIndex = -1;

      if (submittedAnswer && typeof submittedAnswer.answerIndex === 'number' && submittedAnswer.answerIndex !== -1) {
        selectedAnswerText = submittedAnswer.selectedAnswer;
        answerIndex = submittedAnswer.answerIndex;
        isCorrect = submittedAnswer.answerIndex === question.correctAnswerIndex;
        
        if (isCorrect) {
          pointsAwarded = 100; // Base points for correct answer
          if (teamId === fastestCorrectTeamId) {
            pointsAwarded += 50; // Bonus for fastest
            console.log(`[Firebase] Awarding +50 bonus to team ${teamId} for speed.`);
          }
        } else {
          pointsAwarded = 0; // Incorrect answer
        }
      } else {
        // Player did not answer
        pointsAwarded = 0;
      }

      // Prepare updates for the /answers node
      const answerPath = `answers/${gameCode}/${questionId}/${teamId}`;
      updatePaths[`${answerPath}/isCorrect`] = isCorrect;
      updatePaths[`${answerPath}/pointsAwarded`] = pointsAwarded;
      updatePaths[`${answerPath}/selectedAnswer`] = selectedAnswerText;
      updatePaths[`${answerPath}/answerIndex`] = answerIndex;
      // Ensure submittedAt is preserved if it existed
      if (submittedAnswer?.submittedAt) {
          updatePaths[`${answerPath}/submittedAt`] = submittedAnswer.submittedAt;
      } else if (answerIndex === -1) {
          // Optionally add a timestamp even for non-answers, or set to null/0
          // updatePaths[`${answerPath}/submittedAt`] = null; 
      }

      // Prepare updates for the /scores node
      const currentScoreRef = ref(db, `scores/${gameCode}/${teamId}`);
      const currentScoreSnapshot = await get(currentScoreRef);
      const currentScoreData = currentScoreSnapshot.exists() 
        ? currentScoreSnapshot.val() as TeamScore 
        : { totalScore: 0 };
      
      updatePaths[`scores/${gameCode}/${teamId}/totalScore`] = (currentScoreData.totalScore || 0) + pointsAwarded;
    }

    // ... (Perform updates, calculate ranks, set resultsReady) ...
    if (Object.keys(updatePaths).length > 0) {
        console.log('[Firebase] Updating answers and scores:', JSON.stringify(updatePaths).substring(0, 500) + '...'); // Log truncated updates
        await update(ref(db), updatePaths);
    } else {
        console.log('[Firebase] No active teams found or no updates needed.');
    }
    await calculateRanks(gameCode);
    console.log(`[Firebase] Setting resultsReady to true for game ${gameCode}`);
    await update(ref(db, `game/${gameCode}`), { resultsReady: true });

  };

  return withRetry(attemptProcess, 3, 'processQuestionResults');
};

// Calculate ranks for all teams
export const calculateRanks = async (gameCode: string): Promise<void> => {
  return withRetry(async () => {
    const db = await getDb();
    const scoresPath = `scores/${gameCode}`;
    console.log(`[Firebase] calculateRanks: gameCode="${gameCode}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);

    const scoresSnapshot = await get(ref(db, scoresPath));
    if (!scoresSnapshot.exists()) {
      return;
    }
    
    const allScores = scoresSnapshot.val() as Record<string, TeamScore>;
    
    // Sort scores by totalScore (descending)
    const sortedTeamIds = Object.entries(allScores)
      .sort(([, scoreA], [, scoreB]) => scoreB.totalScore - scoreA.totalScore)
      .map(([teamId]) => teamId);
    
    // Assign ranks
    const updatePromises = sortedTeamIds.map((teamId, index) => {
      return update(ref(db, `${scoresPath}/${teamId}/rank`), {
        rank: index + 1 // Ranks start from 1
      });
    });
    
    await Promise.all(updatePromises);
  }, MAX_RETRIES, 'calculateRanks');
};

// Add function for atomic game status setting
// This needs to be added to the part where other game manipulation functions are located

// Function for atomic game status setting with retry logic
export const setGameStatus = async (gameCode: string, status: GameStatus): Promise<void> => {
  const attemptSetStatus = async (): Promise<void> => {
    const db = await getDb();
    const path = `game/${gameCode}/status`;
    console.log(`[Firebase] setGameStatus: path="${path}", status="${status}"`);
    if (!gameCode || /[.#$\[\]]/g.test(gameCode)) {
      console.error(`[Firebase] setGameStatus: Invalid gameCode: "${gameCode}"`);
      throw new Error(`Invalid gameCode provided: ${gameCode}`);
    }
    const statusRef = ref(db, path);
    await set(statusRef, status);
    console.log(`Successfully set game ${gameCode} status to ${status}`);
  };

  return withRetry(attemptSetStatus, MAX_RETRIES, 'setGameStatus');
};

// Export database instance for direct use
export { getDb }; 