import { getDb } from '../lib/firebase'; // Vraćamo import za browser
import { ref, set, Database } from 'firebase/database';

// Uklanjamo dotenv, process.env i direktnu inicijalizaciju odavde

/**
 * Inicijalizuje početne podatke u Firebase Realtime Database (verzija za poziv iz browsera)
 */
export const initializeData = async () => {
  try {
    // Primer pitanja (Ensure this aligns with seed-questions if needed)
    const questions = [
      {
        id: 'q1',
        text: 'Koje godine je osnovan FONIS?',
        options: ['2002', '2001', '2000', '1999'],
        correctAnswerIndex: 0, // 2002
        category: 'FONIS Istorija'
      },
      {
        id: 'q2',
        text: 'Šta označava skraćenica FONIS?',
        options: [
          'Fakultetski Odbor Naprednih Informatičkih Studenata',
          'Fakultetski Odbor Najboljih Informatičkih Studenata',
          'Fakultetski Organizovani Napredni Informatički Studenti',
          'Fakultetski Organizovani Napredni Informatički Savez'
        ],
        correctAnswerIndex: 1, // Fakultetski Odbor Najboljih Informatičkih Studenata
        category: 'FONIS Istorija'
      },
      {
        id: 'q3',
        text: 'Koja od sledećih tehnologija nije JavaScript framework?',
        options: ['React', 'Angular', 'Django', 'Vue'],
        correctAnswerIndex: 2, // Django je Python framework
        category: 'Programiranje'
      }
      // Add more questions if this script should seed more than seed-questions.ts
    ];

    // Get DB instance using the browser-safe method
    const db = await getDb();
    if (!db) throw new Error("Failed to get DB instance from lib/firebase");

    // Upisujemo pitanja u bazu
    // Consider if seeding questions here is redundant with seed-questions.ts
    console.warn('initializeData (browser version) is seeding questions q1, q2, q3.');
    for (const question of questions) {
      await set(ref(db, `questions/${question.id}`), question);
    }
    console.log('Pitanja su uspešno inicijalizovana (initializeData - browser).');

    // Inicijalizacija prazne igre
    await set(ref(db, 'game/default'), {
      status: 'waiting',
      currentQuestion: null,
      currentQuestionIndex: 0,
      questionOrder: questions.map(q => q.id), // Use seeded question IDs
      timerEnd: null,
      currentRound: 1
    });
    console.log('Igra je uspešno inicijalizovana (initializeData - browser).');

    return { success: true };
  } catch (error) {
    console.error('Greška pri inicijalizaciji podataka (browser):', error);
    return { success: false, error };
  }
};

// Ostatak fajla ostaje prazan ili sadrži samo export

// Možeš pozvati ovu funkciju direktno iz konzole pretražvača (if exposed)
// window.initializeData = initializeData;

// Execute if run directly (optional)
// if (require.main === module) {
//   initializeData().then(result => {
//     console.log('InitializeData script finished.');
//     process.exit(result.success ? 0 : 1);
//   });
// } 