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

// Initialize Firebase App
let app: FirebaseApp;
try {
  // Firebase Configuration - using process.env for node scripts, import.meta.env for browser
  const firebaseConfig = {
    apiKey: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_API_KEY : import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_AUTH_DOMAIN : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_DATABASE_URL : import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_PROJECT_ID : import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_STORAGE_BUCKET : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_APP_ID : import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_MEASUREMENT_ID : import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
  
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
  category?: string;
  imageUrl?: string;
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
    if (!gameCode || /[.#$[]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);
    if (!questionId || /[.#$[]]/g.test(questionId)) throw new Error(`Invalid questionId: ${questionId}`);
    if (!teamId || /[.#$[]]/g.test(teamId)) throw new Error(`Invalid teamId: ${teamId}`);

    const dataToSubmit: Partial<Answer> = {
        ...answerData,
        submittedAt: Date.now() // Add current timestamp
    };

    // Write the answer first
    await set(ref(db, path), dataToSubmit);
    console.log(`[Firebase] Answer submitted for team ${teamId} on question ${questionId}.`);

    // --- Check if all active players have answered --- 
    try {
        // Fetch active teams
        const allTeams = await getTeamsForGame(gameCode);
        const activeTeams = allTeams.filter(team => team.isActive !== false);
        const activeTeamCount = activeTeams.length;
        
        if (activeTeamCount === 0) {
            console.log("[Firebase] No active teams found, skipping check.");
            return; // No need to check if there are no active teams
        }

        // Fetch submitted answers for this question
        const submittedAnswers = await getAnswersForQuestion(gameCode, questionId);
        const submittedAnswerCount = Object.keys(submittedAnswers).length;

        console.log(`[Firebase] Answer check: Submitted: ${submittedAnswerCount}, Active Teams: ${activeTeamCount}`);

        // If counts match, change game status
        if (submittedAnswerCount >= activeTeamCount) {
            console.log("[Firebase] All active teams have answered. Setting status to 'answer_collection'.");
            // Call setGameStatus to update the status (uses its own retry logic)
            await setGameStatus(gameCode, 'answer_collection');
        }
    } catch (checkError) {
        // Log the error but don't fail the whole submitAnswer operation
        // The answer was submitted, this check is a secondary action.
        console.error("[Firebase] Error during check for all answers submitted:", checkError);
    }
    // --------------------------------------------------

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

// Helper function to get all answers for a specific game
export const getAllAnswersForGame = async (
  gameCode: string
): Promise<Record<string, Record<string, Answer>>> => {
  return withRetry(async () => {
    const db = await getDb();
    const path = `answers/${gameCode}`;
    console.log(`[Firebase] getAllAnswersForGame: path="${path}"`);
    if (!gameCode || /[.#$[]]/g.test(gameCode)) throw new Error(`Invalid gameCode: ${gameCode}`);

    const snapshot = await get(ref(db, path));
    if (!snapshot.exists()) {
      console.log(`[Firebase] No answers found for game ${gameCode}`);
      return {}; // Return empty object if no answers node exists
    }
    
    return snapshot.val() as Record<string, Record<string, Answer>>;
  }, MAX_RETRIES, 'getAllAnswersForGame');
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

    // --- First Pass: Identify fastest correct answer (Only for non-text input categories) ---
    fastestCorrectTeamId = null; // Reset before pass
    minTimestamp = Infinity;
    if (question.category !== "Pogodite crtani" && question.category !== "Pogodite fonisovca" && question.category !== "Pogodi Pesmu na osnovu Emoji-a") {
        for (const team of activeTeams) {
          const teamId = team.id;
          const submittedAnswer = submittedAnswersData[teamId] as Answer | undefined;
          
          // Check based on index for non-text categories
          if (submittedAnswer && typeof submittedAnswer.answerIndex === 'number' && 
              submittedAnswer.answerIndex !== -1 && // Ensure an answer was selected
              submittedAnswer.answerIndex === question.correctAnswerIndex && 
              submittedAnswer.submittedAt) {
              if (submittedAnswer.submittedAt < minTimestamp) {
                  minTimestamp = submittedAnswer.submittedAt;
                  fastestCorrectTeamId = teamId;
              }
          }
        }
        console.log(`[Firebase] Fastest correct answer (non-text) from team: ${fastestCorrectTeamId || 'None'}`);
    } else {
        console.log(`[Firebase] Skipping fastest answer check for text-based category: ${question.category}`);
    }

    // --- Second Pass: Calculate points and prepare updates --- 
    for (const team of activeTeams) {
      const teamId = team.id;
      const submittedAnswer = submittedAnswersData[teamId] as Answer | undefined;

      let isCorrect = false;
      let pointsAwarded = 0;
      let selectedAnswerText = "Nije odgovoreno";
      let answerIndex = -1;

      if (submittedAnswer) {
        // Check if it's one of the special text input categories
        const isTextCategory = question.category === "Pogodite crtani" || 
                              question.category === "Pogodite fonisovca" ||
                              question.category === "Pogodi Pesmu na osnovu Emoji-a";
                              
        if (isTextCategory) {
          selectedAnswerText = submittedAnswer.selectedAnswer || ""; // Store the typed text
          answerIndex = -1; // Index is not applicable
          
          // Use the smarter answer comparison
          isCorrect = areAnswersSimilar(selectedAnswerText, question.correctAnswer || "") && selectedAnswerText.trim() !== "";
          pointsAwarded = isCorrect ? 100 : 0; // No speed bonus for this type
          
        } else if (typeof submittedAnswer.answerIndex === 'number' && submittedAnswer.answerIndex !== -1) {
          // Original logic for index-based answers
          selectedAnswerText = submittedAnswer.selectedAnswer;
          answerIndex = submittedAnswer.answerIndex;
          isCorrect = submittedAnswer.answerIndex === question.correctAnswerIndex;
          
          if (isCorrect) {
            pointsAwarded = 100; // Base points
            // Award speed bonus only if fastestCorrectTeamId was determined (i.e., not a text-based category)
            if (teamId === fastestCorrectTeamId) { 
              pointsAwarded += 50; // Bonus for fastest
              console.log(`[Firebase] Awarding +50 bonus to team ${teamId} for speed.`);
            }
          } else {
            pointsAwarded = 0; // Incorrect answer
          }
        } else {
             // Submitted answer exists but has no valid index (shouldn't happen often)
             pointsAwarded = 0;
             selectedAnswerText = submittedAnswer.selectedAnswer || "Nevalidan Odgovor";
        }
      } else {
          // Player did not submit any answer
          pointsAwarded = 0;
          selectedAnswerText = "Nije odgovoreno";
          answerIndex = -1;
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
      // Fix: Update the rank property directly instead of creating a nested object
      return update(ref(db, `${scoresPath}/${teamId}`), {
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

/**
 * Calculate the Levenshtein distance between two strings
 * This measures how many single-character edits are needed to change one string to another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Fill the first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Check if two answer strings are similar enough to be considered the same
 * This handles case sensitivity, extra spaces, and minor typos
 */
function areAnswersSimilar(submitted: string, correct: string): boolean {
  if (!submitted || !correct) return false;
  
  // Normalize both strings
  const normalize = (str: string) => {
    return str
      .trim()                          // Remove leading/trailing spaces
      .toLowerCase()                   // Convert to lowercase
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
      .replace(/\s+/g, ' ')            // Replace multiple spaces with a single space
      .replace(/_/g, ' ')              // Replace underscores with spaces
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove punctuation
  };
  
  const normalizedSubmitted = normalize(submitted);
  const normalizedCorrect = normalize(correct);
  
  // If normalized strings match exactly, they're similar
  if (normalizedSubmitted === normalizedCorrect) {
    return true;
  }
  
  // For very short answers, require exact match after normalization
  if (normalizedCorrect.length <= 3) {
    return normalizedSubmitted === normalizedCorrect;
  }
  
  // For longer answers, allow some edit distance based on the length
  const distance = levenshteinDistance(normalizedSubmitted, normalizedCorrect);
  
  // The threshold is proportional to the length of the correct answer
  // For longer answers we allow more mistakes
  const threshold = Math.max(1, Math.floor(normalizedCorrect.length / 5));
  
  return distance <= threshold;
}

export async function initFirebase() {
  // ... existing code ...
} 