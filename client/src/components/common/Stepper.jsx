import React from 'react';
import { Check } from 'lucide-react';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 dark:bg-slate-800 -z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 -z-0"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div
              key={index}
              onClick={() => onStepClick && isCompleted && onStepClick(stepNumber)}
              className={`relative z-10 flex flex-col items-center group ${
                isCompleted ? 'cursor-pointer' : ''
              }`}
            >
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft'
                      : isCurrent
                      ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 shadow-glow ring-4 ring-indigo-500/10'
                      : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }
                `}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
              </div>

              {/* Step Label */}
              <div className="absolute top-12 flex flex-col items-center text-center w-28 -translate-x-0">
                <span
                  className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
                {step.subtitle && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                    {step.subtitle}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Spacer for bottom labels */}
      <div className="h-6" />
    </div>
  );
};

export default Stepper;
