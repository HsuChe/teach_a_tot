import React from 'react';

interface StepProgressBarProps {
  current: number;
  total: number;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ current, total }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isActive = step === current;
        const isCompleted = step < current;
        const isLastStep = index === total - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`step-dot w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-500 border-blue-600 shadow-lg active'
                    : isCompleted
                    ? 'bg-green-500 border-green-600'
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                }`}
              >
                {isCompleted && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                )}
              </div>
            </div>
            {!isLastStep && (
              <div
                className={`step-connector flex-grow h-1 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepProgressBar;