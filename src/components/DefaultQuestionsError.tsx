import React from 'react';

interface DefaultQuestionsErrorProps {
  onRetry: () => void;
}

const DefaultQuestionsError: React.FC<DefaultQuestionsErrorProps> = ({ onRetry }) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4 rounded shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Generic Questions Detected - Unable to Generate Course-Specific Content
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>Our AI couldn't generate specific questions about this course. Instead, it produced generic placeholder questions which wouldn't be valuable for learning.</p>
            
            <div className="mt-2">
              <p className="font-semibold">Why does this happen?</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>The AI might not have enough detailed information about this specific course</li>
                <li>The difficulty level may be too high for the available course data</li>
                <li>The number of questions requested might be too many for this topic</li>
                <li>The server might be experiencing higher than normal load</li>
              </ul>
            </div>
            
            <div className="mt-2">
              <p className="font-semibold">Try these options instead:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Select a lower difficulty level (try Medium or Easy)</li>
                <li>Request fewer questions (5-10 is optimal)</li>
                <li>Choose a different course with more detailed content</li>
                <li>Try again in a few minutes (our AI model might be busy)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Try Again with Different Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultQuestionsError; 