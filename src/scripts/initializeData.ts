import { getDb } from '../lib/firebase';
import { ref, set, Database } from 'firebase/database';

/**
 * Inicijalizuje početne podatke u Firebase Realtime Database
 */
export const initializeData = async () => {
  try {
    // Primer pitanja
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
    ];

    // Get DB instance
    const db = await getDb();
    if (!db) throw new Error("Failed to get DB instance");

    // Upisujemo pitanja u bazu
    for (const question of questions) {
      await set(ref(db, `questions/${question.id}`), question);
    }
    console.log('Pitanja su uspešno inicijalizovana.');

    // Inicijalizacija prazne igre
    await set(ref(db, 'game/default'), {
      status: 'waiting',
      currentQuestion: null,
      currentQuestionIndex: 0,
      questionOrder: ['q1', 'q2', 'q3'],
      timerEnd: null,
      currentRound: 1
    });
    console.log('Igra je uspešno inicijalizovana.');

    return { success: true };
  } catch (error) {
    console.error('Greška pri inicijalizaciji podataka:', error);
    return { success: false, error };
  }
};

// Možeš pozvati ovu funkciju direktno iz konzole pretražvača
// window.initializeData = initializeData; 