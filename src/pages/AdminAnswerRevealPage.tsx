'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Game, 
  Answer, 
  Team, 
  getDb, 
  updateGameData, 
  GameStatus, 
  getTeamsForGame, 
  getTeamAnswerResult, 
  Question // Import Question type
} from '../lib/firebase';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { onValue, ref, update, Database } from 'firebase/database';
import { Button } from '../components/ui/button';
import { useGameRealtimeState } from '../hooks/useGameRealtimeState';

interface TeamAnswerDisplay extends Answer {
  teamId: string;
  teamName: string;
}

// Interface for ranked teams (similar to AdminLeaderboardPage)
interface RankedTeam extends Team {
  rank: number;
}

const AdminAnswerRevealPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<TeamAnswerDisplay[]>([]);
  const [rankedTeams, setRankedTeams] = useState<RankedTeam[]>([]); // State for ranked teams
  const [isLastQuestion, setIsLastQuestion] = useState(false); // State to know if it's the last question
  
  const gameCode = localStorage.getItem('gameCode');
  const { gameData: game, error: gameError, loading: gameLoading } = useGameRealtimeState(gameCode);
  
  useEffect(() => {
    if (!gameCode) {
      setError("Missing game code. Redirecting...");
      setTimeout(() => navigate('/admin'), 1500);
      return;
    }

    if (gameLoading || gameError || !game) {
      setLoading(true);
      return;
    }

    if (game.status !== 'answer_reveal') {
      console.log('AdminAnswerRevealPage: Status is not answer_reveal. Current status:', game.status);
      // If status changed away from answer_reveal (e.g., to next question), stop processing
      // Navigation should be handled by the button click or other components
      setLoading(false);
      return;
    }

    const processAndFetchData = async () => {
      setLoading(true);
      console.log('AdminAnswerRevealPage: Processing answers and ranks for reveal...');
      try {
        // --- 1. Get Current Question Data --- 
        const currentQuestionIndex = game.currentQuestionIndex;
        if (currentQuestionIndex < 0 || currentQuestionIndex >= game.questionOrder.length) {
           throw new Error("Invalid current question index.");
        }
        const currentQuestionId = game.questionOrder[currentQuestionIndex];
        const questionData = game.questions.find(q => q.id === currentQuestionId);
        if (!questionData) {
          throw new Error("Current question data not found in game state.");
        }
        setCurrentQuestion(questionData);
        setIsLastQuestion(currentQuestionIndex >= game.questions.length - 1);

        // --- 2. Get Processed Answers for THIS Question --- 
        const questionAnswers = game.answers?.[currentQuestionId] || {}; 
        const allTeamsForGame = await getTeamsForGame(gameCode); // Fetch fresh team data
        const teamsMap = new Map(allTeamsForGame.map(team => [team.id, team]));
        
        const processedAnswersArray: TeamAnswerDisplay[] = [];
        for (const teamId in questionAnswers) {
            const team = teamsMap.get(teamId);
            const teamName = team?.name || `Team ${teamId.substring(0, 4)}`;
            const processedAnswer = await getTeamAnswerResult(gameCode, currentQuestionId, teamId);

            if (processedAnswer) {
                processedAnswersArray.push({
                    ...(processedAnswer as Answer),
                    teamId: teamId,
                    teamName: teamName
                });
            } else {
                 console.warn(`AdminAnswerRevealPage: Could not get processed answer for team ${teamId}. Skipping display.`);
            }
        }
        setTeamAnswers(processedAnswersArray);

        // --- 3. Calculate Overall Ranks --- 
        // Use the `allTeamsForGame` fetched earlier, as it contains the latest scores
        // Remove the incorrect check for game.teams
        const teamsArray = [...allTeamsForGame] // Create a mutable copy
          .sort((a, b) => b.points - a.points); // Sort by points

        const rankedTeamsData: RankedTeam[] = [];
        if (teamsArray.length > 0) {
          let currentRank = 1;
          let previousPoints = teamsArray[0].points;
          teamsArray.forEach((team, index) => {
            if (index > 0 && team.points < previousPoints) {
              currentRank = index + 1;
              previousPoints = team.points;
            }
            // Add the calculated rank to the team object
            rankedTeamsData.push({ ...team, rank: currentRank }); 
          });
        }
        setRankedTeams(rankedTeamsData);

        setError(null);
      } catch (err: any) {
          console.error("Error processing answers/ranks for reveal:", err);
          setError(`Error processing data: ${err.message}`);
      } finally {
          setLoading(false);
      }
    };

    processAndFetchData();

  }, [game, gameLoading, gameError, gameCode, navigate]); // Rerun when game data changes
  
  const handleNextStep = async () => {
    if (!gameCode || !game) return;
    
    const nextStatus = isLastQuestion ? 'game_end' : 'question_display';

    try {
      const updates: Partial<Game> = { status: nextStatus };
      
      if (nextStatus === 'question_display') {
        updates.currentQuestionIndex = game.currentQuestionIndex + 1;
        updates.resultsReady = false; // Reset flag for the new question
        console.log(`[AdminAnswerRevealPage] Advancing to question index: ${updates.currentQuestionIndex}`);
      } else {
          console.log(`[AdminAnswerRevealPage] Ending game`);
      }
      
      await updateGameData(gameCode, updates);
      
      // Explicitly navigate after updating the status
      if (nextStatus === 'question_display') {
        navigate(`/admin/question?gameCode=${gameCode}`);
      } else if (nextStatus === 'game_end') {
        navigate(`/admin/winners?gameCode=${gameCode}`);
      }

    } catch (err) {
      setError("Failed to update game state");
      console.error(err);
    }
  };
  
  const displayError = error || gameError?.message;

  if (displayError) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-lg font-bold mb-2">Error</p>
          <p>{displayError}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-4 text-accent underline"
        >
          Return to Admin Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-primary p-8 relative overflow-hidden">
      <AnimatedBackground density="low" />
      
      <motion.div 
        className="absolute top-6 left-6 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="small" />
      </motion.div>
      
      <div className="h-full flex flex-col max-w-6xl mx-auto pt-16">
        {loading || gameLoading ? (
          <div className="flex justify-center items-center h-full">
            <motion.div
              className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        ) : game && currentQuestion && (
          <motion.div
            className="w-full space-y-6 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Question & Answer Info */}
            <div className="bg-secondary/20 p-6 rounded-xl backdrop-blur-sm mb-6">
              <h2 className="text-xl font-bold text-accent mb-3">
                Pitanje {game.currentQuestionIndex + 1}:
              </h2>
              <p className="text-lg text-accent/90 mb-3">
                {currentQuestion.text}
              </p>
              <p className="text-lg font-bold text-green-400">
                Tačan odgovor: {currentQuestion.correctAnswer}
              </p>
            </div>
            
            {/* Combined Answers and Leaderboard Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Individual Team Answers for this Question */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-accent mb-2">Odgovori Timova:</h3>
                {teamAnswers.length > 0 ? (
                  teamAnswers.map((answer) => (
                    <motion.div
                      key={answer.teamId}
                      className={`p-3 rounded-lg backdrop-blur-sm flex justify-between items-center text-sm
                        ${answer.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.random() * 0.2 }}
                    >
                      <div>
                        <span className="font-bold text-accent">{answer.teamName}</span>
                        <span className="text-accent/80 ml-2">({answer.selectedAnswer})</span>
                      </div>
                      <span className="font-bold text-accent">
                        +{answer.pointsAwarded}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-accent/60 italic">Nema zabeleženih odgovora za ovo pitanje.</p>
                )}
              </div>

              {/* Section 2: Overall Leaderboard */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-accent mb-2">Trenutna Rang Lista:</h3>
                {rankedTeams.length > 0 ? (
                  rankedTeams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      className={`p-3 rounded-lg backdrop-blur-sm flex items-center text-sm
                        bg-secondary/10 border border-transparent
                        ${index === 0 ? '!border-yellow-400/50' : ''}
                        ${index === 1 ? '!border-gray-400/50' : ''}
                        ${index === 2 ? '!border-amber-600/50' : ''}`
                      }
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-8 h-8 mr-3 flex items-center justify-center text-base font-bold text-accent">
                        {team.rank}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-accent">{team.name}</span>
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {team.points}
                      </div>
                    </motion.div>
                  ))
                ) : (
                   <p className="text-accent/60 italic">Nema timova za prikaz.</p>
                )}
              </div>
            </div>
            
            {/* Next Step Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleNextStep}
                className="bg-accent hover:bg-accent/80 text-primary px-10 py-4 text-lg font-bold"
              >
                {isLastQuestion ? 'Završi kviz' : 'Sledeće pitanje'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminAnswerRevealPage; 