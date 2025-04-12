# Plan Implementacije FONIS Quiz MVP (Nakon Lobija)

## 1. Analiza Stila i Brendinga (Iz postojećeg koda)

*   **Paleta Boja:**
    *   `primary`: Tamna pozadina (verovatno tamno smeđa/bordo).
    *   `secondary`: Narandžasto-smeđa (#D35322, #5A1B09). Za glavne akcije, QR kod, isticanje.
    *   `accent`: Svetla krem/bež (#FCE4BC). Za tekst na tamnoj pozadini, suptilne pozadine.
    *   `highlight`: Zelena/aktivna boja. Za selekciju, aktivna stanja.
*   **Fontovi:**
    *   `Merriweather`: Serifni (naslovi).
    *   `Caviar Dreams`: Sans-serif (tekst, kodovi).
*   **Komponente i Stil:**
    *   `framer-motion` za animacije.
    *   `AnimatedBackground` komponenta.
    *   Centralizovane komponente (`MainButton`, `Logo`).
    *   Tailwind CSS za stilizovanje (transparentnost, zaobljeni uglovi, senke).
    *   Responzivni dizajn.
*   **Ukupni Utisak:** Moderan, animiran, vizuelno privlačan stil sa jasnom hijerarhijom boja.

## 2. Osnovna Arhitektura

*   **Frontend:** React, TypeScript, Vite
*   **Routing:** React Router DOM v6
*   **Styling:** Tailwind CSS
*   **Animacije:** Framer Motion
*   **Backend/Real-time:** Firebase Realtime Database (RTDB)

## 3. Firebase Struktura Podataka (Proširenje)

```json
{
  // Postojeće: Informacije o timovima
  "teams": {
    "[teamId]": { /* ... postojeća struktura ... */ }
  },

  // NOVO: Stanje igre za svaki aktivni kviz
  "game": {
    "[gameCode]": {
      "status": "lobby" | "question_display" | "answer_reveal" | "leaderboard" | "finished",
      "currentQuestionIndex": 0,
      "currentRound": 1, // Opciono za MVP
      "questionOrder": ["q1", "q5", "q3", ...], // ID-jevi pitanja
      "timerEnd": 1681312345678 | null,
      "hostId": "[adminUserId]" // Opciono
    }
  },

  // NOVO: Sva dostupna pitanja
  "questions": {
    "[questionId]": {
      "id": "[questionId]",
      "text": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "category": "..." // Opciono za MVP
    }
    // ... više pitanja
  },

  // NOVO: Odgovori timova na pitanja
  "answers": {
    "[gameCode]": {
      "[questionId]": {
        "[teamId]": {
          "answerIndex": 1,
          "submittedAt": 1681312340000,
          "isCorrect": false, // Izračunato
          "pointsAwarded": 0  // Izračunato
        }
        // ... ostali timovi
      }
      // ... ostala pitanja
    }
  },

  // NOVO: Ukupni skorovi timova u igri
  "scores": {
    "[gameCode]": {
      "[teamId]": {
        "totalScore": 150,
        "rank": 2 // Izračunato
      }
      // ... ostali timovi
    }
  }
}
```

## 4. Tok Igre (Game Flow) & Firebase Statusi

1.  **Start:** Admin u `LobbyPage` klikne "Start Game".
    *   **Firebase Update:** Generiše `questionOrder`, postavlja `game/[gameCode]` status na `question_display`, `currentQuestionIndex` na 0, `timerEnd`.
2.  **Stanje: `question_display`**
    *   **Admin:** `AdminQuestionPage` (pitanje, opcije, tajmer).
    *   **Player:** `PlayerQuestionPage` (dugmad A, B, C, D, tajmer). Igrač šalje odgovor u `answers`.
3.  **Prelaz:** Tajmer istekne / Admin klikne "Prikaži odgovor".
    *   **Firebase Update:** Sistem/Admin izračunava `isCorrect`, `pointsAwarded`, ažurira `answers` i `scores`. Postavlja `game/[gameCode]/status` na `answer_reveal`.
4.  **Stanje: `answer_reveal`**
    *   **Admin:** `AdminAnswerPage` (tačan odgovor). Čeka klik "Sledeće" / "Rang lista".
    *   **Player:** `PlayerAnswerResultPage` ("Tačno +X" / "Netačno").
5.  **Prelaz:** Admin klikne "Sledeće" / "Rang lista".
    *   **Firebase Update (Sledeće):** Ažurira `currentQuestionIndex`, `timerEnd`, status na `question_display`.
    *   **Firebase Update (Rang lista):** Postavlja status na `leaderboard`.
6.  **Stanje: `leaderboard`**
    *   **Admin:** `AdminLeaderboardPage` (rang lista). Čeka klik "Nastavi".
    *   **Player:** `PlayerScorePage` (svoj skor).
7.  **Prelaz:** Admin klikne "Nastavi".
    *   **Firebase Update:** Ažurira `currentQuestionIndex`, `timerEnd`, status na `question_display`.
8.  **Kraj igre:** Nema više pitanja.
    *   **Firebase Update:** Postavlja status na `finished`.
9.  **Stanje: `finished`**
    *   **Admin:** `AdminWinnersPage` (pobednici).
    *   **Player:** `PlayerFinishedPage` (finalni rezultat).

## 5. Rute Aplikacije (`src/Routes.tsx` - Proširenje)

```typescript
// Potrebno dodati nove rute za faze igre:
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      // ... postojeće rute ...

      // Admin Game Routes
      { path: 'admin/question', element: <AdminQuestionPage /> },
      { path: 'admin/answer', element: <AdminAnswerPage /> },
      { path: 'admin/leaderboard', element: <AdminLeaderboardPage /> },
      { path: 'admin/winners', element: <AdminWinnersPage /> },

      // Player Game Routes
      { path: 'player/question', element: <PlayerQuestionPage /> },
      { path: 'player/waiting-answer', element: <PlayerWaitingAnswerPage /> },
      { path: 'player/answer-result', element: <PlayerAnswerResultPage /> },
      { path: 'player/score', element: <PlayerScorePage /> },
      { path: 'player/finished', element: <PlayerFinishedPage /> },

      // ... postojeće rute ...
    ]
  }
]);
```

## 6. Plan Implementacije (MVP Koraci)

1.  **Podešavanje Firebase:** uradjeno!
    *   Ažurirati pravila (`firebase-rules.json`).
    *   Popuniti test pitanja (`questions`).
    *   Kreirati Firebase funkcije (`src/lib/firebase.ts`) za nove čvorove (`getGameData`, `updateGameStatus`, `submitAnswer`, `calculateScores`, `getScores`).
2.  **Start Game Logika (`LobbyPage.tsx`):** uradjeno!
    *   Dodati "Start Game" dugme.
    *   `onClick` handler: Dohvati pitanja, napravi `questionOrder`, inicijalizuj `game/[gameCode]`, navigiraj admina na `/admin/question`.
3.  **Admin Question Page (`pages/game/AdminQuestionPage.tsx`):**uradjeno!
    *   Kreirati komponentu.
    *   Slušati `game/[gameCode]` za `status` i `currentQuestionIndex`.
    *   Dohvatiti i prikazati trenutno pitanje.
    *   Prikazati tajmer.
    *   Dugme "Prikaži odgovor" -> ažurira status na `answer_reveal` i pokreće kalkulaciju skora. Navigira na `/admin/answer`.
4.  **Player Question Page (`pages/game/PlayerQuestionPage.tsx`):**uradjeno!
    *   Kreirati komponentu.
    *   Slušati `game/[gameCode]` za `status`.
    *   Prikazati dugmad A, B, C, D kada je `status` = `question_display`.
    *   Prikazati tajmer.
    *   `onClick` dugmeta: Pozvati `submitAnswer()`, onemogućiti dugmad, navigirati na `/player/waiting-answer`.
5.  **Player Waiting Answer Page (`pages/game/PlayerWaitingAnswerPage.tsx`):**uradjeno!
    *   Kreirati komponentu.
    *   Prikazati "Čekanje rezultata...".
    *   Slušati `game/[gameCode]/status`. Kada postane `answer_reveal`, navigirati na `/player/answer-result`.
6.  **Score Calculation (MVP):**uradjeno!
    *   Implementirati logiku u Firebase funkciji (`processQuestionResults(gameCode, questionId)`):
        *   Dohvati tačan odgovor.
        *   Dohvati sve odgovore timova za to pitanje.
        *   Izračunaj `isCorrect` i `pointsAwarded` za svaki odgovor.
        *   Ažuriraj `answers` čvor.
        *   Ažuriraj `scores` čvor.
7.  **Admin Answer Page (`pages/game/AdminAnswerPage.tsx`):** uradjeno!
    *   Kreirati komponentu.
    *   Dohvatiti i prikazati pitanje, istaći tačan odgovor.
    *   Dugme "Sledeće pitanje": Ažurira index, timer, status -> `/admin/question`. Proveriti kraj igre.
    *   Dugme "Prikaži rang listu": Ažurira status -> `/admin/leaderboard`.
8.  **Player Answer Result Page (`pages/game/PlayerAnswerResultPage.tsx`):** uradjeno!
    *   Kreirati komponentu.
    *   Dohvatiti rezultat tima za poslednje pitanje iz `answers`.
    *   Prikazati "Tačno +X" / "Netačno".
    *   Slušati `game/[gameCode]/status` za navigaciju na sledeću stranicu (`/player/question`, `/player/score`, `/player/finished`).
9.  **Leaderboard & Score Pages:**uradjeno!
    *   `AdminLeaderboardPage.tsx`: Dohvati i prikaži rangirane skorove. Dugme "Nastavi".
    *   `PlayerScorePage.tsx`: Dohvati i prikaži skor tima. Slušati status za navigaciju.
10. **Winner & Finished Pages:**uradjeno!
    *   `AdminWinnersPage.tsx`: Prikazati finalne rezultate. Dugme "Nova Igra".
    *   `PlayerFinishedPage.tsx`: Prikazati finalni rezultat tima. Dugme "Igraj Ponovo".
11. **Routing Update:** Implementirati nove rute u `src/Routes.tsx`.uradjeno!

/////
12. **Routing Improvements**:
    - Implement child routes for admin and player paths to enhance modularity.
    - Ensure all routes have error handling for missing data.
13. **Component Refactoring**:
    - Extract common UI elements (loading indicators, error messages) into reusable components.
    - Ensure consistent use of TypeScript interfaces across components.
14. **Performance Enhancements**:
    - Use `React.memo` for components that do not need to re-render frequently.
    - Optimize Firebase listeners to prevent memory leaks.
15. **User Experience Enhancements**:
    - Improve loading states and feedback mechanisms for user actions.

## 7. Real-time Komunikacija

*   **Firebase RTDB je dovoljan.** `onValue` listeneri su adekvatni za praćenje promena stanja igre (`game.status`, skorovi itd.).
*   **Socket.IO nije potreban** za MVP i dodao bi nepotrebnu kompleksnost.

## 8. Sledeći Koraci (Post-MVP)

*   Bonus poeni za brzinu.
*   Pitanja po kategorijama/rundama.
*   Firebase Cloud Functions za kalkulaciju skora.
*   Bolja obrada grešaka/diskonekcije.
*   Više animacija i zvučnih efekata.
*   Admin dashboard za pitanja.
