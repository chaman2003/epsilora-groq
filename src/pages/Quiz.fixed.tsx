import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Award,
  XCircle,
  CheckCircle,
  Target,
  History as HistoryIcon,
  ClipboardList
} from 'lucide-react';
import axiosInstance from '../config/axios';
import toast from 'react-hot-toast';
import { Course, QuizAttempt } from '../types';
import QuizLimitNotice from '../components/QuizLimitNotice';
import QuizGenerationError from '../components/QuizGenerationError';
import DefaultQuestionsError from '../components/DefaultQuestionsError';
import QuizGenerationOverlay from '../components/QuizGenerationOverlay';
import QuizResultScreen from '../components/QuizResultScreen';

// Re-export Quiz types
export type Timeout = ReturnType<typeof setTimeout>;

export interface QuizDetails {
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timePerQuestion: number;
}

export interface QuestionState {
  userAnswer: string | null;
  timeExpired: boolean;
  viewed: boolean;
  timeLeft: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface CourseStats {
  correct: number;
  wrong: number;
  name: string;
}

const Quiz: React.FC = () => {
  // All your existing state declarations and hooks here...
  const { isAuthenticated, user, isLoading } = useAuth();
  const { setQuizData } = useQuiz();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizDetails, setQuizDetails] = useState<QuizDetails>({
    numberOfQuestions: 5,
    difficulty: 'Hard',
    timePerQuestion: 30
  });
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [formattedQuizHistory, setFormattedQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [defaultQuestionsError, setDefaultQuestionsError] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [maxQuestionCount, setMaxQuestionCount] = useState(5);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Your existing hook implementations...
  
  // All your existing hooks and effects here (fetchCourses, initializeData, etc.)

  // Update handleQuestionNav to check for default questions when navigating
  const handleQuestionNav = useCallback((index: number) => {
    // First check if we have default questions
    if (checkAndAbortIfDefaultQuestions()) {
      return; // Don't proceed with navigation if we detected and aborted
    }

    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
      const state = questionStates[index];
      setSelectedAnswer(state?.userAnswer || null);
      setShowResult(state?.viewed || false);
      setTimerActive(false);
    }
  }, [questions.length, questionStates]);

  // Update handleNextQuestion to include default question check
  const handleNextQuestion = useCallback(() => {
    // Check for default questions first
    if (checkAndAbortIfDefaultQuestions()) {
      return; // Don't proceed if we detected and aborted
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(quizDetails.timePerQuestion);
      setTimerActive(true);
      setShowContinue(false);
    }
  }, [currentQuestion, questions, quizDetails.timePerQuestion, questionStates]);

  // Update handlePreviousQuestion to include default question check
  const handlePreviousQuestion = useCallback(() => {
    // Check for default questions first
    if (checkAndAbortIfDefaultQuestions()) {
      return; // Don't proceed if we detected and aborted
    }

    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowContinue(true);
    }
  }, [currentQuestion]);
  
  // Add effect to check questions as soon as they're loaded - MOVED FROM CONDITIONAL POSITION
  useEffect(() => {
    if (quizStarted && questions && questions.length > 0 && selectedCourse) {
      // Find the course name for detection
      const courseName = courses.find(c => c._id === selectedCourse)?.name || '';
      
      // Check if any question in the quiz is a default question
      const hasDefaultQuestions = questions.some(q => isDefaultQuestion(q, courseName));
      
      if (hasDefaultQuestions) {
        console.warn("Default questions detected after loading - stopping quiz");
        setQuizStarted(false);
        setDefaultQuestionsError(true);
        setLoading(false);
      }
    }
  }, [quizStarted, questions, selectedCourse, courses]);
  
  // Rest of your component implementation...
  
  // Function implementations like formatTimeSpent, resetQuizGenerator, renderGenerationOverlay
  const formatTimeSpent = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    if (minutes === 0) {
      return `${seconds} sec`;
    }
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
  };

  // Reset the quiz generator to try again
  const resetQuizGenerator = () => {
    setGenerationError(null);
    setDefaultQuestionsError(false);
    setLoading(false);
  };

  // Function to show generation overlay
  const renderGenerationOverlay = (isLoading: boolean): React.ReactNode => {
    return (
      <QuizGenerationOverlay loading={isLoading} />
    );
  };
  
  // Your existing component JSX return
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Add the loading overlay */}
      {renderGenerationOverlay(loading)}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quiz Configuration UI */}
        {!quizStarted && !showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Generate a Quiz
              </h1>
              
              {/* Default Questions Error component */}
              {defaultQuestionsError && (
                <DefaultQuestionsError 
                  onRetry={resetQuizGenerator} 
                />
              )}
              
              {/* Existing error component */}
              {generationError && !defaultQuestionsError && (
                <QuizGenerationError 
                  error={generationError} 
                  maxQuestions={maxQuestionCount}
                  onRetry={retryWithFewerQuestions} 
                />
              )}
              
              {/* Your quiz configuration UI here */}
            </div>
          </motion.div>
        )}

        {/* Quiz Results Screen */}
        {showResult && (
          <QuizResultScreen
            score={score}
            totalQuestions={questions.length}
            questions={questions}
            questionStates={questionStates}
            resetQuiz={resetQuiz}
            courseId={selectedCourse}
            courseName={courses.find(c => c._id === selectedCourse)?.name || 'Unknown Course'}
            difficulty={quizDetails.difficulty}
            timeSpent={startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0}
          />
        )}

        {/* Active Quiz UI goes here */}
        {quizStarted && !showResult && (
          <div className="quiz-container">
            {/* Your quiz UI code */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz; 