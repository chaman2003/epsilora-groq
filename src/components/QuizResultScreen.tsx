import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuiz } from '../context/QuizContext';

interface QuizResultScreenProps {
  score: number;
  totalQuestions: number;
  questions: any[];
  questionStates: any[];
  resetQuiz: () => void;
  courseId: string;
  courseName: string;
  difficulty: string;
  timeSpent: number;
}

const QuizResultScreen: React.FC<QuizResultScreenProps> = ({
  score,
  totalQuestions,
  questions,
  questionStates,
  resetQuiz,
  courseId,
  courseName,
  difficulty,
  timeSpent
}) => {
  const navigate = useNavigate();
  const { setQuizData } = useQuiz();
  const scorePercentageValue = Math.round((score / totalQuestions) * 100);

  const formatTimeSpent = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    if (minutes === 0) {
      return `${seconds} sec`;
    }
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
  };

  const handleGetAIHelp = () => {
    try {
      const quizData = {
        questions: questions.map((q, index) => ({
          question: q.question,
          options: q.options.map((opt: any, optIndex: number) => {
            let optionText = typeof opt === 'object' && opt !== null && 'text' in opt 
              ? (opt as {text: string}).text 
              : String(opt);
            
            optionText = optionText
              .replace(/^([A-Da-d])[.):]\s*\1[.):]\s*/g, '')
              .replace(/^[A-Da-d][.):]\s*/g, '')
              .replace(/^[A-Da-d]\s+/g, '')
              .trim();
            
            return {
              text: optionText,
              label: String.fromCharCode(65 + optIndex)
            };
          }),
          correctAnswer: q.correctAnswer.toUpperCase(),
          userAnswer: questionStates[index]?.userAnswer?.toUpperCase() || null,
          isCorrect: questionStates[index]?.userAnswer?.toUpperCase() === q.correctAnswer.toUpperCase()
        })),
        score: score,
        totalQuestions: questions.length,
        courseName: courseName,
        difficulty: difficulty,
        timestamp: new Date().toISOString(),
        id: `${courseName}-${score}-${questions.length}-${Date.now()}`
      };
      
      localStorage.setItem('quizData', JSON.stringify(quizData));
      setQuizData(quizData);
      navigate('/ai-assist');
    } catch (error) {
      console.error("Error preparing data for AI help:", error);
      toast.error("Could not prepare data for AI assistance");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Results</h2>
        <p className="text-gray-600 dark:text-gray-400">{courseName}</p>
        <div className="mt-6 flex flex-col items-center">
          <div className="text-6xl font-bold mb-2">
            <span className={scorePercentageValue >= 70 ? "text-green-500" : 
                            scorePercentageValue >= 50 ? "text-yellow-500" : "text-red-500"}>
              {scorePercentageValue}%
            </span>
          </div>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
            {score} out of {totalQuestions} correct
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Time spent: {formatTimeSpent(timeSpent)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-5 shadow-sm">
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quiz Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Course:</span>
              <span className="font-medium text-gray-900 dark:text-white">{courseName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
              <span className="font-medium text-gray-900 dark:text-white">{difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTimeSpent(timeSpent)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-5 shadow-sm">
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Performance</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct answers</p>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${scorePercentageValue}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500 dark:text-gray-400">0%</span>
                <span className="text-gray-500 dark:text-gray-400">100%</span>
              </div>
            </div>
            
            <div className="pt-3">
              <p className="text-gray-900 dark:text-white">
                {scorePercentageValue >= 80 ? 'Outstanding performance! You have excellent mastery of this subject.' : 
                 scorePercentageValue >= 60 ? 'Good job! You have a solid understanding of most concepts.' : 
                 scorePercentageValue >= 40 ? 'Nice effort! Keep reviewing to strengthen your knowledge.' : 
                 'Keep practicing! Focus on the concepts you missed to improve.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center p-6">
        <button
          onClick={resetQuiz}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-indigo-300"
        >
          <div className="flex items-center justify-center">
            <Target className="w-5 h-5 mr-2" />
            <span>Try Again</span>
          </div>
        </button>
        <button
          onClick={handleGetAIHelp}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-purple-300"
        >
          <div className="flex items-center justify-center">
            <Award className="w-5 h-5 mr-2" />
            <span>Get AI Help</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default QuizResultScreen; 