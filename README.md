# FONIS Quiz - Kahoot Clone

A real-time quiz application built with React, TypeScript, and Firebase Realtime Database.

## Features

- Real-time synchronization between players and display
- QR code scanning for team registration
- Interactive question display with timer
- Live leaderboard
- Mobile-responsive design
- Beautiful animations with Framer Motion

## Backend Implementation

This project uses Firebase Realtime Database for the backend, which provides:

- Real-time data synchronization across all connected clients
- Persistent storage of game state, questions, teams, and answers
- Automatic syncing between different devices and views

### Database Structure

```
|- game
|  |- isActive: boolean
|  |- currentRound: number
|  |- currentQuestion: string (ID) | null
|  |- currentCategory: string
|  |- status: 'waiting' | 'question' | 'answering' | 'results' | 'leaderboard' | 'finished'
|  |- totalRounds: number
|  |- startedAt: number | null
|
|- teams
|  |- [teamId]
|     |- id: string
|     |- name: string
|     |- mascotId: number
|     |- points: number
|     |- joinedAt: number
|     |- isActive: boolean
|
|- questions
|  |- [questionId]
|     |- id: string
|     |- text: string
|     |- options: { A, B, C, D }
|     |- correctAnswer: 'A' | 'B' | 'C' | 'D'
|     |- category: string
|     |- timeLimit: number
|
|- answers
|  |- [answerId]
|     |- teamId: string
|     |- questionId: string
|     |- answer: 'A' | 'B' | 'C' | 'D' | null
|     |- isCorrect: boolean
|     |- answeredAt: number
|     |- pointsEarned: number
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fonis-quiz.git
cd fonis-quiz
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup steps
   - Under "Build > Realtime Database", create a new database
   - Start in test mode (allow reads and writes)

4. Copy your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web app (</>) icon
   - Register the app if you haven't already
   - Copy the firebaseConfig object

5. Create a `.env` file based on `.env.example` and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

6. Seed the database with initial questions:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

## Usage

1. Open the application in two browser windows:
   - Admin/Display view: `http://localhost:5173/admin`
   - Player view: `http://localhost:5173`

2. QR Code Setup:
   - Navigate to the admin panel and start a new game
   - Display shows a QR code for players to join
   - Players scan the QR code with their mobile device or navigate to the player URL

3. Team Registration:
   - Players enter their team name
   - Players select a mascot
   - Team appears in the lobby on the display

4. Game Flow:
   - Admin selects a category
   - Questions appear on both admin and player screens
   - Players select their answers
   - Results are displayed after each question
   - Leaderboard updates in real-time

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run seed` - Seed the database with initial questions
- `npm run reset` - Reset the game state (useful for testing)

## Technologies Used

- React (with TypeScript)
- Firebase Realtime Database
- React Router
- Tailwind CSS
- Framer Motion
- GSAP for animations
- QR Code generation

## License

This project is licensed under the MIT License.
